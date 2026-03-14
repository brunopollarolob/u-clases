import { getOptionalUser } from '@/lib/auth/dal';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types';

type TutorProfileRow = Tables<'tutor_profiles'>;
type TutorCourseRow = Tables<'tutor_courses'>;
type CourseRow = Tables<'courses'>;
type ReviewRow = Tables<'reviews'>;
type UserRow = Tables<'users'>;

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const userData = await getOptionalUser();
  const user = userData?.dbUser || null;
  const resolvedSearchParams = await searchParams;
  const supabase = await createServiceClient();

  let topTutors: Array<{ name: string; course: string; rating: string; reviews: number }> = [];

  const { data: tutorProfilesData, error: tutorProfilesError } = await supabase
    .from('tutor_profiles')
    .select('id, user_id')
    .eq('is_active', true);

  if (!tutorProfilesError) {
    const tutorProfiles = (tutorProfilesData || []) as Pick<TutorProfileRow, 'id' | 'user_id'>[];
    const profileIds = tutorProfiles.map((profile) => profile.id);
    const userIds = Array.from(new Set(tutorProfiles.map((profile) => profile.user_id)));

    if (profileIds.length > 0) {
      const [usersResult, coursesResult, tutorCoursesResult, reviewsResult] = await Promise.all([
        supabase.from('users').select('id, full_name').in('id', userIds),
        supabase.from('courses').select('id, name'),
        supabase.from('tutor_courses').select('tutor_profile_id, course_id').in('tutor_profile_id', profileIds),
        supabase
          .from('reviews')
          .select('tutor_id, course_id, rating')
          .in('tutor_id', profileIds),
      ]);

      if (!usersResult.error && !coursesResult.error && !tutorCoursesResult.error && !reviewsResult.error) {
        const users = (usersResult.data || []) as Pick<UserRow, 'id' | 'full_name'>[];
        const courses = (coursesResult.data || []) as Pick<CourseRow, 'id' | 'name'>[];
        const tutorCourses = (tutorCoursesResult.data || []) as Pick<TutorCourseRow, 'tutor_profile_id' | 'course_id'>[];
        const reviews = (reviewsResult.data || []) as Pick<ReviewRow, 'tutor_id' | 'course_id' | 'rating'>[];

        const userById = new Map(users.map((item) => [item.id, item]));
        const courseById = new Map(courses.map((item) => [item.id, item]));

        const coursesByTutor = new Map<number, string[]>();
        for (const tutorCourse of tutorCourses) {
          const existing = coursesByTutor.get(tutorCourse.tutor_profile_id) || [];
          existing.push(tutorCourse.course_id);
          coursesByTutor.set(tutorCourse.tutor_profile_id, existing);
        }

        const reviewsByTutor = new Map<number, number[]>();
        const reviewCountByTutorCourse = new Map<string, number>();
        for (const review of reviews) {
          const tutorRatings = reviewsByTutor.get(review.tutor_id) || [];
          tutorRatings.push(review.rating);
          reviewsByTutor.set(review.tutor_id, tutorRatings);

          if (review.course_id) {
            const key = `${review.tutor_id}:${review.course_id}`;
            reviewCountByTutorCourse.set(key, (reviewCountByTutorCourse.get(key) || 0) + 1);
          }
        }

        topTutors = tutorProfiles
          .map((profile) => {
            const tutorRatings = reviewsByTutor.get(profile.id) || [];
            const reviewsCount = tutorRatings.length;
            const averageRating =
              reviewsCount > 0
                ? tutorRatings.reduce((sum, rating) => sum + rating, 0) / reviewsCount
                : 0;

            const tutorCourseIds = coursesByTutor.get(profile.id) || [];
            const bestCourseId = tutorCourseIds
              .slice()
              .sort((a, b) => {
                const countA = reviewCountByTutorCourse.get(`${profile.id}:${a}`) || 0;
                const countB = reviewCountByTutorCourse.get(`${profile.id}:${b}`) || 0;
                return countB - countA;
              })[0];

            const course = bestCourseId ? courseById.get(bestCourseId) : null;

            return {
              name: userById.get(profile.user_id)?.full_name || 'Profesor/a U-clases',
              course: course ? `${course.id} · ${course.name}` : 'Ramos de Plan Comun',
              rating: averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo',
              reviews: reviewsCount,
              averageRating,
            };
          })
          .sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
              return b.averageRating - a.averageRating;
            }
            return b.reviews - a.reviews;
          })
          .slice(0, 3)
          .map(({ name, course, rating, reviews }) => ({ name, course, rating, reviews }));
      }
    }
  }

  if (topTutors.length === 0) {
    topTutors = [
      { name: 'Profe destacado', course: 'MA1002 · Calculo', rating: '5.0', reviews: 1 },
      { name: 'Profe recomendado', course: 'FI1000 · Fisica Clasica', rating: '4.9', reviews: 1 },
      { name: 'Profe activo', course: 'MA1102 · Algebra Lineal', rating: '4.8', reviews: 1 },
    ];
  }
  
  return (
    <main className="min-h-screen">
      <div className="transition-element">
        <HeroSection
          user={user}
          needsAccess={resolvedSearchParams.access === 'required'}
          topTutors={topTutors}
        />
      </div>
      <div className="transition-element" style={{ transitionDelay: '0.1s' }}>
        <FeaturesSection />
      </div>

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>U-clases · Plataforma de clases particulares FCFM</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terminos
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
} 