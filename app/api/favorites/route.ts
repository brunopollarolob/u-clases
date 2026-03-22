import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

const favoritePayloadSchema = z.object({
  tutorProfileId: z.number().int().positive(),
});

export async function GET() {
  try {
    const userData = await getApiUser();

    if (userData.dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Solo estudiantes pueden consultar favoritos' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('favorite_tutors')
      .select('tutor_profile_id')
      .eq('student_id', userData.dbUser.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'No se pudieron cargar favoritos' }, { status: 500 });
    }

    const tutorProfileIds = (data || []).map((row) => row.tutor_profile_id);
    return NextResponse.json({ success: true, tutorProfileIds });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in GET /api/favorites:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getApiUser();

    if (userData.dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Solo estudiantes pueden guardar favoritos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = favoritePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Payload inválido' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { tutorProfileId } = parsed.data;

    const { data: profile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('id, is_active')
      .eq('id', tutorProfileId)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json({ error: 'Profesor no disponible' }, { status: 400 });
    }

    const { error } = await supabase
      .from('favorite_tutors')
      .insert({
        student_id: userData.dbUser.id,
        tutor_profile_id: tutorProfileId,
      });

    if (error) {
      // duplicate key: already favorited
      if (error.code === '23505') {
        return NextResponse.json({ success: true, alreadyExists: true });
      }

      console.error('Error saving favorite:', error);
      return NextResponse.json({ error: 'No se pudo guardar favorito' }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in POST /api/favorites:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userData = await getApiUser();

    if (userData.dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Solo estudiantes pueden quitar favoritos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = favoritePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Payload inválido' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('favorite_tutors')
      .delete()
      .eq('student_id', userData.dbUser.id)
      .eq('tutor_profile_id', parsed.data.tutorProfileId);

    if (error) {
      console.error('Error deleting favorite:', error);
      return NextResponse.json({ error: 'No se pudo quitar favorito' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in DELETE /api/favorites:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
