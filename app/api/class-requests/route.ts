import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

const createClassRequestSchema = z.object({
  tutorProfileId: z.number().int().positive(),
  courseId: z.string().trim().min(1),
  studentNote: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userData = await getApiUser();

    if (userData.dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Solo estudiantes pueden solicitar clases' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createClassRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Payload invalido' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const payload = parsed.data;

    const { data: profile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('id, is_active')
      .eq('id', payload.tutorProfileId)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json({ error: 'Profesor no disponible' }, { status: 400 });
    }

    const { data: teachesCourse, error: teachesCourseError } = await supabase
      .from('tutor_courses')
      .select('course_id')
      .eq('tutor_profile_id', payload.tutorProfileId)
      .eq('course_id', payload.courseId)
      .maybeSingle();

    if (teachesCourseError || !teachesCourse) {
      return NextResponse.json({ error: 'El profesor no tiene publicado ese ramo' }, { status: 400 });
    }

    const { data: existingRequest, error: existingError } = await supabase
      .from('class_requests')
      .select('id, status')
      .eq('student_id', userData.dbUser.id)
      .eq('tutor_profile_id', payload.tutorProfileId)
      .eq('course_id', payload.courseId)
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing request:', existingError);
      return NextResponse.json({ error: 'No se pudo validar la solicitud' }, { status: 500 });
    }

    if (existingRequest) {
      return NextResponse.json({ error: 'Ya tienes una solicitud activa para este ramo' }, { status: 409 });
    }

    const { data: classRequest, error: insertError } = await supabase
      .from('class_requests')
      .insert({
        tutor_profile_id: payload.tutorProfileId,
        student_id: userData.dbUser.id,
        course_id: payload.courseId,
        status: 'pending',
        student_note: payload.studentNote || null,
      })
      .select('*')
      .single();

    if (insertError || !classRequest) {
      console.error('Error creating class request:', insertError);
      return NextResponse.json({ error: 'No se pudo crear la solicitud' }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: classRequest });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in POST /api/class-requests:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
