'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Course = {
  id: string;
  name: string;
};

interface RequestClassInlineProps {
  tutorProfileId: number;
  courses: Course[];
}

export function RequestClassInline({ tutorProfileId, courses }: RequestClassInlineProps) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [studentNote, setStudentNote] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequest = async () => {
    if (!selectedCourseId || pending) return;

    setPending(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/class-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorProfileId,
          courseId: selectedCourseId,
          studentNote,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo enviar la solicitud');
        return;
      }

      window.location.href = '/app/requests?created=1';
    } catch {
      setErrorMessage('Error inesperado al enviar solicitud');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-base font-semibold text-foreground">Solicitar clase</p>
      <p className="text-xs text-muted-foreground">Selecciona ramo, agrega un mensaje opcional y envia tu solicitud al profesor.</p>
      <select
        value={selectedCourseId}
        onChange={(e) => setSelectedCourseId(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.id} - {course.name}
          </option>
        ))}
      </select>

      <textarea
        value={studentNote}
        onChange={(e) => setStudentNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Mensaje opcional para el profesor"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />

      <Button type="button" onClick={handleRequest} disabled={pending || !selectedCourseId} className="h-11 w-full font-semibold" variant="default">
        {pending ? 'Enviando solicitud...' : 'Confirmar y solicitar clase'}
      </Button>

      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
