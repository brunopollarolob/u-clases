import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

const updateTutorProfileSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(1000).optional(),
    summaryShort: z.string().trim().max(220).optional(),
    summaryLong: z.string().trim().max(2500).optional(),
    classDurationMinutes: z.number().int().min(30).max(180).optional(),
    classPrice: z.number().int().min(1000).max(200000).nullable().optional(),
    hourlyRate: z.number().int().min(1000).max(200000).nullable().optional(),
    contactInfo: z.string().trim().max(200).optional(),
    isActive: z.boolean(),
    courseIds: z.array(z.string().trim().min(1)).max(30),
    taCourseIds: z.array(z.string().trim().min(1)).max(30).optional(),
  })
  .refine((data) => !data.isActive || data.courseIds.length >= 1, {
    message: 'Debes seleccionar al menos un ramo para publicar el perfil',
    path: ['courseIds'],
  });

const deactivateTutorProfileSchema = z.object({
  action: z.literal('deactivate'),
});

export async function GET() {
  try {
    const userData = await getApiUser();
    const supabase = await createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', userData.dbUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching tutor profile:', profileError);
      return NextResponse.json({ error: 'No se pudo cargar el perfil de profesor' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({
        profile: null,
        courseIds: [],
        taCourseIds: [],
        role: userData.dbUser.role,
      });
    }

    const { data: tutorCourses, error: tutorCoursesError } = await supabase
      .from('tutor_courses')
      .select('course_id, is_ta')
      .eq('tutor_profile_id', profile.id);

    if (tutorCoursesError) {
      console.error('Error fetching tutor courses:', tutorCoursesError);
      return NextResponse.json({ error: 'No se pudieron cargar los ramos del profesor' }, { status: 500 });
    }

    return NextResponse.json({
      profile,
      courseIds: (tutorCourses || []).map((item) => item.course_id),
      taCourseIds: (tutorCourses || []).filter((item) => item.is_ta).map((item) => item.course_id),
      role: userData.dbUser.role,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in GET /api/tutor/profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await getApiUser();
    const body = await request.json();
    const parsed = updateTutorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Payload invalido' },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const classPrice = payload.classPrice ?? payload.hourlyRate ?? null;
    const classDurationMinutes = payload.classDurationMinutes ?? 60;
    const taCourseIds = payload.taCourseIds || [];
    const supabase = await createServiceClient();

    const taCourseIdsAreSubset = taCourseIds.every((courseId) => payload.courseIds.includes(courseId));
    if (!taCourseIdsAreSubset) {
      return NextResponse.json({ error: 'Los ramos marcados como auxiliar deben estar seleccionados en tu perfil' }, { status: 400 });
    }

    const { data: validCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .in('id', payload.courseIds);

    if (coursesError) {
      console.error('Error validating courses:', coursesError);
      return NextResponse.json({ error: 'No se pudieron validar los ramos' }, { status: 500 });
    }

    if (!validCourses || validCourses.length !== payload.courseIds.length) {
      return NextResponse.json({ error: 'Uno o mas ramos son invalidos' }, { status: 400 });
    }

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        role: 'tutor',
        full_name: payload.fullName || null,
      })
      .eq('id', userData.dbUser.id);

    if (updateUserError) {
      console.error('Error updating user role/profile:', updateUserError);
      return NextResponse.json({ error: 'No se pudo actualizar el usuario' }, { status: 500 });
    }

    const { data: upsertedProfile, error: upsertProfileError } = await supabase
      .from('tutor_profiles')
      .upsert(
        {
          user_id: userData.dbUser.id,
          bio: payload.summaryLong || payload.bio || null,
          hourly_rate: classPrice,
          class_duration_minutes: classDurationMinutes,
          class_price: classPrice,
          contact_info: payload.contactInfo || null,
          summary_short: payload.summaryShort || null,
          summary_long: payload.summaryLong || payload.bio || null,
          is_active: payload.isActive,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (upsertProfileError || !upsertedProfile) {
      console.error('Error upserting tutor profile:', upsertProfileError);
      return NextResponse.json({ error: 'No se pudo guardar el perfil de profesor' }, { status: 500 });
    }

    const { error: deleteCoursesError } = await supabase
      .from('tutor_courses')
      .delete()
      .eq('tutor_profile_id', upsertedProfile.id);

    if (deleteCoursesError) {
      console.error('Error clearing tutor courses:', deleteCoursesError);
      return NextResponse.json({ error: 'No se pudieron actualizar los ramos' }, { status: 500 });
    }

    if (payload.courseIds.length > 0) {
      const courseRows = payload.courseIds.map((courseId) => ({
        tutor_profile_id: upsertedProfile.id,
        course_id: courseId,
        is_ta: taCourseIds.includes(courseId),
      }));

      const { error: insertCoursesError } = await supabase.from('tutor_courses').insert(courseRows);

      if (insertCoursesError) {
        console.error('Error inserting tutor courses:', insertCoursesError);
        return NextResponse.json({ error: 'No se pudieron guardar los ramos' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      profile: upsertedProfile,
      courseIds: payload.courseIds,
      taCourseIds,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in PUT /api/tutor/profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userData = await getApiUser();
    const body = await request.json();
    const parsed = deactivateTutorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Payload invalido' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', userData.dbUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching tutor profile for deactivation:', profileError);
      return NextResponse.json({ error: 'No se pudo cargar el perfil de profesor' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'No tienes un perfil de profesor activo para dar de baja' }, { status: 400 });
    }

    const { error: deactivateError } = await supabase
      .from('tutor_profiles')
      .update({ is_active: false })
      .eq('id', profile.id);

    if (deactivateError) {
      console.error('Error deactivating tutor profile:', deactivateError);
      return NextResponse.json({ error: 'No se pudo dar de baja el perfil' }, { status: 500 });
    }

    const { error: clearCoursesError } = await supabase
      .from('tutor_courses')
      .delete()
      .eq('tutor_profile_id', profile.id);

    if (clearCoursesError) {
      console.error('Error clearing tutor courses during deactivation:', clearCoursesError);
      return NextResponse.json({ error: 'No se pudieron quitar los ramos del perfil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      message: 'Perfil de profesor dado de baja correctamente.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in PATCH /api/tutor/profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
