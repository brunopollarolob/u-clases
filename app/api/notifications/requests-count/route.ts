import { NextResponse } from 'next/server';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const userData = await getApiUser();
    const supabase = await createServiceClient();
    const requestSeenAt = userData.dbUser.request_notifications_seen_at || '1970-01-01T00:00:00.000Z';
    const reviewSeenAt = userData.dbUser.review_notifications_seen_at || '1970-01-01T00:00:00.000Z';

    if (userData.dbUser.role === 'tutor') {
      const { data: tutorProfile, error: tutorProfileError } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('user_id', userData.dbUser.id)
        .maybeSingle();

      if (tutorProfileError) {
        console.error('Error fetching tutor profile for notifications:', tutorProfileError);
        return NextResponse.json({ error: 'No se pudo calcular notificaciones' }, { status: 500 });
      }

      if (!tutorProfile) {
        return NextResponse.json({ count: 0, requestsCount: 0, reviewsCount: 0 });
      }

      const [pendingRequestsCountResult, newReviewsCountResult] = await Promise.all([
        supabase
          .from('class_requests')
          .select('id', { head: true, count: 'exact' })
          .eq('tutor_profile_id', tutorProfile.id)
          .eq('status', 'pending')
          .gt('updated_at', requestSeenAt),
        supabase
          .from('reviews')
          .select('id', { head: true, count: 'exact' })
          .eq('tutor_id', tutorProfile.id)
          .gt('created_at', reviewSeenAt),
      ]);

      if (pendingRequestsCountResult.error || newReviewsCountResult.error) {
        console.error('Error counting tutor notifications:', {
          pendingRequests: pendingRequestsCountResult.error,
          reviews: newReviewsCountResult.error,
        });
        return NextResponse.json({ error: 'No se pudo calcular notificaciones' }, { status: 500 });
      }

      const requestsCount = pendingRequestsCountResult.count || 0;
      const reviewsCount = newReviewsCountResult.count || 0;

      return NextResponse.json({
        count: requestsCount + reviewsCount,
        requestsCount,
        reviewsCount,
      });
    }

    const { count, error: countError } = await supabase
      .from('class_requests')
      .select('id', { head: true, count: 'exact' })
      .eq('student_id', userData.dbUser.id)
      .in('status', ['accepted', 'completed'])
      .gt('updated_at', requestSeenAt);

    if (countError) {
      console.error('Error counting student notifications:', countError);
      return NextResponse.json({ error: 'No se pudo calcular notificaciones' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0, requestsCount: count || 0, reviewsCount: 0 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in /api/notifications/requests-count:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
