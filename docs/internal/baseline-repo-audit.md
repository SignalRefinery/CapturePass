# Baseline Repo Audit

**Project:** Copied TapTagg repo that will become CapturePass  
**Purpose:** Technical baseline for rebrand phases  
**Scope:** Audit/documentation only

## Repo Structure Summary

This is a Next.js App Router codebase with:

- `app/` for routes, pages, API endpoints, metadata routes, and route handlers
- `components/` for shared UI and feature-specific React components
- `lib/` for business logic, integrations, validation, SEO, profiles, and utilities
- `public/` for static assets
- `supabase/` for SQL/migration documentation
- `tests/` for unit coverage
- `docs/internal/` for internal planning and audit documents

The repo already includes a large number of marketing pages, public-profile routes, dashboard surfaces, and API handlers, so the rebrand will need to be staged carefully.

## Framework And Routing System

- Framework: Next.js 15
- Router: App Router
- Route style:
  - `app/<segment>/page.tsx` for pages
  - `app/<segment>/route.ts` for route handlers
  - dynamic routes such as `app/[slug]/page.tsx`, `app/u/[token]/page.tsx`, and `app/p/[token]/page.tsx`
- Metadata routes:
  - `app/robots.ts`
  - `app/sitemap.ts`
  - `app/opengraph-image.tsx`
  - `app/twitter-image.tsx`

## Important Directories

- `app/`
- `app/api/`
- `app/auth/`
- `app/dashboard/`
- `app/business/`
- `app/resources/`
- `app/springfield-il-*`
- `app/[slug]/`
- `app/u/`
- `app/p/`
- `components/marketing/`
- `components/profile/`
- `components/dashboard/`
- `components/business/`
- `components/admin/`
- `lib/seo.ts`
- `lib/social-image.ts`
- `lib/themes.ts`
- `lib/design-tokens.ts`
- `lib/site.ts`
- `lib/privacy/profile-privacy.ts`
- `lib/supabase/`
- `lib/stripe.ts`
- `lib/notifications/`

## Important Config Files

- `package.json`
- `next.config.mjs`
- `tsconfig.json`
- `.gitignore`
- `README.md`
- `supabase/README.md`

## Current Routing Map

### Marketing Pages

- `/` from `app/page.tsx`
- `/how-it-works`
- `/pricing`
- `/contact`
- `/partners`
- `/partner-request`
- `/live-demo`
- `/privacy`
- `/terms`
- `/resources`
- `/resources/[slug]`
- `/resources/category/[category]`
- `/contact-capture-nfc-cards`
- `/dealerships`
- `/insurance-agents`
- `/real-estate-agents`
- `/sales-teams`
- `/springfield-il-contact-capture`
- `/springfield-il-digital-business-cards`
- `/springfield-il-nfc-business-cards`
- `/springfield-il-sales-team-business-cards`
- `/taptagg-vs-popl`
- `/best-digital-business-card-for-sales-teams`
- `/best-digital-business-card-for-insurance-agents`
- `/best-digital-business-card-for-real-estate-agents`
- `/best-nfc-business-card-for-car-dealerships`

### Pricing Pages

- `/pricing`
- `/business-individual`
- `/business/pricing`

### Business Pages

- `/business`
- `/business/pricing`
- `/business-individual`
- `/business/[slug]`
- `/dashboard/business`
- `/dashboard/business/*` actions in `app/dashboard/business/actions.ts`

### Public Profile Pages

- `/[slug]`
- `/u/[token]`
- `/p/[token]`
- `/pass/[token]`
- `/pass/business/[token]`
- `/dashboard/pass`
- `/dashboard/pass/[view]`

### Dashboard Pages

- `/dashboard`
- `/dashboard/analytics`
- `/dashboard/contacts`
- `/dashboard/preview`
- `/dashboard/pass`
- `/dashboard/business`
- `/account`

### Admin Pages

- `/admin`
- `/admin/account/[userId]`
- `/admin/users/[userId]`

### Auth Pages

- `/login`
- `/signup`
- `/forgot-password`
- `/update-password`
- `/auth/setup-error`
- `/auth/callback`
- `/auth/signout`
- legacy business-login redirect at `/[slug]/login`

### API Routes

- `/api/checkout`
- `/api/portal`
- `/api/webhook`
- `/api/stripe/webhook`
- `/api/contact-share`
- `/api/partner-request`
- `/api/profile-logo`
- `/api/profile-report`
- `/api/sales-attribution`
- `/api/vcard/[slug]`
- `/api/pass-vcard/[token]`
- `/api/admin/users/[userId]`
- `/api/admin/users/[userId]/disable`
- `/api/admin/slug-review`
- `/api/slug/availability`
- `/api/business/webhooks/test`
- `/api/business/headshot/download`
- `/api/business/logo/download`
- `/api/gamification/*`
- `/api/referrals/[profileId]/reconcile`
- `/api/cron/gamification-reconcile`

## Current Branding Locations

### Primary Brand Constants

- `lib/site.ts`
- `lib/social-image.ts`
- `lib/seo.ts`
- `lib/design-tokens.ts`
- `lib/themes.ts`
- `app/layout.tsx`

### Brand Strings And Copy Surfaces

- `README.md`
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/business/page.tsx`
- `app/business-individual/page.tsx`
- `app/business/pricing/page.tsx`
- `app/how-it-works/page.tsx`
- `app/contact/page.tsx`
- `app/resources/*`
- `components/marketing/*`
- `components/profile/taptagg-profile-shell.tsx`
- `components/shared/shell.tsx`
- `lib/notifications/*`
- `lib/webhooks/sendWebhook.ts`
- `app/api/*`

### Current Hardcoded Brand Storage

- Site name, tagline, and description in `lib/site.ts`
- Open Graph and Twitter image defaults in `lib/seo.ts` and `lib/social-image.ts`
- Theme names and default palette in `lib/themes.ts`
- Global design tokens in `lib/design-tokens.ts`
- Many product and footer labels throughout `app/` and `components/`

## Current SEO And Metadata Locations

- `lib/seo.ts`
- `lib/social-image.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- page-level `metadata` exports in many `app/**/page.tsx` files
- JSON-LD helpers and usage in `components/seo/` and `app/business*`, `app/resources*`, and marketing pages

## Current External Service Integration Locations

### Supabase

- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`
- `app/auth/callback/route.ts`
- `app/auth/signout/route.ts`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/dashboard/**`
- `app/admin/**`
- `app/api/**`
- `lib/profile-service-server.ts`
- `lib/profile-service-client.ts`
- `lib/profiles/**`
- `lib/business/**`
- `lib/gamification/**`

### Stripe

- `lib/stripe.ts`
- `lib/plans.ts`
- `lib/business/plans.ts`
- `app/api/checkout/route.ts`
- `app/api/webhook/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/portal/route.ts`
- `app/account/page.tsx`
- `app/dashboard/page.tsx`
- `app/business-individual/page.tsx`
- `app/business/pricing/page.tsx`

### Resend

- `lib/notifications/send-registration-email.ts`
- `lib/notifications/send-slug-approved-email.ts`
- `lib/notifications/send-business-individual-logo-email.ts`
- `app/api/contact-share/route.ts`
- `app/api/profile-report/route.ts`
- `app/api/partner-request/route.ts`
- `app/api/admin/users/[userId]/route.ts`
- `app/business/page.tsx`
- `app/api/webhook/route.ts`
- `app/auth/callback/route.ts`

### Vercel / Environment Variables

- `README.md`
- `app/api/checkout/route.ts`
- `app/api/webhook/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/auth/callback/route.ts`
- `app/dashboard/page.tsx`
- `app/p/[token]/page.tsx`
- `app/u/[token]/page.tsx`
- `app/[slug]/page.tsx`
- `lib/site.ts`
- `lib/seo.ts`
- `lib/supabase/*.ts`
- `lib/stripe.ts`
- `lib/notifications/*.ts`
- `app/robots.ts`
- `app/sitemap.ts`

## Public Profile Route Behavior

### `/[slug]`

- Loads the profile by slug through `lib/profile-service-server.ts`
- Applies `profileCanRenderPublicly`
- Requires `consent_public_visibility === true`
- Requires slug moderation approval via `isSlugPubliclyAllowed`
- Uses `profileMetadata()` for noindex/noarchive behavior
- Builds public views through `lib/profiles/public-view.ts`
- Renders `TapTaggProfileShell`
- If the slug is missing but a matching organization exists, redirects to `/${organization.slug}/login`

### `/u/[token]`

- Loads the profile by token
- Requires the profile to be renderable and the slug to be publicly allowed
- Redirects to `/${profile.slug}` when `consent_public_visibility === true`
- Otherwise renders the profile from the issued token URL
- Intended as the durable issued-card / privacy-mode route

### `/p/[token]`

- Loads pass-token records for business/member profiles
- Resolves organization branding and member data
- Renders active business pass profiles
- Falls back to an inactive-pass shell when the token/member is not active

### `/pass/[token]`

- Similar pass-token rendering path for direct pass/profile access
- Supports business-issued pass behavior and business profile linking

## Current Business / Team Route Behavior

### `/business`

- Marketing and lead-capture landing page for teams
- Has a server action that emails business inquiries through Resend
- Uses `TapTagg` branding in copy and metadata

### `/business/pricing`

- Business plan pricing page
- Uses `lib/business/plans.ts`
- Leads into business onboarding and industry pages

### `/business-individual`

- Solo-professional launch offer page
- Starts checkout through `/api/checkout`
- Includes FAQ, plan copy, and launch pricing

### `/dashboard/business`

- Team operations console
- Handles organization management, members, locations, contacts, analytics, and webhooks
- Uses `lib/business/dashboard-data.ts` and `app/dashboard/business/actions.ts`
- Has a platform-admin mode for onboarding new businesses

### Business login and invite flow

- `app/[slug]/login/page.tsx` is the legacy business login entry
- `app/auth/callback/route.ts` handles auth completion and bootstrap recovery
- `app/auth/signout/route.ts` signs the user out and returns to `/`

## Current Branding Locations To Treat As Sensitive

These are the highest-impact files for the future rebrand:

- `lib/site.ts`
- `lib/seo.ts`
- `lib/social-image.ts`
- `lib/themes.ts`
- `lib/design-tokens.ts`
- `app/layout.tsx`
- `components/shared/shell.tsx`
- `components/profile/taptagg-profile-shell.tsx`
- `README.md`
- `app/page.tsx`
- `app/business/page.tsx`
- `app/pricing/page.tsx`
- `app/business-individual/page.tsx`
- `app/business/pricing/page.tsx`
- `app/resources/*`
- `lib/notifications/*`
- `app/api/*`

## Known Risk Areas For The Rebrand

- Public-facing TapTagg strings are spread across many pages and helpers, so a global rename will need careful scoping.
- Profile shell and social image helpers are used widely, so changing them can affect many routes at once.
- `lib/themes.ts` and `lib/design-tokens.ts` are shared styling constants, which makes them high leverage but also high risk.
- Public profile routes have privacy and crawl controls, so any branding or metadata change must preserve noindex and direct-share behavior.
- Business onboarding, checkout, and auth callback flows are tightly coupled to Supabase and Stripe; branding work should avoid accidental behavior changes.
- Several files still contain legacy TapTagg references in notifications, emails, headers, and copy, so the later phases should update those systematically rather than piecemeal.
- `public/custom-taptagg-card.jpg` is a visible static asset and may become a brand-external dependency during later phases.
- Existing `.DS_Store` entries and untracked app directories are unrelated to this phase but should be left alone unless they become part of a later scope.

## Baseline Recommendation

The safest next step is to update shared brand constants and metadata helpers first, then move outward into page-level copy and finally into emails and profile shells. That keeps the rebrand in isolated commits and reduces the chance of accidental behavior changes.
