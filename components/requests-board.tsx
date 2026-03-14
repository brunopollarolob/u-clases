'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, BookOpen, Clock3, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

type StudentRequest = {
  id: number;
  tutorProfileId: number;
  courseId: string;
  tutorName: string;
  courseLabel: string;
  status: RequestStatus;
  studentNote: string | null;
  tutorResponse: string | null;
  createdAt: string;
  completedAt: string | null;
  review: { rating: number; comment: string | null } | null;
};

type TutorIncomingRequest = {
  id: number;
  studentName: string;
  studentAcademicSummary: string;
  courseLabel: string;
  status: RequestStatus;
  studentNote: string | null;
  tutorResponse: string | null;
  createdAt: string;
};

interface RequestsBoardProps {
  userRole: 'student' | 'tutor';
  studentRequests: StudentRequest[];
  tutorIncomingRequests: TutorIncomingRequest[];
  initialNotice?: string;
}

function statusLabel(status: RequestStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'accepted':
      return 'Aceptada';
    case 'rejected':
      return 'Rechazada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
  }
}

function statusClass(status: RequestStatus): string {
  switch (status) {
    case 'pending':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'accepted':
      return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'rejected':
      return 'text-red-700 bg-red-100 border-red-200';
    case 'completed':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'cancelled':
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
}

export function RequestsBoard({
  userRole,
  studentRequests,
  tutorIncomingRequests,
  initialNotice,
}: RequestsBoardProps) {
  const [outgoing, setOutgoing] = useState(studentRequests);
  const [incoming, setIncoming] = useState(tutorIncomingRequests);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState(initialNotice || '');
  const [errorMessage, setErrorMessage] = useState('');

  const [draftRatings, setDraftRatings] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const item of studentRequests) {
      initial[item.id] = String(item.review?.rating ?? 5);
    }
    return initial;
  });

  const [draftComments, setDraftComments] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const item of studentRequests) {
      initial[item.id] = item.review?.comment ?? '';
    }
    return initial;
  });

  const pendingIncomingCount = useMemo(
    () => incoming.filter((request) => request.status === 'pending').length,
    [incoming]
  );

  const patchRequest = async (requestId: number, action: 'accept' | 'reject' | 'complete' | 'cancel') => {
    if (pendingId !== null) return;

    setPendingId(requestId);
    setErrorMessage('');
    setNotice('');

    try {
      const response = await fetch(`/api/class-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo actualizar la solicitud');
        return;
      }

      setOutgoing((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, status: payload.request.status, completedAt: payload.request.completed_at } : item
        )
      );
      setIncoming((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, status: payload.request.status } : item
        )
      );

      setNotice('Solicitud actualizada correctamente.');
    } catch {
      setErrorMessage('Error inesperado al actualizar solicitud');
    } finally {
      setPendingId(null);
    }
  };

  const submitReview = async (request: StudentRequest) => {
    if (pendingId !== null) return;

    setPendingId(request.id);
    setErrorMessage('');
    setNotice('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorProfileId: request.tutorProfileId,
          courseId: request.courseId,
          rating: Number(draftRatings[request.id] || '5'),
          comment: draftComments[request.id] || '',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error || 'No se pudo guardar reseña');
        return;
      }

      setOutgoing((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
                ...item,
                review: {
                  rating: payload.review.rating,
                  comment: payload.review.comment,
                },
              }
            : item
        )
      );

      setNotice(payload.updated ? 'Reseña actualizada.' : 'Reseña publicada.');
    } catch {
      setErrorMessage('Error inesperado al guardar reseña');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {notice ? <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      {errorMessage ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <Send className="h-5 w-5 text-primary" />
            Solicitudes enviadas
          </h2>
          <span className="text-sm text-muted-foreground">{outgoing.length} total</span>
        </div>

        {outgoing.length === 0 ? (
          <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            Aún no has enviado solicitudes. Hazlo desde "Buscar clases".
          </p>
        ) : (
          outgoing.map((request) => (
            <div key={request.id} className="rounded-md border border-border/80 bg-gradient-to-b from-background to-muted/15 p-4">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{request.tutorName}</p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {request.courseLabel}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(request.status)}`}>
                  {statusLabel(request.status)}
                </span>
              </div>

              {request.studentNote ? (
                <p className="mb-2 text-sm text-foreground">Tu mensaje: {request.studentNote}</p>
              ) : null}
              {request.tutorResponse ? (
                <p className="mb-2 text-sm text-foreground">Respuesta del profesor: {request.tutorResponse}</p>
              ) : null}

              <p className="mb-3 text-xs text-muted-foreground">
                Creada: {new Date(request.createdAt).toLocaleString('es-CL')}
              </p>

              <div className="mb-1 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/tutors/${request.tutorProfileId}`}>Ver perfil del profesor</Link>
                </Button>

                {(request.status === 'pending' || request.status === 'accepted') ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patchRequest(request.id, 'cancel')}
                    disabled={pendingId === request.id}
                  >
                    Cancelar solicitud
                  </Button>
                ) : null}
              </div>

              {request.status === 'completed' ? (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Star className="h-4 w-4 text-amber-500" />
                    Reseña
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={draftRatings[request.id] || '5'}
                      onChange={(e) => setDraftRatings((prev) => ({ ...prev, [request.id]: e.target.value }))}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} estrella{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => submitReview(request)}
                      disabled={pendingId === request.id}
                    >
                      {request.review ? 'Actualizar reseña' : 'Publicar reseña'}
                    </Button>
                  </div>

                  <textarea
                    value={draftComments[request.id] || ''}
                    onChange={(e) => setDraftComments((prev) => ({ ...prev, [request.id]: e.target.value }))}
                    rows={3}
                    maxLength={1000}
                    placeholder="Comparte tu experiencia"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  />
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>

      {userRole === 'tutor' ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Solicitudes recibidas
            </h2>
            <span className="text-sm text-primary">{pendingIncomingCount} pendientes</span>
          </div>

          {incoming.length === 0 ? (
            <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
              Aun no recibes solicitudes.
            </p>
          ) : (
            incoming.map((request) => (
              <div key={request.id} className="rounded-md border border-border/80 bg-gradient-to-b from-background to-muted/15 p-4">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{request.studentName}</p>
                    <p className="text-xs text-muted-foreground">{request.studentAcademicSummary}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />
                      {request.courseLabel}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(request.status)}`}>
                    {statusLabel(request.status)}
                  </span>
                </div>

                {request.studentNote ? (
                  <p className="mb-2 text-sm text-foreground">Mensaje del alumno: {request.studentNote}</p>
                ) : null}

                <p className="mb-3 text-xs text-muted-foreground">
                  <Clock3 className="mr-1 inline-flex h-3.5 w-3.5 align-text-bottom" />
                  Recibida: {new Date(request.createdAt).toLocaleString('es-CL')}
                </p>

                <div className="flex flex-wrap gap-2">
                  {request.status === 'pending' ? (
                    <>
                      <Button size="sm" onClick={() => patchRequest(request.id, 'accept')} disabled={pendingId === request.id}>
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => patchRequest(request.id, 'reject')}
                        disabled={pendingId === request.id}
                      >
                        Rechazar
                      </Button>
                    </>
                  ) : null}

                  {request.status === 'accepted' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchRequest(request.id, 'complete')}
                      disabled={pendingId === request.id}
                    >
                      Marcar completada
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
