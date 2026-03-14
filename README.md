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

## Variables de entorno mínimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Documentación

- Setup detallado: `SETUP.md`
- Estado de implementación: `progress.md`
- Guía técnica para contributors: `README_TECHNICAL.md`
- Contexto de agentes: `gemini.md`
- Auth DAL: `lib/auth/README.md`
- Data layer: `lib/db/README.md`

## Créditos

Este proyecto partió desde el template `saas-template-for-ai-lite` de Teemu Sormunen.

- Base: [TeemuSo/saas-template-for-ai-lite](https://github.com/TeemuSo/saas-template-for-ai-lite)
- Desarrollo principal asistido por `antigravity` con `Gemini 3.1 High`
- Desarrollo principal asistido por `GitHub Copilot` con `GPT-5.3-Codex`

## Licencia

MIT.
