import Link from 'next/link';
import { Bookmark, Clock3, GraduationCap, Star } from 'lucide-react';
import { getUserWithAccess } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FavoriteTutorButton } from '@/components/favorite-tutor-button';
import type { Tables } from '@/lib/supabase/types';
import { getAcademicStatusLabel } from '@/lib/academic-profile';

type FavoriteTutorRow = Tables<'favorite_tutors'>;
type TutorProfileRow = Tables<'tutor_profiles'>;
type UserRow = Tables<'users'>;
type TutorCourseRow = Tables<'tutor_courses'>;
type CourseRow = Tables<'courses'>;
type ReviewRow = Tables<'reviews'>;

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const userData = await getUserWithAccess();
  const supabase = await createServiceClient();

  if (userData.dbUser.role !== 'student') {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Profesores guardados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Este panel esta disponible para alumnos.</p>
              <Button asChild variant="outline">
                <Link href="/app">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { data: favoritesData, error: favoritesError } = await supabase
    .from('favorite_tutors')
    .select('student_id, tutor_profile_id, created_at')
    .eq('student_id', userData.dbUser.id)
    .order('created_at', { ascending: false });

  if (favoritesError) {
    throw new Error('No se pudieron cargar tus favoritos');
  }

  const favorites = (favoritesData || []) as FavoriteTutorRow[];

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Bookmark className="h-3.5 w-3.5" />
              Panel de favoritos
            </div>
            <h1 className="text-3xl font-bold text-foreground">Profesores guardados</h1>
            <p className="mt-1 text-muted-foreground">Guarda perfiles y vuelve rapido cuando los necesites.</p>
          </div>

          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-foreground">Aun no has guardado profesores.</p>
              <p className="mt-1 text-sm text-muted-foreground">Explora la seccion de clases y marca perfiles con el corazon.</p>
              <Button asChild className="mt-4 gradient-bg">
                <Link href="/app/classes">Ir a buscar clases</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profileIds = favorites.map((item) => item.tutor_profile_id);

  const [{ data: profilesData, error: profilesError }, { data: reviewsData, error: reviewsError }, { data: tutorCoursesData, error: tutorCoursesError }] = await Promise.all([
    supabase
      .from('tutor_profiles')
      .select('id, user_id, is_active, summary_short, bio, class_price, hourly_rate, class_duration_minutes')
      .in('id', profileIds),
    supabase.from('reviews').select('tutor_id, rating').in('tutor_id', profileIds),
    supabase.from('tutor_courses').select('tutor_profile_id, course_id').in('tutor_profile_id', profileIds),
  ]);

  if (profilesError || reviewsError || tutorCoursesError) {
    throw new Error('No se pudieron cargar detalles de tus favoritos');
  }

  const profiles = (profilesData || []) as Array<Pick<TutorProfileRow, 'id' | 'user_id' | 'is_active' | 'summary_short' | 'bio' | 'class_price' | 'hourly_rate' | 'class_duration_minutes'>>;
  const reviews = (reviewsData || []) as Array<Pick<ReviewRow, 'tutor_id' | 'rating'>>;
  const tutorCourses = (tutorCoursesData || []) as Array<Pick<TutorCourseRow, 'tutor_profile_id' | 'course_id'>>;

  const userIds = Array.from(new Set(profiles.map((item) => item.user_id)));
  const courseIds = Array.from(new Set(tutorCourses.map((item) => item.course_id)));

  const [{ data: usersData, error: usersError }, { data: coursesData, error: coursesError }] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, full_name, avatar_url, specialization, is_graduated, academic_year').in('id', userIds)
      : Promise.resolve({ data: [] as Array<Pick<UserRow, 'id' | 'full_name' | 'avatar_url' | 'specialization' | 'is_graduated' | 'academic_year'>>, error: null }),
    courseIds.length
      ? supabase.from('courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] as Array<Pick<CourseRow, 'id' | 'name'>>, error: null }),
  ]);

  if (usersError || coursesError) {
    throw new Error('No se pudieron cargar datos complementarios de favoritos');
  }

  const profileById = new Map(profiles.map((item) => [item.id, item]));
  const userById = new Map((usersData || []).map((item) => [item.id, item]));
  const courseById = new Map((coursesData || []).map((item) => [item.id, item]));

  const coursesByTutorProfile = new Map<number, string[]>();
  for (const row of tutorCourses) {
    const current = coursesByTutorProfile.get(row.tutor_profile_id) || [];
    const course = courseById.get(row.course_id);
    current.push(course ? `${course.id} - ${course.name}` : row.course_id);
    coursesByTutorProfile.set(row.tutor_profile_id, current);
  }

  const ratingByTutorProfile = new Map<number, { avg: number | null; count: number }>();
  for (const profileId of profileIds) {
    const ratings = reviews.filter((review) => review.tutor_id === profileId).map((review) => review.rating);
    ratingByTutorProfile.set(profileId, {
      avg: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null,
      count: ratings.length,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Bookmark className="h-3.5 w-3.5" />
            Panel de favoritos
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profesores guardados</h1>
              <p className="mt-1 text-muted-foreground">Perfiles que marcaste para revisar o contactar despues.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/classes">Buscar mas profesores</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {favorites.map((favorite) => {
            const profile = profileById.get(favorite.tutor_profile_id);
            if (!profile) return null;

            const user = userById.get(profile.user_id);
            const displayName = user?.full_name || 'Profesor/a U-clases';
            const courses = coursesByTutorProfile.get(profile.id) || [];
            const rating = ratingByTutorProfile.get(profile.id) || { avg: null, count: 0 };
            const initials = displayName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('') || 'UC';

            return (
              <Card key={`${favorite.student_id}-${favorite.tutor_profile_id}`} className="border-border/80">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14 border border-border bg-muted/20">
                        {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt={displayName} className="object-cover" /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="text-lg font-semibold text-foreground">{displayName}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          {user?.specialization || 'Especialidad no informada'}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5 text-primary" />
                          {user ? getAcademicStatusLabel(user.is_graduated, user.academic_year) : 'Ano no informado'}
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            {rating.avg ? `${rating.avg.toFixed(1)} / 5` : 'Sin rating'}
                          </span>
                          <span>({rating.count} reseñas)</span>
                          <span>·</span>
                          <span>{courses.length} ramos</span>
                        </div>

                        {courses.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {courses.slice(0, 3).map((course) => (
                              <span key={`${profile.id}-${course}`} className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs text-foreground">
                                {course}
                              </span>
                            ))}
                            {courses.length > 3 ? (
                              <span className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
                                +{courses.length - 3} mas
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <p className="mt-2 text-sm text-foreground/90">
                          {profile.summary_short || profile.bio || 'Profesor con perfil publicado en U-clases.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FavoriteTutorButton tutorProfileId={profile.id} initialIsFavorite iconOnly={false} refreshAfterToggle />
                      <Button asChild>
                        <Link href={`/app/tutors/${profile.id}`}>Ver perfil</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
