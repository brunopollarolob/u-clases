import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { ConditionalHeader } from '@/components/conditional-header';
import { CookieBanner } from '@/components/ui/cookie-banner';
import { AnalyticsWrapper } from '@/components/analytics-wrapper';
import { DevExtensionErrorFilter } from '@/components/dev-extension-error-filter';
import { getOptionalUser } from '@/lib/auth/dal';

export const metadata: Metadata = {
  title: {
    default: 'U-clases · Clases particulares FCFM',
    template: '%s | U-clases',
  },
  description: 'Plataforma de clases particulares para estudiantes y profesores de la FCFM (Beauchef).',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
  themeColor: '#3b82f6',
};

const manrope = Manrope({ 
  subsets: ['latin'],
  display: 'swap', // Improve font loading performance
  preload: true,
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get initial user data server-side to avoid redundant API calls
  const userData = await getOptionalUser();
  const initialDbUser = userData?.dbUser || null;

  return (
    <html lang="es">
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//vercel.live" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`min-h-[100dvh] bg-background ${manrope.className}`} suppressHydrationWarning={true}>
        <DevExtensionErrorFilter />
        <AuthProvider initialDbUser={initialDbUser}>
          <ConditionalHeader />
          {children}
        </AuthProvider>
        <CookieBanner />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
