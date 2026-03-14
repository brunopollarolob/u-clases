import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

const createReviewSchema = z.object({
  tutorProfileId: z.number().int().positive(),
  courseId: z.string().trim().min(1).max(10),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userData = await getApiUser();

    if (userData.dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Solo estudiantes pueden crear reseñas' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Payload invalido' }, { status: 400 });
    }

    const payload = parsed.data;
    const supabase = await createServiceClient();

    const { data: completedRequest, error: completedRequestError } = await supabase
      .from('class_requests')
      .select('id')
      .eq('student_id', userData.dbUser.id)
      .eq('tutor_profile_id', payload.tutorProfileId)
      .eq('course_id', payload.courseId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    if (completedRequestError) {
      console.error('Error verifying completed class request:', completedRequestError);
      return NextResponse.json({ error: 'No se pudo verificar la clase completada' }, { status: 500 });
    }

    if (!completedRequest) {
      return NextResponse.json(
        { error: 'Solo puedes reseñar despues de que el profesor marque la clase como completada' },
        { status: 403 }
      );
    }

    const { data: existingReview, error: existingReviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('student_id', userData.dbUser.id)
      .eq('tutor_id', payload.tutorProfileId)
      .eq('course_id', payload.courseId)
      .maybeSingle();

    if (existingReviewError) {
      console.error('Error checking existing review:', existingReviewError);
      return NextResponse.json({ error: 'No se pudo validar la reseña actual' }, { status: 500 });
    }

    if (existingReview) {
      const { data: updatedReview, error: updateReviewError } = await supabase
        .from('reviews')
        .update({ rating: payload.rating, comment: payload.comment || null })
        .eq('id', existingReview.id)
        .select('*')
        .single();

      if (updateReviewError || !updatedReview) {
        console.error('Error updating review:', updateReviewError);
        return NextResponse.json({ error: 'No se pudo actualizar la reseña' }, { status: 500 });
      }

      return NextResponse.json({ success: true, review: updatedReview, updated: true });
    }

    const { data: review, error: insertReviewError } = await supabase
      .from('reviews')
      .insert({
        student_id: userData.dbUser.id,
        tutor_id: payload.tutorProfileId,
        course_id: payload.courseId,
        rating: payload.rating,
        comment: payload.comment || null,
      })
      .select('*')
      .single();

    if (insertReviewError || !review) {
      console.error('Error creating review:', insertReviewError);
      return NextResponse.json({ error: 'No se pudo crear la reseña' }, { status: 500 });
    }

    return NextResponse.json({ success: true, review, updated: false });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in POST /api/reviews:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
