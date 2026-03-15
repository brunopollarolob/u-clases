'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Star,
  MessageCircle,
  Filter,
  Shield,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const features = [
  {
    title: 'Ramos de Plan Común (Especialidad próximamente...)',
    description: 'Filtra profesores por los 16 ramos clave del Plan Común de la FCFM..',
    icon: Filter,
    gradient: 'from-primary to-primary/70',
    delay: 'delay-100',
  },
  {
    title: 'Sistema de Reseñas',
    description: 'Calificaciones verificadas de 1 a 5 estrellas. Encuentra al mejor tutor basándote en la experiencia real de tus compañeros.',
    icon: Star,
    gradient: 'from-primary/90 to-primary/60',
    delay: 'delay-200',
  },
  {
    title: 'Contacto Directo',
    description: 'Conecta con tu profesor por email o WhatsApp en un clic. Sin intermediarios ni complicaciones.',
    icon: MessageCircle,
    gradient: 'from-primary/80 to-primary/50',
    delay: 'delay-300',
  },
  {
    title: 'Para Alumnos y Profes',
    description: 'Dos roles distintos: regístrate como Alumno para buscar clases particulares o como Profesor para ofrecer tus clases.',
    icon: Users,
    gradient: 'from-primary/70 to-primary/40',
    delay: 'delay-400',
  },
  {
    title: 'Solo para la FCFM',
    description: 'Diseñado exclusivamente para la comunidad de Beauchef. Cursos y profesores validados dentro de la facultad.',
    icon: BookOpen,
    gradient: 'from-primary/60 to-primary/30',
    delay: 'delay-500',
  },
  {
    title: 'Seguro y Confiable',
    description: 'Autenticación segura con Supabase. Tus datos y contactos protegidos con políticas de seguridad a nivel de base de datos.',
    icon: Shield,
    gradient: 'from-primary/80 to-primary',
    delay: 'delay-600',
  },
];

const stats = [
  { value: '16', label: 'Ramos de Plan Común (especialidad próximamente...)', delay: 'delay-100' },
  { value: '100%', label: 'Gratuita', delay: 'delay-200' },
  { value: 'FCFM', label: 'Exclusiva Beauchef', delay: 'delay-300' },
  { value: '5★', label: 'Sistema de Reseñas', delay: 'delay-400' },
];

export function FeaturesSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="py-20 bg-background" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDuration: 'var(--duration-slow)' }}>
          <div className="badge badge-primary mb-6 animate-scale-in">
            <BookOpen className="w-4 h-4 mr-2" />
            Todo en un solo lugar
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-slide-up delay-100">
            La plataforma de clases particulares
            <span className="block gradient-text animate-gradient">
              que Beauchef necesitaba
            </span>
          </h2>

          <div
            className={`mx-auto mb-6 max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 text-left shadow-lg shadow-primary/10 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} delay-150`}
            style={{ transitionDuration: 'var(--duration-slow)' }}
          >
            <p className="mb-3 inline-flex items-center rounded-full border border-primary/25 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              De foro suelto a ranking real
            </p>

            <h3 className="text-base md:text-lg font-semibold text-foreground mb-3">
              U-clases existe para ordenar el caos de buscar profe.
            </h3>

            <p className="text-sm md:text-base text-foreground/90 leading-relaxed mb-4">
              Actualmente, el principal medio para ofrecer clases particulares es U-Cursos,
              una plataforma que no está optimizada para este fin. Así nace U-clases: centralizar a los profes en
              un solo lugar con un sistema de puntuación robusto.
            </p>

            <div className="grid gap-2 sm:grid-cols-2 text-xs md:text-sm">
              <div className="rounded-lg border border-border bg-background/90 px-3 py-2">
                <p className="font-semibold text-muted-foreground">Antes</p>
                  <p className="text-foreground/90">Publicaciones dispersas y poca señal de calidad.</p>
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
                <p className="font-semibold text-primary">Ahora en U-clases</p>
                  <p className="text-foreground/90">Oferta centralizada con reseñas verificadas y decisiones más rápidas.</p>
              </div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200">
            U-clases centraliza a todos los profesores particulares de la FCFM en una sola plataforma,
            con filtros por ramo, sistema de reseñas verificadas y contacto directo.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`text-center p-5 rounded-xl border border-border bg-muted/30 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${stat.delay}`}
              style={{ transitionDuration: 'var(--duration-slow)' }}
            >
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className={`transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${feature.delay}`}
                style={{ transitionDuration: 'var(--duration-slow)' }}
              >
                <Card className="h-full group hover-lift border-border">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br ${feature.gradient} rounded-lg mb-3 group-hover:scale-110 transition-transform`} style={{ transitionDuration: 'var(--duration-medium)' }}>
                      <IconComponent className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}