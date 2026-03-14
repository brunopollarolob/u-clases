'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Course = {
  id: string;
  name: string;
};

type TutorProfile = {
  id?: number;
  bio: string | null;
  summary_short?: string | null;
  summary_long?: string | null;
  class_duration_minutes?: number | null;
  class_price?: number | null;
  hourly_rate: number | null;
  contact_info: string | null;
  is_active: boolean;
};

interface TutorProfileFormProps {
  initialFullName: string;
  initialAvatarUrl: string;
  initialRole: 'student' | 'tutor';
  initialProfile: TutorProfile | null;
  initialCourseIds: string[];
  courses: Course[];
}

export function TutorProfileForm({
  initialFullName,
  initialAvatarUrl,
  initialRole,
  initialProfile,
  initialCourseIds,
  courses,
}: TutorProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [summaryShort, setSummaryShort] = useState(initialProfile?.summary_short ?? '');
  const [summaryLong, setSummaryLong] = useState(initialProfile?.summary_long ?? initialProfile?.bio ?? '');
  const [classDurationMinutes, setClassDurationMinutes] = useState(
    String(initialProfile?.class_duration_minutes ?? 60)
  );
  const [classPrice, setClassPrice] = useState(
    initialProfile?.class_price
      ? String(initialProfile.class_price)
      : initialProfile?.hourly_rate
        ? String(initialProfile.hourly_rate)
        : ''
  );
  const [contactInfo, setContactInfo] = useState(initialProfile?.contact_info ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isActive, setIsActive] = useState(initialProfile?.is_active ?? true);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set(initialCourseIds));
  const [pending, setPending] = useState(false);
  const [avatarUploadPending, setAvatarUploadPending] = useState(false);
  const [deactivatePending, setDeactivatePending] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const hasExistingProfile = Boolean(initialProfile);

  const selectedCount = useMemo(() => selectedCourses.size, [selectedCourses]);

  const initials = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return 'UC';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [fullName]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending) return;

    setPending(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const parsedClassPrice = classPrice.trim() === '' ? null : Number(classPrice);
      const parsedClassDuration = Number(classDurationMinutes);
      const courseIds = Array.from(selectedCourses);

      const response = await fetch('/api/tutor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          summaryShort,
          summaryLong,
          classDurationMinutes: parsedClassDuration,
          classPrice: parsedClassPrice,
          contactInfo,
          isActive,
          courseIds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo guardar el perfil de profesor.');
        return;
      }

      setSuccessMessage('Perfil de profesor guardado correctamente.');
    } catch (error) {
      setErrorMessage('Ocurrio un error inesperado al guardar. Intenta nuevamente.');
    } finally {
      setPending(false);
    }
  };

  const handleDeactivate = async () => {
    if (!hasExistingProfile || deactivatePending || pending) return;

    if (deactivateConfirmText !== 'BAJA') {
      setErrorMessage('Debes escribir BAJA para confirmar la baja del perfil.');
      setSuccessMessage('');
      return;
    }

    const confirmed = window.confirm(
      'Esto dara de baja tu perfil de profesor y quitara tus ramos publicados. Deseas continuar?'
    );

    if (!confirmed) return;

    setDeactivatePending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/tutor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo dar de baja el perfil.');
        return;
      }

      setIsActive(false);
      setSelectedCourses(new Set());
      setDeactivateConfirmText('');
      setSuccessMessage(payload.message || 'Perfil de profesor dado de baja correctamente.');
    } catch {
      setErrorMessage('Ocurrio un error inesperado al dar de baja el perfil.');
    } finally {
      setDeactivatePending(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Selecciona un archivo de imagen valido.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La foto supera el maximo permitido de 5 MB.');
      event.target.value = '';
      return;
    }

    setAvatarUploadPending(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/tutor/photo', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo subir la foto de perfil.');
        return;
      }

      setAvatarUrl(payload.avatarUrl || '');
      setSuccessMessage('Foto de perfil actualizada correctamente.');
    } catch {
      setErrorMessage('Ocurrio un error inesperado al subir la foto.');
    } finally {
      setAvatarUploadPending(false);
      event.target.value = '';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>{hasExistingProfile ? 'Panel de edicion del perfil de profesor' : 'Publicar perfil de profesor'}</CardTitle>
        <CardDescription>
          {hasExistingProfile
            ? 'Edita tus datos, cursos y estado de publicacion en cualquier momento.'
            : 'Completa tus datos para aparecer en las busquedas de alumnos.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium text-foreground">Foto de perfil del profesor</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Se mostrara en la pestaña de cursos. Formatos de imagen, maximo 5 MB.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border border-border">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || 'Foto de perfil'} /> : null}
                <AvatarFallback className="text-sm font-semibold text-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploadPending || pending || deactivatePending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploadPending || pending || deactivatePending}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {avatarUploadPending ? 'Subiendo foto...' : 'Subir o cambiar foto'}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Nombre visible</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Camila Perez"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classDurationMinutes">Duracion de clase (minutos)</Label>
              <select
                id="classDurationMinutes"
                value={classDurationMinutes}
                onChange={(e) => setClassDurationMinutes(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[45, 50, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutos
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classPrice">Precio por clase (CLP)</Label>
              <Input
                id="classPrice"
                type="number"
                min={1000}
                step={500}
                value={classPrice}
                onChange={(e) => setClassPrice(e.target.value)}
                placeholder="15000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contacto</Label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="mail o WhatsApp"
                maxLength={200}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summaryShort">Resumen visible en Buscar cursos</Label>
              <Input
                id="summaryShort"
                value={summaryShort}
                onChange={(e) => setSummaryShort(e.target.value)}
                maxLength={220}
                placeholder="Ej: Tutor de calculo y algebra con clases enfocadas en controles y certamenes."
              />
              <p className="text-xs text-muted-foreground">Este texto corto aparece en la tarjeta de busqueda.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summaryLong">Descripcion detallada (solo en perfil del profesor)</Label>
              <textarea
                id="summaryLong"
                value={summaryLong}
                onChange={(e) => setSummaryLong(e.target.value)}
                maxLength={2500}
                rows={7}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                placeholder="Cuenta tu experiencia, metodologia, que cubres en las clases y como preparas a tus alumnos."
              />
            </div>

            <div className="sm:col-span-2 rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-medium">Ramos que ofreces ({selectedCount})</Label>
                <span className="text-xs text-muted-foreground">Selecciona al menos 1</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const checked = selectedCourses.has(course.id);
                  return (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/40"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourse(course.id)}
                        className="mt-0.5"
                      />
                      <span>
                        <strong className="mr-1 text-primary">{course.id}</strong>
                        {course.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Publicar perfil (visible para estudiantes)
              </Label>
            </div>
          </div>

          {initialRole === 'student' ? (
            <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
              Al guardar, tu rol se actualizara a profesor para habilitar las funciones de publicacion.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={pending || avatarUploadPending} className="gradient-bg w-full sm:w-auto">
            {pending ? 'Guardando...' : 'Guardar perfil de profesor'}
          </Button>

          {hasExistingProfile ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="text-sm font-semibold text-destructive">Dar de baja perfil de profesor</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Esto ocultara tu perfil para alumnos y quitara los ramos publicados. Para confirmar, escribe <strong>BAJA</strong>.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={deactivateConfirmText}
                  onChange={(e) => setDeactivateConfirmText(e.target.value.toUpperCase())}
                  placeholder="Escribe BAJA"
                  className="sm:max-w-xs"
                  maxLength={20}
                  disabled={deactivatePending || pending}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={deactivatePending || pending || deactivateConfirmText !== 'BAJA'}
                >
                  {deactivatePending ? 'Dando de baja...' : 'Dar de baja perfil'}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
