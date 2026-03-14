import Link from 'next/link';
import { BookOpenCheck, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TutorProfileForm } from '@/components/tutor-profile-form';
import { getUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TutorProfileManagementPage() {
  const userData = await getUser();
  const supabase = await createServiceClient();

  const [{ data: courses, error: coursesError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.from('courses').select('id, name').order('id', { ascending: true }),
      supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', userData.dbUser.id)
        .maybeSingle(),
    ]);

  if (coursesError) {
    throw new Error('No se pudieron cargar los ramos disponibles');
  }

  if (profileError) {
    throw new Error('No se pudo cargar tu perfil de profesor');
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-muted/15 p-5">
            <h1 className="text-2xl font-bold text-foreground">Gestion de perfil de profesor</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aun no tienes un perfil publicado. Primero completa la publicacion de perfil.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/app/tutor">Ir a publicar perfil</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const courseIds = (
    await supabase
      .from('tutor_courses')
      .select('course_id')
      .eq('tutor_profile_id', profile.id)
  ).data?.map((item) => item.course_id) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Gestion de perfil
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <BookOpenCheck className="h-7 w-7 text-primary" />
            Gestionar perfil de profesor
          </h1>
          <p className="mt-2 text-muted-foreground">
            Edita tus datos, cursos activos y estado de publicacion cuando quieras.
          </p>
        </div>

        <TutorProfileForm
          initialFullName={userData.dbUser.full_name ?? ''}
          initialAvatarUrl={userData.dbUser.avatar_url ?? ''}
          initialRole={userData.dbUser.role}
          initialProfile={profile}
          initialCourseIds={courseIds}
          courses={courses || []}
        />

        <section className="mt-8 rounded-lg border border-border bg-muted/15 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            Gestion de solicitudes
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Gestiona aceptacion y completado de clases desde el panel central de solicitudes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/requests">Ir al panel de solicitudes</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/app">Volver al inicio</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
