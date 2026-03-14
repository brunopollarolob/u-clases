'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/lib/supabase/types';

interface HeroSectionProps {
  user: User | null;
  needsAccess?: boolean;
  topTutors?: Array<{
    name: string;
    course: string;
    rating: string;
    reviews: number;
  }>;
}

export function HeroSection({ user, topTutors = [] }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Usuario con acceso: ir directo a la app
  if (user?.has_access) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-primary/15 blur-3xl animate-float delay-300" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDuration: 'var(--duration-slow)' }}>
            <div className="badge badge-success mb-8 animate-scale-in delay-100">
              <GraduationCap className="w-4 h-4 mr-2" />
              Acceso Activo
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up delay-200">
              ¡Bienvenido de vuelta
              <span className="block gradient-text animate-gradient">
                a U-clases!
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in delay-300">
              Tu plataforma de clases particulares de la FCFM. Encuentra o publica clases particulares en un solo lugar.
            </p>
            <div className="animate-scale-in delay-400">
              <Button asChild size="lg" className="gradient-bg hover-lift group">
                <Link href="/app">
                  Ir a la plataforma
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Usuario no registrado o sin acceso: landing principal
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(160deg, hsl(219 97% 27% / 0.06) 0%, hsl(0 0% 100%) 50%, hsl(4 80% 45% / 0.04) 100%)' }}>
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-primary/8 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-60 h-60 rounded-full bg-primary/10 blur-3xl animate-float delay-300" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Columna izquierda */}
          <div className={`text-center lg:text-left transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDuration: 'var(--duration-slow)' }}>
            <div className="badge badge-primary mb-6 animate-scale-in">
              <BookOpen className="w-4 h-4 mr-2" />
              Solo para la FCFM · Beauchef
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight animate-slide-up delay-100">
              Encuentra a tu
              <span className="block gradient-text animate-gradient">
                profe ideal
              </span>
              de la FCFM
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg animate-fade-in delay-200">
              La plataforma de clases particulares centralizada de la Universidad de Chile para la Facultad de Ciencias Fisicas y Matematicas. Conecta con estudiantes y profesores de Beauchef.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-scale-in delay-300">
              <Button asChild size="lg" className="gradient-bg hover-lift group">
                <Link href="/app">
                  <Search className="mr-2 h-5 w-5" />
                  Buscar profesores
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="hover-scale">
                <Link href="/sign-up">
                  Registrarme gratis
                </Link>
              </Button>
            </div>
          </div>

          {/* Columna derecha: tarjeta de vista previa */}
          <div className={`transition-all delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDuration: 'var(--duration-slow)' }}>
            <div className="bg-background rounded-xl shadow-2xl border border-border overflow-hidden hover-scale">
              {/* Encabezado */}
              <div className="gradient-bg text-primary-foreground px-6 py-4 flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold">Profes disponibles ahora</h3>
                  <p className="text-xs text-primary-foreground/80">Top de esta semana con datos reales</p>
                </div>
                <span className="rounded-full border border-primary-foreground/35 bg-primary-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Ranking
                </span>
              </div>

              {/* Preview de tarjetas de tutores */}
              <div className="p-5 space-y-3">
                {topTutors.map((tutor) => (
                  <div key={tutor.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {tutor.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{tutor.name}</p>
                        <p className="text-xs text-muted-foreground">{tutor.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">⭐ {tutor.rating}</p>
                      <p className="text-xs text-muted-foreground">{tutor.reviews} reseñas</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <Button asChild className="w-full gradient-bg hover-lift group" size="sm">
                  <Link href="/sign-up">
                    Crear cuenta gratis y contactar
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}