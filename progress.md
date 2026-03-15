# Progress - Agent-Focused

Last update: 2026-03-15

## Scope
Track only implementation status and next actions that help coding agents execute work quickly and safely.

## Current Status
- Core auth, DAL, and Supabase integration are working.
- Login/sign-up flow self-heals missing `public.users` records.
- Dev-only browser extension runtime noise (MetaMask/injected scripts) is filtered to avoid false app crashes in localhost.
- Teacher publishing flow is implemented: profile, contact details, hourly rate, and course selection.
- Student discovery flow is implemented: students can browse active teachers and see published courses.
- Student filter now focuses on course and max price (text filter removed).
- Student search supports sorting by popularidad, mejor evaluados, and menor precio.
- Review flow is now gated by class completion: student requests -> tutor accepts/completes -> student can review.
- Request lifecycle is centralized in `/app/requests` for each user (single control panel).
- Teachers get pending-request visibility from dashboard and full handling in the requests panel.
- User menu (top-right avatar) now links directly to `/app/requests` and shows notification badge.
- Notification badge semantics:
	- Tutor: split counters for pending requests and new received reviews.
	- Student: requests updated to accepted/completed (actionable follow-up and review).
- Notifications now support persisted "seen" state via `users.request_notifications_seen_at` and `users.review_notifications_seen_at`.
- Tutor review management is available in a dedicated panel: `/app/reviews`.
- Personal-data editing is now centralized in `/app/profile` and reachable from the top-right avatar menu for both students and tutors.
- Avatar menu now includes a direct shortcut to account deletion (`/app/profile#danger-zone`).
- Account deletion is available from personal data with explicit confirmation (`ELIMINAR`) via `DELETE /api/user`.
- Sign-up collects full name and propagates it to auth metadata.
- Incoming requests show student identity with robust fallback (full name -> email -> short id).
- Tutor profile now supports explicit editing state and safe deactivation ("dar de baja") with course removal.
- Student-side tutor contact data is hidden until request status is accepted/completed.
- Class search now shows both total active published tutors and filtered results.
- Class-search cards were refined to a marketplace-style layout aligned with the latest mock reference (visual hierarchy, pricing block, CTA composition, and booking-style stats).
- Internal app UI was refreshed across dashboard, classes, requests, reviews, profile, and tutor panels.
- Tutor cards now include stronger review contrast, star visuals, and improved contact presentation (WhatsApp + email).
- Tutor profile management now supports profile-photo upload (image only, max 5 MB) and stores `avatar_url` for reuse across app surfaces.
- Tutor avatars are now rendered in class cards, tutor detail page, and user menu when available.
- Student flow now includes a dedicated tutor detail page (`/app/tutors/[id]`) reachable from class search and requests.
- Tutor lifecycle is split between publish (`/app/tutor`) and manage (`/app/tutor/profile`) to avoid mixed intent.
- Landing hero now renders real top tutors by rating/review count (instead of static mock data).
- Plan Común quick-links from internal dashboard now redirect to `/app/classes` with course filter pre-applied.
- Browser tab branding now uses U-clases metadata + custom icon (`app/icon.svg`).
- Auth screens were redesigned to platform style and sign-up now supports a two-step flow.
- Sign-up now captures personal/contact data at registration (`fullName`, `phone`, `academicYear`, `isGraduated`).
- Google registration now routes users to profile completion when personal data is missing.
- Google auth error handling now reports actionable setup guidance when provider is disabled.
- First deployment scope is class management only (teachers/students/requests/reviews), with no active payment gating.
- Student favorites are implemented end-to-end with dedicated panel (`/app/favorites`) and avatar-menu access.
- Tutor review panel now uses robust student identity fallback (DB full name -> auth metadata -> auth email -> id label).
- Tutor courses now support per-course auxiliar flag (`is_ta`) in publish/manage flow and student-facing views.
- TypeScript check is green: `pnpm exec tsc --noEmit`.

## Completed This Session
1. Stabilized auth DAL typing and removed `never` regressions.
2. Updated service-role Supabase client behavior for backend/system operations.
3. Improved Windows build stability for Next.js config.
4. Added dev-only extension error filter in global layout.
5. Fixed login/register break when auth user exists but profile row is missing.
6. Stopped logging `NEXT_REDIRECT` as an application error in DAL.
7. Implemented teacher publishing module end-to-end (`/app/tutor` + API + dashboard entrypoint).
8. Implemented student class-discovery module (`/app/classes`) with filters and visible teacher-published courses.
9. Added class request lifecycle with tutor actions and completion-based review permission.
10. Moved request handling out of class search cards into a unique per-user requests window.
11. Added top-right user-menu entry + badge notifications for request lifecycle updates.
12. Added persisted read-state for request notifications and reset-on-open behavior in `/app/requests`.
13. Added personal-data editing flow in teacher panel + API (`PUT /api/user`).
14. Added profile fields in DB/types (`phone`, `academic_year`, `is_graduated`) and updated sign-up for full name.
15. Moved personal-data entrypoint to `/app/profile` from avatar menu so all roles can update contact data at any time.
16. Added tutor-facing `Reseñas recibidas` panel (`/app/reviews`) with full history and per-course summary.
17. Split tutor notification indicators by type (requests vs reviews) while preserving total avatar badge.
18. Added secure account deletion flow (danger zone + `DELETE /api/user`) and avatar shortcut.
19. Added tutor profile deactivation workflow (`PATCH /api/tutor/profile`), including automatic `tutor_courses` cleanup.
20. Added contact-visibility gate: students only see tutor contact after accepted/completed request.
21. Added classes dashboard indicators for active published tutors vs filtered results.
22. Refreshed internal UI for all primary app screens and request/review cards.
23. Added dedicated tutor detail route (`/app/tutors/[id]`) and linked it from class search + requests panel.
24. Split tutor publish/manage navigation: onboarding at `/app/tutor`, management at `/app/tutor/profile`.
25. Updated landing hero to show real top tutors from database ranking.
26. Replaced template browser-tab branding with U-clases title/description/icon.
27. Redesigned auth pages and implemented two-step sign-up flow.
28. Extended sign-up payload and callback sync to include contact/academic profile fields.
29. Added profile-completion redirect guard for social sign-up (`/app/profile?complete=1`).
30. Added explicit Google-provider-disabled error message for auth setup troubleshooting.
31. Added tutor photo upload API (`POST /api/tutor/photo`) with 5 MB limit, file-type validation, and Supabase Storage persistence.
32. Extended tutor profile forms (`/app/tutor` and `/app/tutor/profile`) with avatar upload UI + preview wired to `users.avatar_url`.
33. Refined `/app/classes` cards to better match marketplace/mock style while preserving U-clases data and contact-visibility rules.
34. Added dashboard Plan Común quick-filter links to class search (`/app/classes?course=...`).
35. Added sorting modes in class search (`popular`, `rating`, `price`) and wired GET filter state.
36. Added student favorites feature end-to-end (DB, API, UI toggles, dedicated panel, avatar-menu link).
37. Improved tutor reviews panel to display student identity reliably using auth fallback sources.
38. Added per-course auxiliar metadata (`tutor_courses.is_ta`) with tutor-form controls and student-side display badges.

## Active Implementation Plan
1. Auth reliability hardening
Status: in progress
Tasks:
- Keep using DAL as the only entrypoint for auth checks in server code.
- Add/keep guardrails for missing profile rows (`create_user_profile` fallback).
- Ensure redirects are intentional and not logged as runtime faults.
- Keep social-auth completion flow consistent with profile completeness checks.

2. Payments integration roadmap (deferred)
Status: deferred
Tasks:
- Keep payment code out of the v1 critical path.
- Do not add Stripe dependencies for first production deployment.
- Revisit payments later with Fintoc design/implementation plan.

3. Student flow iteration (UX/data depth)
Status: in progress
Tasks:
- Keep tuning ranking quality after new sorting modes (popular/rating/price).
- Add richer tutor metadata (rating aggregates now visible in cards/detail; continue refining).
- Add pagination for large request history.

4. Teacher profile completeness
Status: in progress
Tasks:
- Validate personal-data update UX after email change confirmation flow.
- Surface personal fields in class cards where useful (optional privacy controls later).
- Validate auxiliar flag UX copy/clarity and potential future distinction between "fui" vs "soy" auxiliar.

5. Docs alignment for contributors/agents
Status: in progress
Tasks:
- Keep this file as source of truth for execution status.
- Keep high-level docs (`README.md`, `SETUP.md`, `gemini.md`) concise and link here for current implementation state.

## Next Actions (Agent Queue)
1. Run full local sanity test:
- Sign up
- Sign in
- Visit `/app`
- Confirm no auth loop / no `NEXT_REDIRECT` noise

2. Validate class-management E2E in local/dev:
- Student creates class request
- Tutor accepts and completes request
- Student can submit review only after completion
- Student contact unlocks only after tutor accepts/completes
- Tutor receives separated notification counters for request/review updates
- Opening `/app/reviews` marks review notifications as seen
- Tutor can deactivate profile and disappear from active tutor count/listing

3. Validate student search flow:
- Validate manually with at least one active teacher profile and multiple courses.
- Confirm contact visibility and filter behavior in localhost.
- Confirm marketplace-style card layout quality on desktop/mobile and CTA readability.
- Confirm avatar rendering fallback when tutor has no uploaded photo.
- Validate sorting behavior for all modes (`popular`, `rating`, `price`) and quick-link prefilter from dashboard.
- Confirm `Auxiliar` badge appears correctly in both `/app/classes` and `/app/tutors/[id]`.
- Confirm favorites end-to-end (toggle, panel list, avatar entrypoint).

4. Apply and validate migration for class requests:
- Run `supabase db push` to create `class_requests` in DB.
- Re-test flow: request -> accept -> complete -> review.
Status: done in local validation

9. Apply and validate migration for tutor auxiliar flag:
- Run `supabase db push` to apply `tutor_courses.is_ta`.
- Re-test tutor profile save/update with auxiliar selection.
- Re-test student views to verify auxiliar badge rendering.
Status: done in local validation

5. Apply and validate migration for personal profile fields:
- Run `supabase db push` to create `phone`, `academic_year`, `is_graduated` in `users`.
Status: done in local validation

6. Add lightweight regression checks:
- Keep `pnpm exec tsc --noEmit` mandatory after auth/data-layer edits.

7. Validate account safety actions:
- From avatar -> `Borrar cuenta`, verify navigation to danger zone.
- Confirm deletion requires `ELIMINAR` and removes access/session correctly.

8. Enable Google provider in Supabase when deployment prep starts:
- Configure Client ID + Client Secret in Supabase Auth Providers.
- Add correct callback/redirect URIs in Google Cloud and Supabase URL config.
- Re-test social sign-up flow with forced profile completion (`/app/profile?complete=1`).

## Fast Commands
```bash
pnpm dev
pnpm exec tsc --noEmit
pnpm build
pnpm db:types
```

## Notes For Agents
- Prefer editing `lib/auth/dal.ts` for auth behavior, not ad-hoc auth checks in pages/routes.
- For system operations (admin/background jobs), use `lib/db/queries.ts` with service-role clients.
- Keep development-only mitigations behind `NODE_ENV === 'development'`.
