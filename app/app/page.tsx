import { getUserWithAccess } from '@/lib/auth/dal';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const userData = await getUserWithAccess();
  const supabase = await (await import('@/lib/supabase/server')).createServiceClient();

  let pendingIncomingCount = 0;
  let hasTutorProfile = false;
  if (userData.dbUser.role === 'tutor') {
    const { data: profile } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', userData.dbUser.id)
      .maybeSingle();

    hasTutorProfile = Boolean(profile);

    if (profile) {
      const { count } = await supabase
        .from('class_requests')
        .select('id', { count: 'exact', head: true })
        .eq('tutor_profile_id', profile.id)
        .eq('status', 'pending');

      pendingIncomingCount = count || 0;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6 sm:px-7 sm:py-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Panel interno U-clases
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Bienvenido/a a <span className="gradient-text">U-clases</span>
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Gestiona tutorias, solicitudes y reseñas desde un solo lugar con una vista clara del flujo completo.
            {process.env.NODE_ENV === 'development' ? (
              <span className="block mt-1 text-sm text-primary">Sesion activa: {userData.email}</span>
            ) : null}
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{userData.dbUser.role === 'tutor' ? 'Profesor' : 'Alumno'}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Solicitudes pendientes</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{userData.dbUser.role === 'tutor' ? pendingIncomingCount : 'Revisa en panel'}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Campus</p>
            <p className="mt-1 text-sm font-semibold text-foreground">FCFM - Beauchef</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Buscar cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Encuentra profesores activos, revisa reseñas por ramo y solicita clases en minutos.
              </p>
              <Button asChild className="group w-full">
                <Link href="/app/classes">
                  Buscar ahora
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Ofrecer Clases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {userData.dbUser.role === 'tutor' && hasTutorProfile
                  ? 'Administra tu perfil publicado, cursos activos y datos visibles para estudiantes.'
                  : '¿Eres bueno en algún ramo? Publica tu perfil de tutor y empieza a ayudar a tus compañeros.'}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={userData.dbUser.role === 'tutor' && hasTutorProfile ? '/app/tutor/profile' : '/app/tutor'}>
                  {userData.dbUser.role === 'tutor' && hasTutorProfile ? 'Gestionar mi perfil' : 'Publicar mi perfil'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-4 w-4 text-primary" />
                Panel de solicitudes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Gestiona en un solo lugar las solicitudes, estados de clase y reseñas.
                {userData.dbUser.role === 'tutor' ? ` Pendientes: ${pendingIncomingCount}.` : ''}
              </p>
              <Button asChild variant="outline">
                <Link href="/app/requests">Abrir panel</Link>
              </Button>
            </CardContent>
          </Card>

          {userData.dbUser.role === 'tutor' ? (
            <Card className="border-border bg-muted/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Reseñas recibidas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Revisa todas las calificaciones y comentarios que han dejado tus alumnos.
                </p>
                <Button asChild variant="outline">
                  <Link href="/app/reviews">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Abrir panel
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-muted/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Tu flujo de clases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Busca profesores, envia solicitudes y luego monitorea estados y reseñas desde el panel central.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Ramos de Plan Común disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'MA1001', name: 'Introducción al Cálculo' },
              { id: 'MA1101', name: 'Introducción al Álgebra' },
              { id: 'FI1000', name: 'Introducción a la Física Clásica' },
              { id: 'MA1002', name: 'Cálculo Diferencial e Integral' },
              { id: 'MA1102', name: 'Álgebra Lineal' },
              { id: 'FI1100', name: 'Introducción a la Física Moderna' },
              { id: 'MA2001', name: 'Cálculo en Varias Variables' },
              { id: 'MA2601', name: 'Ecuaciones Diferenciales Ordinarias' },
              { id: 'FI2001', name: 'Mecánica' },
              { id: 'FI2002', name: 'Electromagnetismo' },
              { id: 'FI2003', name: 'Métodos Experimentales' },
              { id: 'FI2004', name: 'Termodinámica' },
              { id: 'IQ2211', name: 'Química' },
              { id: 'IQ2212', name: 'Termodinámica Química' },
              { id: 'MA2002', name: 'Cálculo Avanzado y Aplicaciones' },
              { id: 'IN2201', name: 'Economía' },
            ].map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  {course.id}
                </span>
                <span className="text-sm text-foreground">{course.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}