import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';
import { sendEmail } from '@/lib/notifications/email';
import { buildClassRequestStatusEmail } from '@/lib/notifications/class-requests';

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

const updateClassRequestSchema = z.object({
  action: z.enum(['accept', 'reject', 'complete', 'cancel']),
  tutorResponse: z.string().trim().max(500).optional(),
});

function nextStatus(action: 'accept' | 'reject' | 'complete' | 'cancel'): RequestStatus {
  switch (action) {
    case 'accept':
      return 'accepted';
    case 'reject':
      return 'rejected';
    case 'complete':
      return 'completed';
    case 'cancel':
      return 'cancelled';
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getApiUser();
    const { id } = await context.params;
    const requestId = Number(id);

    if (!Number.isFinite(requestId) || requestId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateClassRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Payload inválido' }, { status: 400 });
    }

    const payload = parsed.data;
    const supabase = await createServiceClient();

    const { data: classRequest, error: classRequestError } = await supabase
      .from('class_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (classRequestError || !classRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (payload.action === 'cancel') {
      if (classRequest.student_id !== userData.dbUser.id) {
        return NextResponse.json({ error: 'Solo el estudiante puede cancelar su solicitud' }, { status: 403 });
      }

      if (!['pending', 'accepted'].includes(classRequest.status)) {
        return NextResponse.json({ error: 'Solo solicitudes activas se pueden cancelar' }, { status: 400 });
      }
    } else {
      const { data: tutorProfile, error: tutorProfileError } = await supabase
        .from('tutor_profiles')
        .select('id, user_id')
        .eq('id', classRequest.tutor_profile_id)
        .maybeSingle();

      if (tutorProfileError || !tutorProfile || tutorProfile.user_id !== userData.dbUser.id) {
        return NextResponse.json({ error: 'Solo el profesor puede gestionar esta solicitud' }, { status: 403 });
      }

      if (payload.action === 'accept' && classRequest.status !== 'pending') {
        return NextResponse.json({ error: 'Solo solicitudes pendientes se pueden aceptar' }, { status: 400 });
      }

      if (payload.action === 'reject' && classRequest.status !== 'pending') {
        return NextResponse.json({ error: 'Solo solicitudes pendientes se pueden rechazar' }, { status: 400 });
      }

      if (payload.action === 'complete' && classRequest.status !== 'accepted') {
        return NextResponse.json({ error: 'Solo solicitudes aceptadas se pueden marcar como completadas' }, { status: 400 });
      }
    }

    const status = nextStatus(payload.action);

    const { data: updatedRequest, error: updateError } = await supabase
      .from('class_requests')
      .update({
        status,
        tutor_response: payload.tutorResponse || classRequest.tutor_response,
        completed_at: status === 'completed' ? new Date().toISOString() : classRequest.completed_at,
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError || !updatedRequest) {
      console.error('Error updating class request:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar la solicitud' }, { status: 500 });
    }

    // Best-effort email notification for status updates.
    try {
      const [courseResult, studentResult, tutorProfileResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, name')
          .eq('id', classRequest.course_id)
          .maybeSingle(),
        supabase
          .from('users')
          .select('id, full_name, supabase_user_id')
          .eq('id', classRequest.student_id)
          .maybeSingle(),
        supabase
          .from('tutor_profiles')
          .select('id, user_id')
          .eq('id', classRequest.tutor_profile_id)
          .maybeSingle(),
      ]);

      const courseLabel = courseResult.data
        ? `${courseResult.data.id} · ${courseResult.data.name}`
        : classRequest.course_id;

      const actorName = userData.dbUser.full_name || 'Usuario U-clases';

      let recipientUserId: number | null = null;
      let recipientName = 'Usuario U-clases';

      // Student cancels -> notify tutor. Tutor actions -> notify student.
      if (payload.action === 'cancel') {
        if (tutorProfileResult.data?.user_id) {
          recipientUserId = tutorProfileResult.data.user_id;
        }
      } else {
        recipientUserId = classRequest.student_id;
        recipientName = studentResult.data?.full_name || recipientName;
      }

      if (recipientUserId) {
        const { data: recipientUserRow } = await supabase
          .from('users')
          .select('full_name, supabase_user_id')
          .eq('id', recipientUserId)
          .maybeSingle();

        recipientName = recipientUserRow?.full_name || recipientName;
        const recipientSupabaseUserId = recipientUserRow?.supabase_user_id;

        if (recipientSupabaseUserId) {
          const { data: authRecipientData, error: authRecipientError } = await supabase.auth.admin.getUserById(recipientSupabaseUserId);

          if (authRecipientError) {
            console.error('Could not load recipient auth user for status email:', authRecipientError);
          } else {
            const recipientEmail = authRecipientData.user?.email;

            if (recipientEmail) {
              const emailPayload = buildClassRequestStatusEmail({
                recipientName,
                actorName,
                courseLabel,
                status,
                requestsUrl: `${config.app.url}/app/requests`,
                tutorResponse: payload.tutorResponse,
              });

              const sendResult = await sendEmail({
                to: recipientEmail,
                subject: emailPayload.subject,
                html: emailPayload.html,
                text: emailPayload.text,
                idempotencyKey: `class-request:${updatedRequest.id}:status:${status}:recipient:${recipientUserId}`,
                eventType: 'class_request.status_changed.user_notified',
                metadata: {
                  requestId: updatedRequest.id,
                  status,
                  action: payload.action,
                  recipientUserId,
                  actorUserId: userData.dbUser.id,
                },
              });

              if (!sendResult.success) {
                console.error('Failed to send status notification email:', sendResult.error);
              }
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Unexpected error while sending status notification email:', notificationError);
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in PATCH /api/class-requests/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
