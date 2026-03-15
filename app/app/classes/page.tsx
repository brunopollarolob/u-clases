import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Clock3,
  Filter,
  GraduationCap,
  Mail,
  MessageCircle,
  MessageSquareQuote,
  Star,
  TrendingUp,
} from 'lucide-react';
import { getUserWithAccess } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FavoriteTutorButton } from '@/components/favorite-tutor-button';
import type { Tables } from '@/lib/supabase/types';
import { getAcademicStatusLabel } from '@/lib/academic-profile';

type CourseRow = Tables<'courses'>;
type TutorProfileRow = Tables<'tutor_profiles'>;
type UserRow = Tables<'users'>;
type TutorCourseRow = Tables<'tutor_courses'>;
type ReviewRow = Tables<'reviews'>;
type ClassRequestRow = Tables<'class_requests'>;
type FavoriteTutorRow = Tables<'favorite_tutors'>;

interface ClassesPageProps {
  searchParams?: {
    course?: string;
    maxRate?: string;
  };
}

function renderStars(rating: number) {
  const boundedRating = Math.max(0, Math.min(5, rating));

  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const filled = boundedRating >= starValue - 0.2;

    return (
      <Star
        key={`star-${index}`}
        className={`h-3.5 w-3.5 ${filled ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/35'}`}
      />
    );
  });
}

function parseMaxRate(raw?: string): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeWhatsAppLink(raw: string | null): { href: string; label: string } | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.includes('@')) return null;

  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (digitsOnly.length < 8) return null;

  return {
    href: `https://wa.me/${digitsOnly}`,
    label: trimmed,
  };
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (trimmed.length === 0 || !trimmed.includes('@')) return null;
  return trimmed;
}

export const dynamic = 'force-dynamic';

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const userData = await getUserWithAccess();
  const supabase = await createServiceClient();

  const selectedCourse = searchParams?.course?.trim() || '';
  const maxRate = parseMaxRate(searchParams?.maxRate);

  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, name')
    .order('id', { ascending: true });

  if (coursesError) {
    throw new Error('No se pudieron cargar los cursos.');
  }

  const allCourses = (coursesData || []) as CourseRow[];

  const { data: tutorProfilesData, error: tutorProfilesError } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (tutorProfilesError) {
    throw new Error('No se pudieron cargar los profesores disponibles.');
  }

  const tutorProfiles = (tutorProfilesData || []) as TutorProfileRow[];

  const userIds = Array.from(new Set(tutorProfiles.map((profile) => profile.user_id)));
  const profileIds = tutorProfiles.map((profile) => profile.id);

  const [
    { data: usersData, error: usersError },
    { data: tutorCoursesData, error: tutorCoursesError },
    { data: reviewsData, error: reviewsError },
    { data: acceptedRequestsData, error: acceptedRequestsError },
    { data: tutorRequestStatsData, error: tutorRequestStatsError },
    { data: favoritesData, error: favoritesError },
  ] =
    await Promise.all([
      userIds.length
        ? supabase
            .from('users')
            .select('id, full_name, supabase_user_id, avatar_url, academic_year, is_graduated, specialization')
            .in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? supabase.from('tutor_courses').select('*').in('tutor_profile_id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? supabase
            .from('reviews')
            .select('id, tutor_id, course_id, rating, comment, created_at')
            .in('tutor_id', profileIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      userData.dbUser.role === 'student' && profileIds.length
        ? supabase
            .from('class_requests')
            .select('tutor_profile_id, status')
            .eq('student_id', userData.dbUser.id)
            .in('tutor_profile_id', profileIds)
            .in('status', ['accepted', 'completed'])
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? supabase
            .from('class_requests')
            .select('tutor_profile_id, status, student_id')
            .in('tutor_profile_id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      userData.dbUser.role === 'student' && profileIds.length
        ? supabase
            .from('favorite_tutors')
            .select('tutor_profile_id')
            .eq('student_id', userData.dbUser.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (usersError) {
    throw new Error('No se pudieron cargar los nombres de profesores.');
  }

  if (tutorCoursesError) {
    throw new Error('No se pudieron cargar los cursos publicados por profesores.');
  }

  if (reviewsError) {
    throw new Error('No se pudieron cargar las reseñas públicas.');
  }

  if (acceptedRequestsError) {
    throw new Error('No se pudo validar acceso a datos de contacto.');
  }

  if (tutorRequestStatsError) {
    throw new Error('No se pudieron cargar métricas de reservas.');
  }

  if (favoritesError) {
    throw new Error('No se pudieron cargar los favoritos.');
  }

  const users = (usersData || []) as Pick<
    UserRow,
    'id' | 'full_name' | 'supabase_user_id' | 'avatar_url' | 'academic_year' | 'is_graduated' | 'specialization'
  >[];
  const tutorCourses = (tutorCoursesData || []) as TutorCourseRow[];
  const reviews = (reviewsData || []) as Pick<ReviewRow, 'id' | 'tutor_id' | 'course_id' | 'rating' | 'comment' | 'created_at'>[];
  const acceptedRequests = (acceptedRequestsData || []) as Pick<ClassRequestRow, 'tutor_profile_id' | 'status'>[];
  const tutorRequestStats = (tutorRequestStatsData || []) as Pick<ClassRequestRow, 'tutor_profile_id' | 'status' | 'student_id'>[];
  const favoriteTutorRows = (favoritesData || []) as Pick<FavoriteTutorRow, 'tutor_profile_id'>[];

  const courseById = new Map(allCourses.map((course) => [course.id, course]));
  const userById = new Map(users.map((user) => [user.id, user]));
  const userEmailById = new Map<number, string>();

  if (users.length > 0) {
    const authUsers = await Promise.all(
      users.map(async (user) => {
        const { data, error } = await supabase.auth.admin.getUserById(user.supabase_user_id);
        if (error || !data?.user?.email) {
          return { userId: user.id, email: null as string | null };
        }
        return { userId: user.id, email: data.user.email };
      })
    );

    for (const authUser of authUsers) {
      if (authUser.email) {
        userEmailById.set(authUser.userId, authUser.email);
      }
    }
  }

  const coursesByTutorProfile = new Map<number, CourseRow[]>();
  const recentCommentedReviewsByTutor = new Map<number, typeof reviews>();
  const allReviewsByTutor = new Map<number, typeof reviews>();
  const unlockedContactTutorProfileIds = new Set<number>(acceptedRequests.map((request) => request.tutor_profile_id));
  const favoriteTutorProfileIds = new Set<number>(favoriteTutorRows.map((row) => row.tutor_profile_id));
  const pendingRequestsByTutor = new Map<number, number>();
  const studentCountByTutor = new Map<number, number>();
  const completedClassCountByTutor = new Map<number, number>();

  for (const tutorCourse of tutorCourses) {
    const course = courseById.get(tutorCourse.course_id);
    if (!course) continue;

    const existing = coursesByTutorProfile.get(tutorCourse.tutor_profile_id) || [];
    existing.push(course);
    coursesByTutorProfile.set(tutorCourse.tutor_profile_id, existing);
  }

  for (const review of reviews) {
    const existingAllReviews = allReviewsByTutor.get(review.tutor_id) || [];
    existingAllReviews.push(review);
    allReviewsByTutor.set(review.tutor_id, existingAllReviews);

    if (!review.course_id) continue;

    if (review.comment && review.comment.trim().length > 0) {
      const existingByTutor = recentCommentedReviewsByTutor.get(review.tutor_id) || [];
      existingByTutor.push(review);
      recentCommentedReviewsByTutor.set(review.tutor_id, existingByTutor);
    }
  }

  for (const request of tutorRequestStats) {
    if (request.status === 'pending') {
      const current = pendingRequestsByTutor.get(request.tutor_profile_id) || 0;
      pendingRequestsByTutor.set(request.tutor_profile_id, current + 1);
    }

    if (request.status === 'completed') {
      const currentCompleted = completedClassCountByTutor.get(request.tutor_profile_id) || 0;
      completedClassCountByTutor.set(request.tutor_profile_id, currentCompleted + 1);
    }
  }

  for (const [tutorProfileId, requestsForTutor] of Array.from(
    tutorRequestStats.reduce((acc, request) => {
      const list = acc.get(request.tutor_profile_id) || [];
      list.push(request);
      acc.set(request.tutor_profile_id, list);
      return acc;
    }, new Map<number, typeof tutorRequestStats>())
  )) {
    const uniqueStudents = new Set(
      requestsForTutor
        .filter((request) => request.status === 'completed')
        .map((request) => request.student_id)
    );
    studentCountByTutor.set(tutorProfileId, uniqueStudents.size);
  }

  const tutors = tutorProfiles
    .map((profile) => {
      const courses = coursesByTutorProfile.get(profile.id) || [];
      const user = userById.get(profile.user_id);
      return {
        profile,
        courses,
        displayName: user?.full_name || 'Profesor/a U-clases',
        avatarUrl: user?.avatar_url || null,
        email: user ? userEmailById.get(user.id) || null : null,
        pendingReservations: pendingRequestsByTutor.get(profile.id) || 0,
        studentCount: studentCountByTutor.get(profile.id) || 0,
        completedClassCount: completedClassCountByTutor.get(profile.id) || 0,
        isFavorite: favoriteTutorProfileIds.has(profile.id),
        subjectCount: courses.length,
        specializationLabel:
          user?.specialization && user.specialization.trim().length > 0
            ? user.specialization
            : 'Especialidad no informada',
        academicStatusLabel: user
          ? getAcademicStatusLabel(user.is_graduated, user.academic_year)
          : 'Ano no informado',
      };
    })
    .filter((item) => item.courses.length > 0)
    .filter((item) => {
      const classPrice = item.profile.class_price ?? item.profile.hourly_rate;
      if (selectedCourse && !item.courses.some((course) => course.id === selectedCourse)) {
        return false;
      }
      if (maxRate && (!classPrice || classPrice > maxRate)) {
        return false;
      }
      return true;
    });

  const activePublishedTutorsCount = tutorProfiles.filter((profile) => {
    const profileCourses = coursesByTutorProfile.get(profile.id) || [];
    return profileCourses.length > 0;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buscar clases</h1>
            <p className="mt-1 text-muted-foreground">
              Explora profesores activos y los ramos que actualmente publicaron.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/app">Volver al inicio</Link>
          </Button>
        </div>

        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" method="GET">
              <div>
                <label htmlFor="course" className="mb-2 block text-sm font-medium text-foreground">
                  Ramo
                </label>
                <select
                  id="course"
                  name="course"
                  defaultValue={selectedCourse}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Todos</option>
                  {allCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.id} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="maxRate" className="mb-2 block text-sm font-medium text-foreground">
                  Max CLP/clase
                </label>
                <Input
                  id="maxRate"
                  name="maxRate"
                  type="number"
                  min={1000}
                  step={500}
                  defaultValue={searchParams?.maxRate || ''}
                  placeholder="20000"
                />
              </div>

              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" className="gradient-bg">
                  Aplicar filtros
                </Button>
                <Button type="button" asChild variant="outline">
                  <Link href="/app/classes">Limpiar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">Profesores activos publicados</p>
            <p className="text-lg font-semibold text-foreground">{activePublishedTutorsCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground">Resultados con filtros actuales</p>
            <p className="text-lg font-semibold text-foreground">{tutors.length}</p>
          </div>
        </div>

        {tutors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-foreground">No hay profesores que coincidan con los filtros actuales.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba quitando filtros o vuelve más tarde cuando haya nuevas publicaciones.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tutors.map(({ profile, courses, displayName, avatarUrl, email, pendingReservations, studentCount, subjectCount, completedClassCount, isFavorite, specializationLabel, academicStatusLabel }) => {
              const recentComments = (recentCommentedReviewsByTutor.get(profile.id) || []).slice(0, 2);
              const tutorReviews = allReviewsByTutor.get(profile.id) || [];
              const overallRating =
                tutorReviews.length > 0
                  ? tutorReviews.reduce((sum, review) => sum + review.rating, 0) / tutorReviews.length
                  : null;
              const whatsappContact = normalizeWhatsAppLink(profile.contact_info);
              const contactEmail = normalizeEmail(email);
              const initials = displayName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || 'UC';

              return (
                <Card
                  key={profile.id}
                  className="overflow-hidden border-border/80 bg-card transition-colors hover:border-primary/35"
                >
                  <CardHeader className="border-b border-border/60 bg-muted/15 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="inline-flex items-center gap-2 font-medium text-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Popular
                        <span className="text-muted-foreground">· {pendingReservations} reservas nuevas</span>
                      </p>
                      {userData.dbUser.role === 'student' ? (
                        <FavoriteTutorButton tutorProfileId={profile.id} initialIsFavorite={isFavorite} iconOnly />
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)_290px]">
                      <div className="space-y-3">
                        <Avatar className="h-44 w-full rounded-lg border border-border bg-muted/30">
                          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" /> : null}
                          <AvatarFallback className="rounded-lg bg-primary/10 text-lg font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2">
                          <div>
                            <CardTitle className="text-4xl leading-none font-bold text-foreground">{displayName}</CardTitle>
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {completedClassCount > 0 ? (
                                <p className="flex items-center gap-1.5">
                                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                                  Profesor verificado por U-clases
                                </p>
                              ) : null}
                              <p className="flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                {specializationLabel}
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5 text-primary" />
                                {academicStatusLabel}
                              </p>
                            </div>
                          </div>
                          {overallRating ? (
                            <div className="rounded-md border border-foreground/15 bg-foreground px-2.5 py-1 text-right text-background shadow-sm dark:border-background/20 dark:bg-background dark:text-foreground">
                              <p className="text-xs font-semibold">{overallRating.toFixed(1)} / 5</p>
                              <p className="text-[11px] font-medium opacity-90">{tutorReviews.length} reseñas</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-1.5 text-sm text-foreground">
                          <p className="text-muted-foreground">Ramos activos ({courses.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {courses.map((course) => (
                              <span
                                key={`${profile.id}-active-course-${course.id}`}
                                className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs text-foreground"
                              >
                                {course.id} - {course.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-background px-3 py-3 text-sm text-foreground">
                          {profile.summary_short || profile.bio
                            ? profile.summary_short || profile.bio
                            : 'Profesor certificado de U-clases con enfoque personalizado para cada estudiante.'}
                        </div>

                        <Link href={`/app/tutors/${profile.id}`} className="inline-flex items-center gap-1.5 text-lg font-semibold underline underline-offset-4 hover:text-primary">
                          Más información
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>

                        <div className="rounded-md border border-border p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <MessageSquareQuote className="h-4 w-4 text-primary" />
                            Comentarios recientes
                          </p>
                          {recentComments.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Aún no hay comentarios publicados.</p>
                          ) : (
                            <div className="space-y-2">
                              {recentComments.map((review) => (
                                <div key={review.id} className="rounded border border-border/70 bg-muted/20 px-2.5 py-2">
                                  <div className="mb-1 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">{review.course_id}</p>
                                    <span className="flex items-center gap-0.5">{renderStars(review.rating)}</span>
                                  </div>
                                  <p className="text-sm text-foreground">"{review.comment}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 rounded-lg border border-border/70 bg-background p-4">
                        <div>
                          {(() => {
                            const classPrice = profile.class_price ?? profile.hourly_rate;
                            const classDurationMinutes = profile.class_duration_minutes ?? 60;
                            return (
                              <>
                                <p className="text-5xl font-bold leading-none tracking-tight text-foreground">
                                  {classPrice ? `${classPrice.toLocaleString('es-CL')} $` : 'A convenir'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">Clase de {classDurationMinutes} minutos</p>
                              </>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-2 text-center">
                          <div className="text-center">
                            <p className="inline-flex items-center gap-1 text-2xl font-bold text-foreground">
                              {overallRating ? overallRating.toFixed(1) : '-'}
                              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                            </p>
                            <p className="text-[11px] text-muted-foreground">rating</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{studentCount}</p>
                            <p className="text-[11px] text-muted-foreground">estudiantes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{subjectCount}</p>
                            <p className="text-[11px] text-muted-foreground">ramos</p>
                          </div>
                        </div>

                        {userData.dbUser.role === 'student' ? (
                          <div>
                            <Button asChild className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                              <Link href={`/app/tutors/${profile.id}#solicitar`}>Solicitar clase con este profesor</Link>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                      {userData.dbUser.role !== 'student' || unlockedContactTutorProfileIds.has(profile.id) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            WhatsApp:{' '}
                            {whatsappContact ? (
                              <a
                                href={whatsappContact.href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-foreground underline-offset-2 hover:underline"
                              >
                                {whatsappContact.label}
                              </a>
                            ) : (
                              <span>No publicado</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                            <Mail className="h-4 w-4" />
                            Email:{' '}
                            {contactEmail ? (
                              <a
                                href={`mailto:${contactEmail}`}
                                className="font-medium text-foreground underline-offset-2 hover:underline"
                              >
                                {contactEmail}
                              </a>
                            ) : (
                              <span>No publicado</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          Contacto (WhatsApp y email) visible cuando el profesor acepte tu solicitud.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
