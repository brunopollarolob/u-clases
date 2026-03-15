import Link from 'next/link';
import { BarChart3, MessageSquare, Sparkles, Star, UserRound } from 'lucide-react';
import { getUserWithAccess } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tables } from '@/lib/supabase/types';
import { getAcademicSummary } from '@/lib/academic-profile';

type ReviewRow = Tables<'reviews'>;
type CourseRow = Tables<'courses'>;
type UserRow = Tables<'users'>;

export const dynamic = 'force-dynamic';

function renderStars(rating: number) {
  const bounded = Math.max(0, Math.min(5, rating));

  return Array.from({ length: 5 }, (_, index) => {
    const current = index + 1;
    const filled = bounded >= current - 0.2;

    return (
      <Star
        key={`star-${index}`}
        className={`h-3.5 w-3.5 ${filled ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/35'}`}
      />
    );
  });
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

export default async function ReviewsPage() {
  const userData = await getUserWithAccess();
  const supabase = await createServiceClient();

  if (userData.dbUser.role !== 'tutor') {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas recibidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Este panel esta disponible para profesores.
              </p>
              <Button asChild variant="outline">
                <Link href="/app">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { data: tutorProfile, error: tutorProfileError } = await supabase
    .from('tutor_profiles')
    .select('id')
    .eq('user_id', userData.dbUser.id)
    .maybeSingle();

  if (tutorProfileError) {
    throw new Error('No se pudo cargar tu perfil de profesor');
  }

  if (!tutorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas recibidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Publica tu perfil de profesor para empezar a recibir reseñas.
              </p>
              <Button asChild variant="outline">
                <Link href="/app/tutor">Ir a publicar perfil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  await supabase
    .from('users')
    .update({ review_notifications_seen_at: new Date().toISOString() })
    .eq('id', userData.dbUser.id);

  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, student_id, course_id')
    .eq('tutor_id', tutorProfile.id)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    throw new Error('No se pudieron cargar las reseñas recibidas');
  }

  const reviews = (reviewsData || []) as Pick<ReviewRow, 'id' | 'rating' | 'comment' | 'created_at' | 'student_id' | 'course_id'>[];
  const studentIds = Array.from(new Set(reviews.map((review) => review.student_id)));
  const courseIds = Array.from(
    new Set(
      reviews
        .map((review) => review.course_id)
        .filter((courseId): courseId is string => Boolean(courseId))
    )
  );

  const [studentsResult, coursesResult] = await Promise.all([
    studentIds.length
      ? supabase
          .from('users')
          .select('id, full_name, supabase_user_id, specialization, is_graduated, academic_year')
          .in('id', studentIds)
      : Promise.resolve({
          data: [] as Pick<UserRow, 'id' | 'full_name' | 'supabase_user_id' | 'specialization' | 'is_graduated' | 'academic_year'>[],
          error: null,
        }),
    courseIds.length
      ? supabase.from('courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] as Pick<CourseRow, 'id' | 'name'>[], error: null }),
  ]);

  if (studentsResult.error || coursesResult.error) {
    throw new Error('No se pudieron cargar los detalles de reseñas');
  }

  const students = (studentsResult.data || []) as Pick<
    UserRow,
    'id' | 'full_name' | 'supabase_user_id' | 'specialization' | 'is_graduated' | 'academic_year'
  >[];

  const missingStudentSupabaseIds = students
    .filter((student) => !student.full_name)
    .map((student) => student.supabase_user_id);

  const fallbackNameBySupabaseId = new Map<string, string>();
  const fallbackEmailBySupabaseId = new Map<string, string>();

  if (missingStudentSupabaseIds.length > 0) {
    const authUsers = await Promise.all(
      missingStudentSupabaseIds.map(async (supabaseUserId) => {
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
  }

  const studentById = new Map(students.map((student) => [student.id, student]));
  const courseById = new Map((coursesResult.data || []).map((course) => [course.id, course]));

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const courseSummary = new Map<string, { count: number; total: number }>();
  for (const review of reviews) {
    const key = review.course_id || 'unknown';
    const current = courseSummary.get(key) || { count: 0, total: 0 };
    courseSummary.set(key, {
      count: current.count + 1,
      total: current.total + review.rating,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Feedback de alumnos/as
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reseñas recibidas</h1>
              <p className="mt-1 text-muted-foreground">
                Historial completo de comentarios y calificaciones de tus alumnos/as.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app">Volver al inicio</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Resumen general
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-foreground">Total reseñas: <span className="font-semibold">{reviews.length}</span></p>
              <div className="flex items-center gap-2">
                <span className="text-foreground">Promedio:</span>
                <span className="inline-flex items-center gap-0.5">{renderStars(averageRating)}</span>
                <span className="font-semibold text-foreground">{averageRating.toFixed(1)} / 5</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promedio por ramo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Array.from(courseSummary.entries()).length === 0 ? (
                <p className="text-muted-foreground">Aun no tienes reseñas.</p>
              ) : (
                Array.from(courseSummary.entries()).map(([courseId, value]) => {
                  const course = courseById.get(courseId);
                  const label = course ? `${course.id} - ${course.name}` : 'Ramo no especificado';
                  return (
                    <div key={courseId} className="rounded-md border border-border/70 px-2.5 py-1.5">
                      <p className="text-foreground">{label}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5">{renderStars(value.total / value.count)}</span>
                        <span className="font-semibold text-foreground">{(value.total / value.count).toFixed(1)} / 5</span>
                        <span className="text-xs text-muted-foreground">({value.count})</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aun no has recibido reseñas.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const student = studentById.get(review.student_id);
              const course = review.course_id ? courseById.get(review.course_id) : null;
              const studentAcademicSummary = student
                ? getAcademicSummary(student.specialization, student.is_graduated, student.academic_year)
                : 'Perfil academico no informado';
              const studentDisplayName =
                student?.full_name ||
                (student?.supabase_user_id ? fallbackNameBySupabaseId.get(student.supabase_user_id) : null) ||
                (student?.supabase_user_id ? fallbackEmailBySupabaseId.get(student.supabase_user_id) : null) ||
                `Alumno/a (${String(review.student_id)})`;

              return (
                <Card key={review.id} className="border-border/80 bg-gradient-to-b from-background to-muted/15">
                  <CardContent className="pt-6">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {course ? `${course.id} - ${course.name}` : 'Ramo no especificado'}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        <span className="inline-flex items-center gap-0.5">{renderStars(review.rating)}</span>
                        {review.rating} / 5
                      </div>
                    </div>

                    <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      Alumno/a: {studentDisplayName}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {studentAcademicSummary}
                    </p>

                    <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground">
                      <span className="mr-1 inline-flex align-middle text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      {review.comment?.trim() ? review.comment : 'Sin comentario escrito.'}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Publicada: {new Date(review.created_at).toLocaleString('es-CL')}
                    </p>
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
