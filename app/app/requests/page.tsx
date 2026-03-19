import Link from 'next/link';
import { Bell, ClipboardList, LayoutPanelLeft, Sparkles } from 'lucide-react';
import { getUserWithAccess } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { RequestsBoard } from '@/components/requests-board';
import type { Tables } from '@/lib/supabase/types';
import { getAcademicSummary } from '@/lib/academic-profile';

type UserRow = Tables<'users'>;
type CourseRow = Tables<'courses'>;
type TutorProfileRow = Tables<'tutor_profiles'>;
type ClassRequestRow = Tables<'class_requests'>;
type ReviewRow = Tables<'reviews'>;

interface RequestsPageProps {
  searchParams?: Promise<{
    created?: string;
  }>;
}

function extractAuthDisplayName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const data = metadata as Record<string, unknown>;
  const candidates = [
    data.full_name,
    data.name,
    data.display_name,
    [data.given_name, data.family_name].filter(Boolean).join(' ').trim(),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

export const dynamic = 'force-dynamic';

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const userData = await getUserWithAccess();
  const supabase = await createServiceClient();
  const resolvedSearchParams = await searchParams;

  // Opening this screen marks request-related notifications as seen.
  await supabase
    .from('users')
    .update({ request_notifications_seen_at: new Date().toISOString() })
    .eq('id', userData.dbUser.id);

  const initialNotice = resolvedSearchParams?.created === '1' ? 'Solicitud creada. Ahora puedes seguir el estado desde aquí.' : '';

  const studentRequestsQuery = await supabase
    .from('class_requests')
    .select('*')
    .eq('student_id', userData.dbUser.id)
    .order('created_at', { ascending: false });

  if (studentRequestsQuery.error) {
    throw new Error('No se pudieron cargar tus solicitudes enviadas');
  }

  const studentRequests = (studentRequestsQuery.data || []) as ClassRequestRow[];

  let tutorIncomingRequests: ClassRequestRow[] = [];
  let tutorProfile: TutorProfileRow | null = null;

  if (userData.dbUser.role === 'tutor') {
    const tutorProfileQuery = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', userData.dbUser.id)
      .maybeSingle();

    if (tutorProfileQuery.error) {
      throw new Error('No se pudo cargar tu perfil de profesor para gestionar solicitudes');
    }

    tutorProfile = (tutorProfileQuery.data as TutorProfileRow | null) ?? null;

    if (tutorProfile) {
      const incomingQuery = await supabase
        .from('class_requests')
        .select('*')
        .eq('tutor_profile_id', tutorProfile.id)
        .order('created_at', { ascending: false });

      if (incomingQuery.error) {
        throw new Error('No se pudieron cargar las solicitudes recibidas');
      }

      tutorIncomingRequests = (incomingQuery.data || []) as ClassRequestRow[];
    }
  }

  const tutorProfileIds = Array.from(
    new Set([...studentRequests.map((item) => item.tutor_profile_id), ...tutorIncomingRequests.map((item) => item.tutor_profile_id)])
  );
  const studentIdsIncoming = Array.from(new Set(tutorIncomingRequests.map((item) => item.student_id)));
  const allCourseIds = Array.from(new Set([...studentRequests.map((item) => item.course_id), ...tutorIncomingRequests.map((item) => item.course_id)]));

  const [profilesQuery, coursesQuery, incomingStudentsQuery, reviewsQuery] = await Promise.all([
    tutorProfileIds.length
      ? supabase.from('tutor_profiles').select('id, user_id').in('id', tutorProfileIds)
      : Promise.resolve({ data: [] as Pick<TutorProfileRow, 'id' | 'user_id'>[], error: null }),
    allCourseIds.length
      ? supabase.from('courses').select('id, name').in('id', allCourseIds)
      : Promise.resolve({ data: [] as CourseRow[], error: null }),
    studentIdsIncoming.length
      ? supabase
          .from('users')
          .select('id, full_name, supabase_user_id, specialization, is_graduated, academic_year')
          .in('id', studentIdsIncoming)
      : Promise.resolve({
          data: [] as Array<
            Pick<UserRow, 'id' | 'full_name' | 'supabase_user_id' | 'specialization' | 'is_graduated' | 'academic_year'>
          >,
          error: null,
        }),
    tutorProfileIds.length
      ? supabase
          .from('reviews')
          .select('*')
          .eq('student_id', userData.dbUser.id)
          .in('tutor_id', tutorProfileIds)
          .in('course_id', allCourseIds)
      : Promise.resolve({ data: [] as ReviewRow[], error: null }),
  ]);

  if (profilesQuery.error || coursesQuery.error || incomingStudentsQuery.error || reviewsQuery.error) {
    throw new Error('No se pudieron preparar los datos del panel de solicitudes');
  }

  const profiles = (profilesQuery.data || []) as Pick<TutorProfileRow, 'id' | 'user_id'>[];
  const courses = (coursesQuery.data || []) as CourseRow[];
  const incomingStudents = (incomingStudentsQuery.data || []) as Array<
    Pick<UserRow, 'id' | 'full_name' | 'supabase_user_id' | 'specialization' | 'is_graduated' | 'academic_year'>
  >;
  const reviews = (reviewsQuery.data || []) as ReviewRow[];

  const tutorOwnerIds = Array.from(new Set(profiles.map((item) => item.user_id)));
  const tutorUsersQuery = tutorOwnerIds.length
    ? await supabase.from('users').select('id, full_name, supabase_user_id').in('id', tutorOwnerIds)
    : { data: [] as Array<Pick<UserRow, 'id' | 'full_name' | 'supabase_user_id'>>, error: null };

  if (tutorUsersQuery.error) {
    throw new Error('No se pudieron cargar nombres de profesores');
  }

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const profileById = new Map(profiles.map((profileItem) => [profileItem.id, profileItem]));
  const tutorUserById = new Map((tutorUsersQuery.data || []).map((user) => [user.id, user]));
  const incomingStudentById = new Map(incomingStudents.map((student) => [student.id, student]));
  const reviewByTutorCourse = new Map(reviews.map((review) => [`${review.tutor_id}:${review.course_id || ''}`, review]));

  const missingIncomingStudentSupabaseIds = incomingStudents
    .filter((student) => !student.full_name)
    .map((student) => student.supabase_user_id);

  const missingTutorSupabaseIds = (tutorUsersQuery.data || [])
    .filter((user) => !user.full_name)
    .map((user) => user.supabase_user_id);

  const fallbackEmailBySupabaseId = new Map<string, string>();
  const fallbackNameBySupabaseId = new Map<string, string>();
  const missingSupabaseIds = Array.from(new Set([...missingIncomingStudentSupabaseIds, ...missingTutorSupabaseIds]));

  if (missingSupabaseIds.length > 0) {
    const authUsers = await Promise.all(
      missingSupabaseIds.map(async (supabaseUserId) => {
        const { data, error } = await supabase.auth.admin.getUserById(supabaseUserId);
        if (error || !data?.user) {
          return { supabaseUserId, email: null as string | null, name: null as string | null };
        }

        return {
          supabaseUserId,
          email: data.user.email,
          name: extractAuthDisplayName(data.user.user_metadata),
        };
      })
    );

    for (const item of authUsers) {
      if (item.name) {
        fallbackNameBySupabaseId.set(item.supabaseUserId, item.name);
      }
      if (item.email) {
        fallbackEmailBySupabaseId.set(item.supabaseUserId, item.email);
      }
    }

    // Self-heal user profiles: if DB full_name is missing but auth metadata has a name,
    // persist it so future reads do not depend on metadata fallback.
    const fullNameBackfills = authUsers
      .filter((item) => item.name)
      .map((item) =>
        supabase
          .from('users')
          .update({ full_name: item.name })
          .eq('supabase_user_id', item.supabaseUserId)
          .is('full_name', null)
      );

    if (fullNameBackfills.length > 0) {
      await Promise.all(fullNameBackfills);
    }
  }

  const studentRequestsView = studentRequests.map((request) => {
    const profileRef = profileById.get(request.tutor_profile_id);
    const tutorUser = profileRef ? tutorUserById.get(profileRef.user_id) : null;
    const course = courseById.get(request.course_id);
    const review = reviewByTutorCourse.get(`${request.tutor_profile_id}:${request.course_id}`);

    return {
      id: request.id,
      tutorProfileId: request.tutor_profile_id,
      courseId: request.course_id,
      tutorName:
        tutorUser?.full_name ||
        (tutorUser?.supabase_user_id ? fallbackNameBySupabaseId.get(tutorUser.supabase_user_id) : null) ||
        (tutorUser?.supabase_user_id ? fallbackEmailBySupabaseId.get(tutorUser.supabase_user_id) : null) ||
        'Profesor/a',
      courseLabel: course ? `${course.id} - ${course.name}` : request.course_id,
      status: request.status as 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled',
      studentNote: request.student_note,
      tutorResponse: request.tutor_response,
      createdAt: request.created_at,
      completedAt: request.completed_at,
      review: review ? { rating: review.rating, comment: review.comment } : null,
    };
  });

  const tutorIncomingView = tutorIncomingRequests.map((request) => {
    const student = incomingStudentById.get(request.student_id);
    const course = courseById.get(request.course_id);

    return {
      id: request.id,
      studentName:
        student?.full_name ||
        (student?.supabase_user_id ? fallbackNameBySupabaseId.get(student.supabase_user_id) : null) ||
        (student?.supabase_user_id ? fallbackEmailBySupabaseId.get(student.supabase_user_id) : null) ||
        `Alumno/a (${student?.supabase_user_id.slice(0, 8) || 'sin-nombre'})`,
      studentAcademicSummary: student
        ? getAcademicSummary(student.specialization, student.is_graduated, student.academic_year)
        : 'Perfil académico no informado',
      courseLabel: course ? `${course.id} - ${course.name}` : request.course_id,
      status: request.status as 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled',
      studentNote: request.student_note,
      tutorResponse: request.tutor_response,
      createdAt: request.created_at,
    };
  });

  const pendingIncomingCount = tutorIncomingView.filter((item) => item.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LayoutPanelLeft className="h-3.5 w-3.5" />
            Flujo completo de clases
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Panel de solicitudes</h1>
              <p className="mt-1 text-muted-foreground">
                Gestión centralizada de solicitudes, estados de clases y reseñas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {userData.dbUser.role === 'tutor' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Bell className="h-3.5 w-3.5" />
                  {pendingIncomingCount} pendiente(s)
                </span>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Desde este panel se gestiona todo el flujo: solicitud, aceptación, completado y reseña.
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
        </div>

        <RequestsBoard
          userRole={userData.dbUser.role}
          studentRequests={studentRequestsView}
          tutorIncomingRequests={tutorIncomingView}
          initialNotice={initialNotice}
        />
      </div>
    </div>
  );
}
