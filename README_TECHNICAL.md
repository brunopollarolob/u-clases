# u-clases - Technical README

Este documento está orientado a contributors y agentes técnicos.

## Estado actual

El estado detallado vive en `progress.md`. Resumen actual:

- Stack base estable en `Next.js 15 + TypeScript + Supabase`
- Autenticación con patrón DAL y flujo de registro en 2 pasos
- Onboarding y gestión de tutor implementados (`/app/tutor` y `/app/tutor/profile`)
- Búsqueda de tutores por curso y precio máximo (`/app/classes`)
- Ciclo completo de solicitud: estudiante solicita, tutor acepta/completa, estudiante reseña
- Panel unificado de solicitudes (`/app/requests`) y panel de reseñas recibidas (`/app/reviews`)
- Notificaciones con estado persistente de visto
- Carga de foto de perfil para tutor (`/api/tutor/photo`)

## Alcance v1

La primera versión de despliegue está enfocada en gestión de clases:

- Tutores
- Estudiantes
- Solicitudes
- Reseñas
- Notificaciones

Los pagos no son parte del camino crítico de v1. Stripe queda fuera de alcance para producción inicial.

## Estructura general del repositorio

```text
u-clases/
|-- app/
|   |-- (login)/                    # Login, sign-in, sign-up
|   |-- api/                        # Endpoints (requests, reviews, tutor, user, stripe, etc.)
|   |-- app/                        # Área protegida principal
|   |   |-- classes/                # Búsqueda y cards de tutores
|   |   |-- profile/                # Datos personales + danger zone
|   |   |-- requests/               # Gestión de solicitudes
|   |   |-- reviews/                # Reseñas recibidas por tutor
|   |   |-- tutor/                  # Onboarding y gestión de tutor
|   |   `-- tutors/                 # Detalle de tutor para estudiantes
|   |-- auth/                       # Callback de autenticación
|   |-- privacy/                    # Política de privacidad
|   `-- terms/                      # Términos y condiciones
|-- components/
|   |-- ui/                         # Primitivos UI reutilizables
|   `-- *.tsx                       # Componentes de landing y app
|-- lib/
|   |-- auth/                       # DAL, provider y logging de auth
|   |-- db/                         # Consultas de sistema/service-role
|   |-- payments/                   # Código legado de Stripe (no v1)
|   `-- supabase/                   # Clientes y tipos de Supabase
|-- supabase/
|   |-- migrations/                 # Esquema principal y evolución de dominio
|   `-- optional_migrations/        # Migraciones opcionales heredadas
|-- middleware.ts                   # Protección de rutas y rate limit
|-- progress.md                     # Estado de implementación (fuente de verdad)
|-- gemini.md                       # Contexto operativo para agentes
|-- SETUP.md                        # Guía de setup del proyecto
|-- STYLING.md                      # Guía de estilos
```

## Requisitos

- `Node.js >= 18`
- `pnpm >= 8`
- Supabase CLI (para migraciones y tipos)

## Setup rápido

```bash
pnpm install
supabase db push
pnpm dev
```

App local: `http://localhost:3000`

## Comandos útiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm db:types
pnpm exec tsc --noEmit
```

## Variables de entorno mínimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Documentación relacionada

- `progress.md`: estado de implementación y cola de trabajo
- `SETUP.md`: instalación y configuración detallada
- `gemini.md`: contexto técnico y lineamientos para agentes
- `lib/auth/README.md`: guía de autenticación
- `lib/db/README.md`: guía de capa de datos

## Créditos y tooling

Este proyecto partió desde el template `saas-template-for-ai-lite` de Teemu Sormunen.

- Repositorio base: [TeemuSo/saas-template-for-ai-lite](https://github.com/TeemuSo/saas-template-for-ai-lite)
- Desarrollo principal asistido por `antigravity` con `Gemini 3.1 High`
- Desarrollo principal asistido por `GitHub Copilot` con `GPT-5.3-Codex`

## Licencia

MIT.