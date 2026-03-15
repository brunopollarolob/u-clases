'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FavoriteTutorButtonProps {
  tutorProfileId: number;
  initialIsFavorite?: boolean;
  iconOnly?: boolean;
  className?: string;
  refreshAfterToggle?: boolean;
}

export function FavoriteTutorButton({
  tutorProfileId,
  initialIsFavorite = false,
  iconOnly = true,
  className,
  refreshAfterToggle = false,
}: FavoriteTutorButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [pending, setPending] = useState(false);

  const handleToggleFavorite = async () => {
    if (pending) return;

    const nextIsFavorite = !isFavorite;
    setIsFavorite(nextIsFavorite);
    setPending(true);

    try {
      const response = await fetch('/api/favorites', {
        method: nextIsFavorite ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorProfileId }),
      });

      if (!response.ok) {
        setIsFavorite(!nextIsFavorite);
      } else if (refreshAfterToggle) {
        router.refresh();
      }
    } catch {
      setIsFavorite(!nextIsFavorite);
    } finally {
      setPending(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleToggleFavorite}
        disabled={pending}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors',
          isFavorite ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground',
          pending ? 'opacity-70' : '',
          className
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4', isFavorite ? 'fill-current' : '')} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
        isFavorite
          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-border bg-background text-foreground hover:bg-muted/40',
        pending ? 'opacity-70' : '',
        className
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4', isFavorite ? 'fill-current' : '')} />}
      {isFavorite ? 'Guardado' : 'Guardar'}
    </button>
  );
}
