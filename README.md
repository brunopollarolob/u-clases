# u-clases

U-clases conecta estudiantes con tutores universitarios para gestionar clases de punta a punta: descubrimiento de tutores, solicitudes, seguimiento del estado y reseñas.

## Qué resuelve

- Publicación y gestión de perfiles de tutor
- Búsqueda de tutores por curso y precio máximo
- Flujo de solicitudes con estados (pendiente, aceptada, completada)
- Reseñas habilitadas solo después de completar la clase
- Notificaciones con estado de visto persistente

## Alcance de la primera versión

La primera salida a producción prioriza la gestión académica:

- Tutores
- Estudiantes
- Solicitudes
- Reseñas
- Notificaciones

Los pagos no son parte del camino crítico de v1.

## Stack

- Next.js 15 + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS + componentes UI basados en Radix

## Quick Start

```bash
pnpm install
supabase db push
pnpm dev
```

Abre `http://localhost:3000`.

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

## Variables de entorno mínimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email notifications (step 1 base)
EMAIL_NOTIFICATIONS_ENABLED=false
EMAIL_PROVIDER=resend
EMAIL_FROM="U-clases <onboarding@resend.dev>"
EMAIL_REPLY_TO="brunopollarolo.bp@gmail.com"
EMAIL_REDIRECT_TO="brunopollarolo.bp@gmail.com"
RESEND_API_KEY=
```

Si usas el placeholder `re_xxxxxxxxx`, reemplazalo por tu API key real de Resend.

`EMAIL_REDIRECT_TO` fuerza que todos los correos se envien a un inbox de pruebas.
Cuando tengas dominio propio, vacia ese valor para enviar al destinatario real.

## Documentación

- Setup detallado: `SETUP.md`
- Estado de implementación: `progress.md`
- Contexto de agentes: `gemini.md`
- Auth DAL: `lib/auth/README.md`
- Data layer: `lib/db/README.md`

## Créditos

Este proyecto partió desde el template `saas-template-for-ai-lite` de Teemu Sormunen.

- Base: [TeemuSo/saas-template-for-ai-lite](https://github.com/TeemuSo/saas-template-for-ai-lite)
- Desarrollo principal utilizando `Antigravity` con `Gemini 3.1 High`

## Licencia

MIT.
