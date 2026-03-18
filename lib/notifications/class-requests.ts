export interface NewClassRequestEmailInput {
  tutorName: string;
  studentName: string;
  courseLabel: string;
  studentNote?: string | null;
  requestsUrl: string;
}

export type ClassRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface ClassRequestStatusEmailInput {
  recipientName: string;
  actorName: string;
  courseLabel: string;
  status: ClassRequestStatus;
  requestsUrl: string;
  tutorResponse?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildNewClassRequestEmail(input: NewClassRequestEmailInput) {
  const tutorName = escapeHtml(input.tutorName);
  const studentName = escapeHtml(input.studentName);
  const courseLabel = escapeHtml(input.courseLabel);
  const requestsUrl = escapeHtml(input.requestsUrl);
  const note = input.studentNote?.trim() ? escapeHtml(input.studentNote.trim()) : null;

  const subject = `Nueva solicitud de clase: ${input.courseLabel}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Tienes una nueva solicitud de clase</h2>
      <p style="margin: 0 0 12px;">Hola ${tutorName},</p>
      <p style="margin: 0 0 12px;"><strong>${studentName}</strong> te envió una solicitud para el ramo <strong>${courseLabel}</strong>.</p>
      ${
        note
          ? `<p style="margin: 0 0 12px;"><strong>Mensaje del estudiante:</strong><br/>${note}</p>`
          : ''
      }
      <p style="margin: 0 0 20px;">Puedes revisarla y responder desde tu panel.</p>
      <p style="margin: 0 0 20px;">
        <a href="${requestsUrl}" style="display: inline-block; padding: 10px 14px; background: #0f5bd7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Ir a solicitudes
        </a>
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">U-clases · Beauchef</p>
    </div>
  `;

  const textLines = [
    'Tienes una nueva solicitud de clase',
    '',
    `Hola ${input.tutorName},`,
    '',
    `${input.studentName} te envio una solicitud para el ramo ${input.courseLabel}.`,
    input.studentNote?.trim() ? `Mensaje del estudiante: ${input.studentNote.trim()}` : '',
    '',
    `Revisala en: ${input.requestsUrl}`,
    '',
    'U-clases · Beauchef',
  ].filter(Boolean);

  return {
    subject,
    html,
    text: textLines.join('\n'),
  };
}

function statusToLabel(status: ClassRequestStatus): string {
  switch (status) {
    case 'accepted':
      return 'aceptada';
    case 'rejected':
      return 'rechazada';
    case 'completed':
      return 'marcada como completada';
    case 'cancelled':
      return 'cancelada';
    case 'pending':
    default:
      return 'actualizada';
  }
}

export function buildClassRequestStatusEmail(input: ClassRequestStatusEmailInput) {
  const recipientName = escapeHtml(input.recipientName);
  const actorName = escapeHtml(input.actorName);
  const courseLabel = escapeHtml(input.courseLabel);
  const requestsUrl = escapeHtml(input.requestsUrl);
  const response = input.tutorResponse?.trim() ? escapeHtml(input.tutorResponse.trim()) : null;
  const statusLabel = statusToLabel(input.status);

  const subject = `Actualizacion de solicitud: ${input.courseLabel}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Tu solicitud fue ${statusLabel}</h2>
      <p style="margin: 0 0 12px;">Hola ${recipientName},</p>
      <p style="margin: 0 0 12px;"><strong>${actorName}</strong> actualizo la solicitud del ramo <strong>${courseLabel}</strong>.</p>
      ${
        response
          ? `<p style="margin: 0 0 12px;"><strong>Mensaje del profesor:</strong><br/>${response}</p>`
          : ''
      }
      <p style="margin: 0 0 20px;">Puedes revisar el detalle en tu panel de solicitudes.</p>
      <p style="margin: 0 0 20px;">
        <a href="${requestsUrl}" style="display: inline-block; padding: 10px 14px; background: #0f5bd7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Ir a solicitudes
        </a>
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">U-clases · Beauchef</p>
    </div>
  `;

  const textLines = [
    `Tu solicitud fue ${statusLabel}`,
    '',
    `Hola ${input.recipientName},`,
    '',
    `${input.actorName} actualizo la solicitud del ramo ${input.courseLabel}.`,
    input.tutorResponse?.trim() ? `Mensaje del profesor: ${input.tutorResponse.trim()}` : '',
    '',
    `Revisala en: ${input.requestsUrl}`,
    '',
    'U-clases · Beauchef',
  ].filter(Boolean);

  return {
    subject,
    html,
    text: textLines.join('\n'),
  };
}
