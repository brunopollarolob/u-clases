# u-clases

u-clases conecta estudiantes con tutores universitarios para gestionar clases de punta a punta: descubrimiento de tutores, solicitudes, seguimiento del estado y resenas.

## Que resuelve

- Publicacion y gestion de perfiles de tutor
- Busqueda de tutores por curso y precio maximo
- Flujo de solicitudes con estados (pendiente, aceptada, completada)
- Resenas habilitadas solo despues de completar la clase
- Notificaciones con estado de visto persistente

## Alcance de la primera version

La primera salida a produccion prioriza gestion academica:

- Tutores
- Estudiantes
- Solicitudes
- Resenas
- Notificaciones

Pagos no son parte del camino critico de v1.

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

## Variables de entorno minimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Documentacion

- Setup detallado: `SETUP.md`
- Estado de implementacion: `progress.md`
- Guia tecnica para contributors: `README_TECHNICAL.md`
- Contexto de agentes: `gemini.md`
- Auth DAL: `lib/auth/README.md`
- Data layer: `lib/db/README.md`

## Creditos

Este proyecto partio desde el template `saas-template-for-ai-lite` de Teemu Sormunen.

- Base: [TeemuSo/saas-template-for-ai-lite](https://github.com/TeemuSo/saas-template-for-ai-lite)
- Desarrollo principal asistido por `antigravity` con `Gemini 3.1 High`
- Desarrollo principal asistido por `GitHub Copilot` con `GPT-5.3-Codex`

## Licencia

MIT.
