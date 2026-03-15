import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserMenuClient, NavigationButtons } from '@/components/header-client';
import { UClasesLogo } from '@/components/uclases-logo';

interface HeaderProps {
  userData: {
    isAuth: boolean;
    userId: string;
    email: string | undefined;
    user: any;
    dbUser: any;
  } | null;
  pathname: string;
}

export function Header({ userData, pathname }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center group">
          <UClasesLogo className="group-hover:opacity-90 transition-opacity" compact />
          <span className="ml-1 text-xs text-muted-foreground font-medium hidden sm:block">· FCFM</span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Navigation buttons - client-side reactive */}
          <NavigationButtons userData={userData} />

          {/* User menu */}
          {userData ? (
            <UserMenuClient
              user={userData.user}
              dbUser={userData.dbUser}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/sign-in">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm" className="gradient-bg">
                <Link href="/sign-up">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 