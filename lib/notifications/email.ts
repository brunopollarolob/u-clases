import 'server-only';

import { config } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase/server';

type Recipient = string | string[];

export interface SendEmailInput {
  to: Recipient;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  skipped?: boolean;
  duplicate?: boolean;
  providerMessageId?: string;
  error?: string;
}

function normalizeRecipients(to: Recipient): string[] {
  return Array.isArray(to) ? to : [to];
}

interface NotificationEventRow {
  event_key: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  provider_message_id: string | null;
  attempt_count: number;
}

async function getNotificationEventByKey(eventKey: string): Promise<NotificationEventRow | null> {
  const supabase = (await createServiceClient()) as any;
  const { data, error } = await supabase
    .from('notification_events')
    .select('event_key, status, provider_message_id, attempt_count')
    .eq('event_key', eventKey)
    .maybeSingle();

  if (error) {
    console.error('Failed to load notification event by key:', error);
    return null;
  }

  return (data || null) as NotificationEventRow | null;
}

async function upsertNotificationEvent(params: {
  eventKey: string;
  eventType: string;
  recipientEmail: string;
  effectiveRecipientEmail: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  provider?: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  payload?: Record<string, unknown>;
  attemptCount?: number;
  sentAt?: string | null;
}): Promise<void> {
  const supabase = (await createServiceClient()) as any;

  const { error } = await supabase
    .from('notification_events')
    .upsert(
      {
        event_key: params.eventKey,
        event_type: params.eventType,
        channel: 'email',
        recipient_email: params.recipientEmail,
        effective_recipient_email: params.effectiveRecipientEmail,
        status: params.status,
        provider: params.provider || 'resend',
        provider_message_id: params.providerMessageId || null,
        error_message: params.errorMessage || null,
        payload: params.payload || null,
        attempt_count: params.attemptCount ?? 1,
        sent_at: params.sentAt || null,
      },
      { onConflict: 'event_key' }
    );

  if (error) {
    console.error('Failed to upsert notification event:', error);
  }
}

/**
 * Sends an email using the configured provider.
 *
 * Step 1 implementation: supports Resend and fails safely (skip mode)
 * if email notifications are disabled or missing API key.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { enabled, provider, from, replyTo, redirectTo, resendApiKey } = config.notifications.email;
  const originalRecipients = normalizeRecipients(input.to);
  const effectiveRecipients = redirectTo ? [redirectTo] : originalRecipients;
  const eventKey = input.idempotencyKey || `email:${Date.now()}:${crypto.randomUUID()}`;
  const eventType = input.eventType || 'email.generic';
  const existingEvent = await getNotificationEventByKey(eventKey);

  if (input.idempotencyKey && existingEvent && ['sent', 'skipped'].includes(existingEvent.status)) {
    return {
      success: true,
      skipped: true,
      duplicate: true,
      providerMessageId: existingEvent.provider_message_id || undefined,
    };
  }

  const attemptCount = (existingEvent?.attempt_count || 0) + 1;

  await upsertNotificationEvent({
    eventKey,
    eventType,
    recipientEmail: originalRecipients.join(', '),
    effectiveRecipientEmail: effectiveRecipients.join(', '),
    status: 'pending',
    provider,
    payload: {
      ...(input.metadata || {}),
      subject: input.subject,
    },
    attemptCount,
  });

  if (!enabled) {
    await upsertNotificationEvent({
      eventKey,
      eventType,
      recipientEmail: originalRecipients.join(', '),
      effectiveRecipientEmail: effectiveRecipients.join(', '),
      status: 'skipped',
      provider,
      payload: {
        ...(input.metadata || {}),
        reason: 'EMAIL_NOTIFICATIONS_ENABLED is false',
        subject: input.subject,
      },
      attemptCount,
    });

    return { success: true, skipped: true };
  }

  if (provider !== 'resend') {
    const errorMessage = `Unsupported email provider: ${provider}`;

    await upsertNotificationEvent({
      eventKey,
      eventType,
      recipientEmail: originalRecipients.join(', '),
      effectiveRecipientEmail: effectiveRecipients.join(', '),
      status: 'failed',
      provider,
      errorMessage,
      payload: {
        ...(input.metadata || {}),
        subject: input.subject,
      },
      attemptCount,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  if (!resendApiKey) {
    const errorMessage = 'RESEND_API_KEY is missing';

    await upsertNotificationEvent({
      eventKey,
      eventType,
      recipientEmail: originalRecipients.join(', '),
      effectiveRecipientEmail: effectiveRecipients.join(', '),
      status: 'failed',
      provider,
      errorMessage,
      payload: {
        ...(input.metadata || {}),
        subject: input.subject,
      },
      attemptCount,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    const redirectNotice = redirectTo
      ? `<p style="font-size:12px;color:#6b7280;margin:0 0 10px;">[test mode] Intended recipients: ${originalRecipients.join(', ')}</p>`
      : '';

    const htmlWithRedirectNotice = redirectNotice ? `${redirectNotice}${input.html}` : input.html;
    const textWithRedirectNotice = redirectTo
      ? `[test mode] Intended recipients: ${originalRecipients.join(', ')}\n\n${input.text || ''}`.trim()
      : input.text;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: effectiveRecipients,
        subject: input.subject,
        html: htmlWithRedirectNotice,
        text: textWithRedirectNotice,
        reply_to: replyTo,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

    if (!response.ok) {
      const errorMessage = payload?.message || `Resend error (${response.status})`;

      await upsertNotificationEvent({
        eventKey,
        eventType,
        recipientEmail: originalRecipients.join(', '),
        effectiveRecipientEmail: effectiveRecipients.join(', '),
        status: 'failed',
        provider,
        errorMessage,
        payload: {
          ...(input.metadata || {}),
          subject: input.subject,
        },
        attemptCount,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    await upsertNotificationEvent({
      eventKey,
      eventType,
      recipientEmail: originalRecipients.join(', '),
      effectiveRecipientEmail: effectiveRecipients.join(', '),
      status: 'sent',
      provider,
      providerMessageId: payload?.id || null,
      payload: {
        ...(input.metadata || {}),
        subject: input.subject,
      },
      attemptCount,
      sentAt: new Date().toISOString(),
    });

    return {
      success: true,
      providerMessageId: payload?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error';

    await upsertNotificationEvent({
      eventKey,
      eventType,
      recipientEmail: originalRecipients.join(', '),
      effectiveRecipientEmail: effectiveRecipients.join(', '),
      status: 'failed',
      provider,
      errorMessage,
      payload: {
        ...(input.metadata || {}),
        subject: input.subject,
      },
      attemptCount,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
