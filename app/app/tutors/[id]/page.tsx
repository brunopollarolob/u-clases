import Link from 'next/link';
import {
  ChevronRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Lock,
  Mail,
  MessageCircle,
  MessageSquareQuote,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { getUserWithAccess } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestClassInline } from '@/components/request-class-inline';
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

interface TutorDetailPageProps {
  params: Promise<{ id: string }>;
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

export default async function TutorDetailPage({ params }: TutorDetailPageProps) {
  const { id } = await params;
  const tutorProfileId = Number(id);

  if (!Number.isFinite(tutorProfileId) || tutorProfileId <= 0) {
    throw new Error('Perfil de profesor inválido');
  }

  const userData = await getUserWithAccess();
  const supabase = await createServiceClient();

  const { data: tutorProfileData, error: tutorProfileError } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', tutorProfileId)
    .eq('is_active', true)
    .maybeSingle();

  if (tutorProfileError) {
    throw new Error('No se pudo cargar el perfil del profesor');
  }

  if (!tutorProfileData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="space-y-4 py-8 text-center">
              <p className="text-foreground">Este perfil ya no está disponible.</p>
              <Button asChild variant="outline">
                <Link href="/app/classes">Volver a Buscar clases</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tutorProfile = tutorProfileData as TutorProfileRow;

  const [
    { data: tutorUserData, error: tutorUserError },
    { data: coursesData, error: coursesError },
    { data: tutorCoursesData, error: tutorCoursesError },
    { data: reviewsData, error: reviewsError },
    { data: acceptedRequestData, error: acceptedRequestError },
    { count: completedClassCount, error: completedClassCountError },
    { data: favoriteRowData, error: favoriteRowError },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, supabase_user_id, avatar_url, academic_year, is_graduated, specialization')
      .eq('id', tutorProfile.user_id)
      .maybeSingle(),
    supabase.from('courses').select('id, name'),
    supabase.from('tutor_courses').select('*').eq('tutor_profile_id', tutorProfile.id),
    supabase
      .from('reviews')
      .select('id, tutor_id, course_id, rating, comment, created_at')
      .eq('tutor_id', tutorProfile.id)
      .order('created_at', { ascending: false }),
    userData.dbUser.role === 'student'
      ? supabase
          .from('class_requests')
          .select('id')
          .eq('student_id', userData.dbUser.id)
          .eq('tutor_profile_id', tutorProfile.id)
          .in('status', ['accepted', 'completed'])
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as Pick<ClassRequestRow, 'id'> | null, error: null }),
    supabase
      .from('class_requests')
      .select('id', { count: 'exact', head: true })
      .eq('tutor_profile_id', tutorProfile.id)
      .eq('status', 'completed'),
    userData.dbUser.role === 'student'
      ? supabase
          .from('favorite_tutors')
          .select('student_id, tutor_profile_id')
          .eq('student_id', userData.dbUser.id)
          .eq('tutor_profile_id', tutorProfile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as Pick<FavoriteTutorRow, 'student_id' | 'tutor_profile_id'> | null, error: null }),
  ]);

  if (tutorUserError || coursesError || tutorCoursesError || reviewsError || acceptedRequestError || completedClassCountError || favoriteRowError) {
    throw new Error('No se pudieron cargar los datos del profesor');
  }

  const tutorUser = tutorUserData as Pick<
    UserRow,
    'id' | 'full_name' | 'supabase_user_id' | 'avatar_url' | 'academic_year' | 'is_graduated' | 'specialization'
  > | null;
  const allCourses = (coursesData || []) as CourseRow[];
  const tutorCourses = (tutorCoursesData || []) as TutorCourseRow[];
  const reviews = (reviewsData || []) as Pick<ReviewRow, 'id' | 'course_id' | 'rating' | 'comment' | 'created_at'>[];

  const courseById = new Map(allCourses.map((course) => [course.id, course]));
  const courses = tutorCourses
    .map((tutorCourse) => {
      const course = courseById.get(tutorCourse.course_id);
      if (!course) return null;
      return {
        ...course,
        is_ta: Boolean(tutorCourse.is_ta),
      } as CourseRow & { is_ta: boolean };
    })
    .filter((course): course is CourseRow & { is_ta: boolean } => Boolean(course));

  const reviewsByCourse = new Map<string, typeof reviews>();
  for (const review of reviews) {
    if (!review.course_id) continue;
    const existing = reviewsByCourse.get(review.course_id) || [];
    existing.push(review);
    reviewsByCourse.set(review.course_id, existing);
  }

  const recentComments = reviews.filter((review) => Boolean(review.comment?.trim())).slice(0, 3);
  const overallRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  let tutorEmail: string | null = null;
  if (tutorUser?.supabase_user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(tutorUser.supabase_user_id);
    if (!error) {
      tutorEmail = data.user?.email || null;
    }
  }

  const whatsappContact = normalizeWhatsAppLink(tutorProfile.contact_info);
  const contactEmail = normalizeEmail(tutorEmail);
  const canSeeContact = userData.dbUser.role !== 'student' || Boolean(acceptedRequestData);
  const specializationLabel =
    tutorUser?.specialization && tutorUser.specialization.trim().length > 0
      ? tutorUser.specialization
      : 'Especialidad no informada';
  const academicStatusLabel = tutorUser
    ? getAcademicStatusLabel(tutorUser.is_graduated, tutorUser.academic_year)
    : 'Ano no informado';
  const isVerifiedTutor = (completedClassCount || 0) > 0;
  const isFavoriteTutor = Boolean(favoriteRowData);
  const initials = (tutorUser?.full_name || 'U-clases')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'UC';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/app" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/app/classes" className="hover:text-foreground">Buscar clases</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Perfil profesor</span>
        </nav>

        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-foreground">Perfil del profesor</h1>
          <div className="flex items-center gap-2">
            {userData.dbUser.role === 'student' ? (
              <FavoriteTutorButton tutorProfileId={tutorProfile.id} initialIsFavorite={isFavoriteTutor} iconOnly={false} />
            ) : null}
            {userData.dbUser.role === 'student' ? (
              <Button asChild className="h-10 bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="#solicitar">Solicitar clase ahora</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/app/classes">Volver a Buscar clases</Link>
            </Button>
          </div>
        </div>

        {userData.dbUser.role === 'student' ? (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              canSeeContact
                ? 'border-green-500/30 bg-green-500/10 text-green-700'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {canSeeContact ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {canSeeContact
                ? 'Contacto desbloqueado: ya puedes ver WhatsApp y email de este profesor.'
                : 'Contacto bloqueado: se habilita cuando el profesor acepta o completa una solicitud.'}
            </span>
          </div>
        ) : null}

        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-background to-primary/5">
          <CardHeader className="border-b border-border/70 bg-background/70">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Avatar className="h-10 w-10 border border-primary/20">
                  {tutorUser?.avatar_url ? <AvatarImage src={tutorUser.avatar_url} alt={tutorUser.full_name || 'Foto profesor'} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <span>{tutorUser?.full_name || 'Profesor/a U-clases'}</span>
                  <div className="mt-1 space-y-1 text-xs font-normal text-muted-foreground">
                    {isVerifiedTutor ? (
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
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
              </CardTitle>

              {overallRating ? (
                <div className="rounded-md border border-foreground/15 bg-foreground px-2.5 py-1 text-right text-background shadow-sm dark:border-background/20 dark:bg-background dark:text-foreground">
                  <p className="text-xs font-semibold">{overallRating.toFixed(1)} / 5</p>
                  <p className="text-[11px] font-medium opacity-90">{reviews.length} reseñas</p>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/25 px-2.5 py-1 text-right">
                  <p className="text-xs font-semibold text-muted-foreground">Sin rating</p>
                  <p className="text-[11px] text-muted-foreground">Aún sin reseñas</p>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tarifa</p>
                <p className="mt-0.5 text-sm font-semibold text-primary">
                  {(tutorProfile.class_price ?? tutorProfile.hourly_rate)
                    ? `CLP ${(tutorProfile.class_price ?? tutorProfile.hourly_rate)?.toLocaleString('es-CL')} / ${tutorProfile.class_duration_minutes ?? 60} min`
                    : 'Precio a convenir'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ramos activos</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{courses.length} publicados</p>
              </div>
            </div>

            {tutorProfile.summary_long || tutorProfile.bio ? (
              <p className="rounded-md border border-border/70 bg-background px-3 py-2 text-sm leading-relaxed text-foreground">
                {tutorProfile.summary_long || tutorProfile.bio}
              </p>
            ) : (
              <p className="rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
                Sin descripción por ahora.
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Ramos publicados</p>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <span
                    key={`${tutorProfile.id}-${course.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.id} - {course.name}
                    {course.is_ta ? <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold">Auxiliar</span> : null}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Star className="h-4 w-4 text-amber-500" />
                Reseñas por ramo
              </p>
              <div className="space-y-1.5">
                {courses.map((course) => {
                  const reviewsForCourse = reviewsByCourse.get(course.id) || [];

                  if (reviewsForCourse.length === 0) {
                    return (
                      <div
                        key={`${tutorProfile.id}-reviews-${course.id}`}
                        className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1"
                      >
                        <p className="text-xs text-foreground">{course.id} - {course.name}</p>
                        <p className="text-xs text-muted-foreground">Sin reseñas aún</p>
                      </div>
                    );
                  }

                  const average =
                    reviewsForCourse.reduce((sum, review) => sum + review.rating, 0) / reviewsForCourse.length;

                  return (
                    <div
                      key={`${tutorProfile.id}-reviews-${course.id}`}
                      className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1"
                    >
                      <p className="text-xs font-medium text-foreground">{course.id} - {course.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">{renderStars(average)}</span>
                        <p className="text-xs text-foreground">
                          {average.toFixed(1)} ({reviewsForCourse.length})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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

            <div id="contacto" className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
              {canSeeContact ? (
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

            {userData.dbUser.role === 'student' ? (
              <div id="solicitar">
                <p className="mb-2 text-sm font-medium text-foreground">Reserva tu clase en menos de 1 minuto</p>
                <RequestClassInline tutorProfileId={tutorProfile.id} courses={courses} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
