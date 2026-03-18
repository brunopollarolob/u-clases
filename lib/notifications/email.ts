import 'server-only';

import { config } from '@/lib/config';

type Recipient = string | string[];

export interface SendEmailInput {
  to: Recipient;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  skipped?: boolean;
  providerMessageId?: string;
  error?: string;
}

function normalizeRecipients(to: Recipient): string[] {
  return Array.isArray(to) ? to : [to];
}

/**
 * Sends an email using the configured provider.
 *
 * Step 1 implementation: supports Resend and fails safely (skip mode)
 * if email notifications are disabled or missing API key.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { enabled, provider, from, replyTo, redirectTo, resendApiKey } = config.notifications.email;

  if (!enabled) {
    return { success: true, skipped: true };
  }

  if (provider !== 'resend') {
    return {
      success: false,
      error: `Unsupported email provider: ${provider}`,
    };
  }

  if (!resendApiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY is missing',
    };
  }

  try {
    const originalRecipients = normalizeRecipients(input.to);
    const effectiveRecipients = redirectTo ? [redirectTo] : originalRecipients;

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
      return {
        success: false,
        error: payload?.message || `Resend error (${response.status})`,
      };
    }

    return {
      success: true,
      providerMessageId: payload?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
