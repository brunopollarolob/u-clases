# GEMINI.md

This file provides guidance to Gemini when working with this Next.js 15 SaaS template.

## First Step Before Coding

Read `progress.md` first. It is the source of truth for:
- Current implementation status
- Active implementation plan
- Next execution tasks for agents

## Product Scope (Current)

- Primary goal for first deployment: class management only (teachers, students, requests, reviews, notifications).
- Stripe is not part of the v1 production path.
- Future payment integration is planned with Fintoc, in a later phase.
- Contact privacy rule: student sees tutor contact details only after tutor accepts (or completes) a class request.

## Development Commands

### Core Development
```bash
# Install dependencies (requires pnpm)
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Generate TypeScript types from Supabase
pnpm db:types
```

### Database Operations
```bash
# Apply database migrations
supabase db push

# Reset database (careful - destructive)
supabase db reset

# Link to Supabase project
supabase link --project-ref your-project-id
```

### Payments (Deferred)
Payment commands are intentionally excluded from the default local workflow.
If payment work is explicitly requested in the future, prefer documenting and implementing Fintoc integration as a separate phase.

## Architecture Overview

This is a Next.js 15 SaaS template using modern **Data Access Layer (DAL)** patterns with server-first authentication. Key architectural decisions:

### Authentication & Authorization (DAL Pattern)
- **Next.js 15 DAL**: Server-first authentication with React `cache()` for request memoization
- **Supabase Auth**: Handles user authentication with email/password and OAuth
- **Two-step sign-up UX**: Step 1 credentials/social auth, step 2 required personal/contact data
- **OAuth profile completion gate**: Users missing required profile data are redirected to `/app/profile?complete=1`
- **Two-layer approach**: DAL for user operations, service-role for system operations
- **Request memoization**: Multiple auth checks in same request = single database query
- **Client-side optimization**: AuthProvider relies on server-side initial data
- **Row Level Security (RLS)**: Database-level access control automatically filters user data

### Database Layer (Two-Layer Architecture)
- **User Layer (DAL)**: Functions in `lib/auth/dal.ts` with auth checks and RLS
- **System Layer**: Functions in `lib/db/queries.ts` with service-role (bypasses RLS)
- **Evolving schema**: `users` plus domain tables for tutor profiles, class requests, and reviews
- **Auto-generated TypeScript types**: Perfect type safety from database schema
- **Migration-based schema**: SQL migrations in `supabase/migrations/`

### Payments Roadmap (Not in v1)
- Payment functionality is deferred for first deployment.
- Existing Stripe-related code is legacy/optional and not part of current acceptance criteria.
- Future payment work should target Fintoc and be introduced behind an isolated migration plan.

### UI Architecture
- **Design System**: 2-variable CSS system (`--primary`, `--neutral`) in `app/globals.css`
- **Component Library**: Radix UI primitives with custom styling
- **Tailwind CSS 4**: Custom theme variables and utility classes
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## Key Directories

### `/app/` - Next.js App Router
- `/app/page.tsx` - Landing page
- `/app/app/` - **Main application area** (customize here)
- `/app/api/` - API routes for server-side functionality
- `/app/(login)/` - Authentication pages (sign-in, sign-up)
- `/app/app/profile/page.tsx` - Personal data and account deletion (danger zone)
- `/app/app/tutor/page.tsx` - Tutor publish onboarding and publish status
- `/app/app/tutor/profile/page.tsx` - Tutor profile and course management (separate from publish)
- `/app/app/tutors/[id]/page.tsx` - Public-in-app tutor detail page for students
- `/app/app/requests/page.tsx` - Centralized request lifecycle management

### `/lib/` - Core Business Logic
- `/lib/auth/` - Authentication helpers and Data Access Layer
- `/lib/db/` - Database queries and schema utilities
- `/lib/payments/` - Legacy payment experiments (out of scope for v1)
- `/lib/supabase/` - Supabase client configuration

### `/components/` - UI Components
- `/components/ui/` - Base UI components (buttons, inputs, cards)
- `/components/` - App-specific components (header, footer, hero)

## Development Patterns

### Adding New Features
1. **Follow authentication patterns**: Use `getUser()` for server-side, `useAuth()` for client-side
2. **Use existing database queries**: Extend `lib/db/queries.ts` rather than writing raw SQL
3. **Apply rate limiting**: New API routes should include rate limiting
4. **Follow design system**: Use CSS variables and Tailwind utilities

### Data Access Layer (DAL) Pattern

**Server Components (Recommended)**
```typescript
// DAL functions with auth checks and RLS
import { getUser, getOptionalUser } from '@/lib/auth/dal';

// Protected page - redirects if not authenticated
const userData = await getUser();

// Optional auth - returns null if not authenticated
const userData = await getOptionalUser();

// All functions use React cache() for request memoization
```

**API Routes**
```typescript
// API-specific functions that throw errors instead of redirecting
import { getApiUser } from '@/lib/auth/dal';

// Get authenticated user + database record
const userData = await getApiUser();
```

**System Operations (Admin/Background Jobs)**
```typescript
// Service-role functions that bypass RLS
import { getServiceSupabase } from '@/lib/supabase/server';

// Example: privileged update not tied to a user session
const supabase = await getServiceSupabase();
await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', userId);
```

**Client Components (Interactive UI)**
```typescript
// Use only for reactive UI elements
import { useAuth } from '@/lib/auth/auth-provider';
const { user, dbUser, loading } = useAuth(); // Optimized with server-side initial data
```

## Security Considerations

### Critical Security Patterns
- **Never skip authentication**: Always verify user identity in API routes
- **Use Row Level Security**: Database automatically filters data per user
- **Rate limiting**: Applied to API routes unless there is a specific reason to exempt one
- **Environment variables**: Keep secrets in `.env.local`, never commit

### Database Migration Safety
- **Test sign-up flow**: Always verify authentication works after migrations
- **No complex triggers**: Avoid triggers that might break during user creation
- **Create functions before triggers**: Ensure all referenced functions exist

## Environment Setup

### Required Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional future payments (not required for v1)
# FINTOC_API_KEY=...
# FINTOC_HOLDER_ID=...
```

## Testing

### Manual Testing Flow
1. **Sign up (2 steps)**: Complete credentials/social step and profile data step, then verify redirect to `/app`
2. **OAuth onboarding**: If social account has incomplete profile data, verify redirect to `/app/profile?complete=1`
3. **Teacher setup**: Create tutor profile and publish at least one course
4. **Request flow**: Student requests class, tutor accepts/completes
5. **Contact privacy gate**: Student sees tutor contact only after accepted/completed request
6. **Review gate**: Student can review only after completed request
7. **Tutor detail navigation**: Open tutor detail from class cards and requests board links
8. **Notifications**: Verify badge updates and seen-state on `/app/requests`
9. **Tutor reviews panel**: Verify `/app/reviews` shows received reviews and clears review notifications
10. **Account safety**: Verify account deletion requires explicit confirmation (`ELIMINAR`) from `/app/profile#danger-zone`
11. **Tutor deactivation**: Verify "dar de baja" hides tutor from active listings and clears published courses

## Customization Areas

### Branding (2-variable system)
- `app/globals.css` - Change `--primary` and `--neutral` variables
- All components automatically inherit brand colors

### Main Application
- `app/app/page.tsx` - Main application dashboard
- `app/app/` - Add new protected pages here
- `app/app/reviews/page.tsx` - Tutor-facing received reviews panel
- `app/app/profile/page.tsx` - Shared profile settings + delete account
- `app/app/tutor/page.tsx` - Tutor publish onboarding and publish status
- `app/app/tutor/profile/page.tsx` - Tutor profile/course management
- `app/app/tutors/[id]/page.tsx` - Student-facing tutor detail page

### Landing Page
- `app/page.tsx` - Landing page content
- `components/hero-section.tsx` - Hero section
- `components/features-section.tsx` - Features section
- Landing now uses real top-tutor ranking data from database (ratings + review count)

## Common Issues

### Sign-up Flow Breaks
- Check database migrations didn't add complex triggers
- Verify RLS policies allow user creation
- Test with fresh incognito browser session

### OAuth Provider Disabled
- If Google sign-in shows `Unsupported provider: provider is not enabled`, enable Google in Supabase Auth Providers
- Validate Google Cloud OAuth client credentials and authorized redirect URI
- Re-test sign-in and callback flow after provider enablement

### Payment Issues (Future Scope)
- Payment integration is intentionally out of v1 scope.
- If payment work is requested later, create/update a dedicated plan in `progress.md` before coding.

### Type Errors
- Regenerate types: `pnpm db:types`
- Restart TypeScript server in your editor

## DAL vs Service-Role Decision Guide

### Use DAL Functions When:
- Building Server Components
- Building API routes for authenticated users
- User needs to see their own data
- You need auth checks + RLS protection

### Use Service Functions When:
- Running admin/background operations
- Admin operations
- System-level tasks
- You need to bypass user restrictions

### Example: Class Request Update (System Context)
```typescript
// 1. User-facing request uses DAL
const userData = await getApiUser(); // Auth check + user data

// 2. Background/admin operation can use service-role
const supabase = await getServiceSupabase();
await supabase.from('class_requests').update({ status: 'completed' }).eq('id', requestId);

// 3. User views own data via DAL-protected APIs/pages
```

## Performance Benefits

- **Request Memoization**: DAL functions use React `cache()` - multiple calls in same request = single database query
- **Server-First**: Auth checks happen on server, not client
- **Optimized AuthProvider**: Relies on server-side initial data, eliminates redundant API calls
- **Efficient RLS**: Database-level filtering instead of application-level filtering

## Important Notes

- **Package manager**: This project requires `pnpm` (not npm or yarn)
- **Node version**: Requires Node.js 18+
- **Database**: Always use Supabase migrations for schema changes
- **Styling**: Use Tailwind CSS 4 with custom theme variables
- **Testing**: No automated tests configured - relies on manual testing flow
- **Authentication**: Always prefer DAL functions over direct Supabase client calls
- **No Server Actions**: This template avoids server actions for simplicity