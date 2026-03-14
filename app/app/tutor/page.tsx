import { getUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { TutorProfileForm } from '@/components/tutor-profile-form';
import Link from 'next/link';
import { BookOpenCheck, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function TutorPage() {
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

  const hasProfile = Boolean(profile);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Publicacion de perfil
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <BookOpenCheck className="h-7 w-7 text-primary" />
            Publicar perfil de profesor
          </h1>
          <p className="mt-2 text-muted-foreground">
            Crea tu perfil para aparecer en las busquedas de estudiantes.
          </p>
        </div>

        {hasProfile ? (
          <section className="mb-6 rounded-lg border border-border bg-muted/15 p-4">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Tu perfil ya esta publicado</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Para editar datos, activar/desactivar tu perfil o actualizar ramos, usa la pantalla de gestion de perfil.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/app/tutor/profile">Ir a gestionar perfil</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/requests">Ir al panel de solicitudes</Link>
              </Button>
            </div>
          </section>
        ) : (
          <TutorProfileForm
            initialFullName={userData.dbUser.full_name ?? ''}
            initialAvatarUrl={userData.dbUser.avatar_url ?? ''}
            initialRole={userData.dbUser.role}
            initialProfile={null}
            initialCourseIds={[]}
            courses={courses || []}
          />
        )}

        <section className="mt-8 rounded-lg border border-border bg-muted/15 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            Gestion de solicitudes
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            La gestion de aceptacion y completado ahora vive en un panel unico por usuario.
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
