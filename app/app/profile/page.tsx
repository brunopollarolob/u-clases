import Link from 'next/link';
import { IdCard, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalDataForm } from '@/components/personal-data-form';
import { getUserWithAccess } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ complete?: string }>;
}) {
  const userData = await getUserWithAccess();
  const params = searchParams ? await searchParams : undefined;
  const showCompletionNotice = params?.complete === '1';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Configuración de cuenta
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
                <IdCard className="h-7 w-7 text-primary" />
                Datos personales
              </h1>
              <p className="mt-2 text-muted-foreground">
                Actualiza tu información de contacto y perfil en cualquier momento.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app">Volver al inicio</Link>
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Puedes modificar tus datos o eliminar tu cuenta desde esta misma pantalla.
          </span>
        </div>

        {showCompletionNotice ? (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            Completa teléfono, especialidad y datos académicos para terminar tu registro.
          </div>
        ) : null}

        <div className="rounded-lg border border-primary/20 bg-background p-6 shadow-sm">
          <PersonalDataForm
            initialFullName={userData.dbUser.full_name ?? ''}
            initialEmail={userData.email || ''}
            initialPhone={userData.dbUser.phone ?? ''}
            initialAcademicYear={userData.dbUser.academic_year ?? null}
            initialIsGraduated={userData.dbUser.is_graduated ?? false}
            initialSpecialization={userData.dbUser.specialization ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
