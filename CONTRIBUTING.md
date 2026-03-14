# Contributing to u-clases

Thank you for your interest in contributing to u-clases.

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Before You Start

Read these files first:

- `README_TECHNICAL.md`
- `progress.md`
- `SETUP.md`

These are the source of truth for architecture, current status, and local setup.

## How to Contribute

### Reporting Issues

1. Check existing issues first.
2. Use issue templates when available.
3. Include the following details.
4. Clear problem description.
5. Steps to reproduce.
6. Expected and actual behavior.
7. Environment details (OS, Node, pnpm, browser).
8. Screenshots if applicable.

### Suggesting Features

1. Open a discussion for major features.
2. Explain the use case and expected value.
3. Keep proposals aligned with current v1 scope (class management).
4. Share implementation ideas if possible.

### Submitting Pull Requests

1. Fork the repository and branch from `main`.
2. Follow local setup in `SETUP.md`.
3. Implement changes using existing patterns.
4. Update docs when behavior changes.
5. Test manually before opening the PR.
6. Use clear commit messages, for example:

```text
feat: add tutor detail sorting by rating
fix: prevent duplicate class request submissions
docs: update setup notes for Supabase CLI
```

## Development Guidelines

### Code Style

- TypeScript with explicit types (avoid `any` unless justified)
- Functional React components
- Naming conventions
- Components: PascalCase (`TutorCard.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_UPLOAD_MB`)

### Best Practices

1. Keep solutions simple and maintainable.
2. Avoid ad-hoc auth checks; prefer DAL patterns.
3. Reuse existing utilities in `lib/` and `components/`.
4. Keep API routes rate-limited unless there is a justified exception.
5. Keep docs and schema/types in sync with code changes.

### Database Changes

1. Create a new migration file in `supabase/migrations/`.
2. Keep SQL focused and reversible when possible.
3. Apply migrations locally and validate affected flows.
4. Regenerate types when schema changes:

```bash
pnpm db:types
```

## Testing Checklist

There is no full automated test suite yet. For every PR:

1. Validate the changed flow end-to-end manually.
2. Test edge cases and basic mobile behavior.
3. Run TypeScript checks:

```bash
pnpm exec tsc --noEmit
```

4. If you touched requests/reviews flows, verify notification behavior and review gating after class completion.

## Documentation

Update docs when you change:

- Features or UX behavior
- API contracts
- Environment variables
- Setup steps
- Data model assumptions

## License

By contributing, you agree that your contributions are licensed under MIT.