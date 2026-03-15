'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, ClipboardList, UserRoundCog, Star, Trash2, BookOpenCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth/auth-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface UserMenuClientProps {
  user: User;
  dbUser: any;
}

type NotificationCounts = {
  total: number;
  requests: number;
  reviews: number;
};

export function NavigationButtons({ userData }: { userData: any }) {
  return (
    <>
      {userData?.dbUser?.has_access && (
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
          <Link href="/app">
            Ir a U-clases
          </Link>
        </Button>
      )}
    </>
  );
}

export function UserMenuClient({ user, dbUser }: { user: User; dbUser: any }) {
  const router = useRouter();
  const [signOutPending, setSignOutPending] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState<NotificationCounts>({
    total: 0,
    requests: 0,
    reviews: 0,
  });
  const { signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/requests-count', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!cancelled) {
          setNotificationsCount({
            total: typeof payload.count === 'number' ? payload.count : 0,
            requests: typeof payload.requestsCount === 'number' ? payload.requestsCount : 0,
            reviews: typeof payload.reviewsCount === 'number' ? payload.reviewsCount : 0,
          });
        }
      } catch {
        // Ignore temporary polling failures.
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    if (signOutPending) return;
    
    setSignOutPending(true);
    const result = await signOut();
    if (result.success) {
      router.replace('/sign-in');
      router.refresh();
      return;
    }
    setSignOutPending(false);
  };

  // Simple initials generation
  const displayName = dbUser?.full_name?.trim() || user.user_metadata?.full_name?.trim() || 'Usuario';

  const getInitials = (name: string, fallbackEmail?: string) => {
    if (name) {
      const names = name.split(/\s+/);
      return names.length >= 2 
        ? (names[0][0] + names[1][0]).toUpperCase()
        : names[0].slice(0, 2).toUpperCase();
    }
    
    if (fallbackEmail) {
      return fallbackEmail.slice(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative">
          <Avatar className="cursor-pointer size-9">
            <AvatarImage src={dbUser?.avatar_url || user.user_metadata?.avatar_url} alt={displayName || user.email} />
            <AvatarFallback>
              {getInitials(displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          {notificationsCount.total > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
              {notificationsCount.total > 9 ? '9+' : notificationsCount.total}
            </span>
          ) : null}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <div className="px-2 py-1.5 text-sm text-foreground">
          <div className="font-medium">{displayName}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/app/requests" className="cursor-pointer">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Panel de solicitudes</span>
            {notificationsCount.requests > 0 ? (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {notificationsCount.requests > 9 ? '9+' : notificationsCount.requests}
              </span>
            ) : null}
          </Link>
        </DropdownMenuItem>

        {dbUser?.role === 'tutor' ? (
          <DropdownMenuItem asChild>
            <Link href="/app/reviews" className="cursor-pointer">
              <Star className="mr-2 h-4 w-4" />
              <span>Reseñas recibidas</span>
              {notificationsCount.reviews > 0 ? (
                <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {notificationsCount.reviews > 9 ? '9+' : notificationsCount.reviews}
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ) : null}

        {dbUser?.role === 'tutor' ? (
          <DropdownMenuItem asChild>
            <Link href="/app/tutor/profile" className="cursor-pointer">
              <BookOpenCheck className="mr-2 h-4 w-4" />
              <span>Gestionar perfil profesor</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem asChild>
          <Link href="/app/profile" className="cursor-pointer">
            <UserRoundCog className="mr-2 h-4 w-4" />
            <span>Datos personales</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/app/profile#danger-zone" className="cursor-pointer text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Borrar cuenta</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <button 
          onClick={handleSignOut}
          disabled={signOutPending} 
          className="flex w-full"
        >
          <DropdownMenuItem className="w-full flex-1 cursor-pointer disabled:opacity-50">
            {signOutPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Cerrando sesion...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesion</span>
              </>
            )}
          </DropdownMenuItem>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}