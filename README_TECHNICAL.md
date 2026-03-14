# u-clases - Technical README

Este documento esta orientado a contributors y agentes tecnicos.

## Estado actual

El estado detallado vive en `progress.md`. Resumen actual:

- Stack base estable en `Next.js 15 + TypeScript + Supabase`
- Autenticacion con patron DAL y flujo de registro en 2 pasos
- Onboarding y gestion de tutor implementados (`/app/tutor` y `/app/tutor/profile`)
- Busqueda de tutores por curso y precio maximo (`/app/classes`)
- Ciclo completo de solicitud: estudiante solicita, tutor acepta/completa, estudiante resena
- Panel unificado de solicitudes (`/app/requests`) y panel de resenas recibidas (`/app/reviews`)
- Notificaciones con estado persistente de visto
- Carga de foto de perfil para tutor (`/api/tutor/photo`)

## Alcance v1

La primera version de despliegue esta enfocada en gestion de clases:

- Tutores
- Estudiantes
- Solicitudes
- Resenas
- Notificaciones

Pagos no son parte del camino critico de v1. Stripe queda fuera de alcance para produccion inicial.

## Estructura general del repositorio

```text
u-clases/
|-- app/
|   |-- (login)/                    # Login, sign-in, sign-up
|   |-- api/                        # Endpoints (requests, reviews, tutor, user, stripe, etc.)
|   |-- app/                        # Area protegida principal
|   |   |-- classes/                # Busqueda y cards de tutores
|   |   |-- profile/                # Datos personales + danger zone
|   |   |-- requests/               # Gestion de solicitudes
|   |   |-- reviews/                # Resenas recibidas por tutor
|   |   |-- tutor/                  # Onboarding y gestion de tutor
|   |   `-- tutors/                 # Detalle de tutor para estudiantes
|   |-- auth/                       # Callback de autenticacion
|   |-- privacy/                    # Politica de privacidad
|   `-- terms/                      # Terminos y condiciones
|-- components/
|   |-- ui/                         # Primitivos UI reutilizables
|   `-- *.tsx                       # Componentes de landing y app
|-- lib/
|   |-- auth/                       # DAL, provider y logging de auth
|   |-- db/                         # Consultas de sistema/service-role
|   |-- payments/                   # Codigo legado de Stripe (no v1)
|   `-- supabase/                   # Clientes y tipos de Supabase
|-- supabase/
|   |-- migrations/                 # Esquema principal y evolucion de dominio
|   `-- optional_migrations/        # Migraciones opcionales heredadas
|-- middleware.ts                   # Proteccion de rutas y rate limit
|-- progress.md                     # Estado de implementacion (fuente de verdad)
|-- gemini.md                       # Contexto operativo para agentes
|-- SETUP.md                        # Guia de setup del proyecto
`-- STYLING.md                      # Guia de estilos
```

## Requisitos

- `Node.js >= 18`
- `pnpm >= 8`
- Supabase CLI (para migraciones y tipos)

## Setup rapido

```bash
pnpm install
supabase db push
pnpm dev
```

App local: `http://localhost:3000`

## Comandos utiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm db:types
pnpm exec tsc --noEmit
```

## Variables de entorno minimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Documentacion relacionada

- `progress.md`: estado de implementacion y cola de trabajo
- `SETUP.md`: instalacion y configuracion detallada
- `gemini.md`: contexto tecnico y lineamientos para agentes
- `lib/auth/README.md`: guia de autenticacion
- `lib/db/README.md`: guia de capa de datos

## Creditos y tooling

Este proyecto partio desde el template `saas-template-for-ai-lite` de Teemu Sormunen.

- Repositorio base: [TeemuSo/saas-template-for-ai-lite](https://github.com/TeemuSo/saas-template-for-ai-lite)
- Desarrollo principal asistido por `antigravity` con `Gemini 3.1 High`
- Desarrollo principal asistido por `GitHub Copilot` con `GPT-5.3-Codex`

## Licencia

MIT.