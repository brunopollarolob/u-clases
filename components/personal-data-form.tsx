'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SPECIALIZATION_OPTIONS } from '@/lib/academic-profile';

interface PersonalDataFormProps {
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
  initialAcademicYear: number | null;
  initialIsGraduated: boolean;
  initialSpecialization: string;
}

export function PersonalDataForm({
  initialFullName,
  initialEmail,
  initialPhone,
  initialAcademicYear,
  initialIsGraduated,
  initialSpecialization,
}: PersonalDataFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [isGraduated, setIsGraduated] = useState(initialIsGraduated);
  const [academicYear, setAcademicYear] = useState(initialAcademicYear ? String(initialAcademicYear) : '');
  const [specialization, setSpecialization] = useState(initialSpecialization);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          isGraduated,
          academicYear: isGraduated ? null : academicYear ? Number(academicYear) : null,
          specialization: specialization || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo actualizar tus datos.');
        return;
      }

      setSuccessMessage(payload.message || 'Datos actualizados correctamente.');
      router.refresh();
    } catch {
      setErrorMessage('Error inesperado al actualizar perfil.');
    } finally {
      setPending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePending || pending) return;
    if (deleteConfirmText !== 'ELIMINAR') {
      setErrorMessage('Debes escribir ELIMINAR para borrar tu cuenta.');
      setSuccessMessage('');
      return;
    }

    const confirmed = window.confirm(
      'Esta accion eliminara tu cuenta y datos asociados de forma permanente. Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

    setDeletePending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteConfirmText }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo eliminar la cuenta.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setErrorMessage('Error inesperado al eliminar la cuenta.');
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            placeholder="Tu nombre completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 1234 5678"
            maxLength={30}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="specialization">Especialidad</Label>
          <select
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Selecciona tu especialidad</option>
            {SPECIALIZATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3 rounded-md border border-border px-3 py-2">
          <input
            id="isGraduated"
            type="checkbox"
            checked={isGraduated}
            onChange={(e) => setIsGraduated(e.target.checked)}
          />
          <Label htmlFor="isGraduated" className="cursor-pointer">
            Titulado/a (ya no cursa pregrado en la facultad)
          </Label>
        </div>

        {!isGraduated ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="academicYear">Año académico actual</Label>
            <Input
              id="academicYear"
              type="number"
              min={1}
              max={10}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="Ej: 3"
            />
          </div>
        ) : null}
      </div>

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

      <Button type="submit" disabled={pending || deletePending} className="gradient-bg">
        {pending ? 'Guardando...' : 'Guardar datos personales'}
      </Button>

      <div id="danger-zone" className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="text-sm font-semibold text-destructive">Zona de peligro</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Para borrar tu cuenta de forma permanente, escribe <strong>ELIMINAR</strong> y confirma.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
            placeholder="Escribe ELIMINAR"
            className="sm:max-w-xs"
            maxLength={20}
            disabled={deletePending || pending}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deletePending || pending || deleteConfirmText !== 'ELIMINAR'}
          >
            {deletePending ? 'Eliminando...' : 'Borrar cuenta'}
          </Button>
        </div>
      </div>
    </form>
  );
}
