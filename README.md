SignalPass – Developer Handoff README

Overview
SignalPass is a controlled digital identity platform that generates personalized profile pages, downloadable vCards, and QR/NFC destinations tied to unique slugs and private token routes.

Profiles are:
- Non-indexed (privacy-first)
- Accessible via direct link, NFC, or QR
- Backed by Supabase (auth + database)
- Monetized via Stripe subscriptions
- Designed for controlled public visibility and intentional sharing

---

Current System Status

The system is now **functionally operational and internally usable**.

Recently completed:
- Global navigation system (desktop + mobile unified)
- Role-based navigation (public / user / admin)
- Admin dashboard (spreadsheet-style user table)
- Admin user detail page (fully actionable)
- Token-based routing (`/u/[token]` → redirects to slug)
- Billing + profile visibility in admin
- Core Supabase + Stripe wiring functional

- Multi-view profile architecture
- Landing-page vs favorite-view profile modes
- View-aware vCard generation
- Dashboard multi-view management
- Per-view contact visibility controls (email / phone / text)

The system has moved from prototype → **early production backend**.

---

Primary Use Cases

SignalPass is optimized for:
- Legislative offices
- Lobbyists and government affairs professionals
- Consultants and operators
- Executive and relationship-based networking
- Premium NFC/contact workflows
- Multi-office or multi-role public-facing profiles

---

Your Role

You are continuing development, stabilization, and production hardening.

Responsibilities:
- Maintain and improve system stability
- Complete Stripe integration and subscription UX
- Harden Supabase + auth flows
- Finalize slug moderation and feedback
- Improve admin tooling and safety controls
- Prepare system for production reliability

---

Tech Stack

- Next.js 15 (App Router)
- Supabase (Auth + Postgres)
- Stripe (Billing)
- TypeScript

---

Core System Architecture

Profiles:
- Route: `/[slug]`
- Dynamic rendering
- Includes contact info, vCard, QR code

Profile Views System:
- Profiles may operate in:
  - Single View mode
  - Multi View mode
- Multi View mode supports:
  - multiple office/contact variants
  - landing-page selector mode
  - default/favorite view mode
  - per-view contact visibility
  - view-aware vCards
- Example use cases:
  - Capitol Office
  - District Office
  - Press Contact
  - Constituent Services

Token Routing:
- Route: `/u/[token]`
- Resolves profile securely
- Redirects to approved slug
- Enforces privacy + approval rules

Supabase:
- Auth
- Profiles table (source of truth)
- Slug system
- Token issuance
- Billing linkage

Admin System:
- `/admin` dashboard (spreadsheet-style user table)
- `/admin/account/[userId]` user control panel
- Supports live updates to profile + billing flags

Slug System:
- User-selected slugs
- Restricted slug detection (partial)
- Randomized fallback
- SQL-backed moderation fields
- Admin approval pipeline (partially implemented)

Stripe:
- Checkout flow working
- Webhooks connected
- Subscription data stored
- Portal not fully implemented

---

Environment Variables

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

---

Local Development

npm install
npm run dev

App runs at http://localhost:3000

---

Supabase Setup

Apply SQL files in order:
- schema.sql
- signup_profile_bootstrap.sql
- signup_slug_moderation_fix.sql
- slug_fulfillment_columns.sql
- phase2_profile_safety.sql
- phase5_randomized_slug.sql
- phase8_token_issuance.sql
- phase55_billing.sql
- phase60_profile_views.sql

---

Stripe Setup

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook

Add webhook secret to .env.local

Test:
stripe trigger checkout.session.completed

---

Known Issues (Must Fix)

1. Slug restriction feedback missing (user does not know why slug fails)
2. Slug moderation logic not fully enforced in UI/API
3. Middleware instability if Supabase is unavailable
4. Stripe customer portal not wired
5. Admin actions lack confirmation + audit trail

---

Priority Tasks

High:
- Implement full slug moderation flow (block / restrict / approve)
- Add user-facing slug feedback (no silent failures)
- Complete Stripe customer portal
- Stabilize middleware + auth edge cases

Medium:
- Improve subscription UI + plan management
- Add admin action confirmations
- Add audit logging for admin changes
- Improve error handling across API routes

Low:
- Monitoring / logging
- UI polish
- Performance tuning

---

Development Rules

- Never expose service role key client-side
- Keep profiles non-indexed
- Do not allow silent failures
- Preserve slug security (impersonation prevention is critical)
- All admin mutations must be server-side only

---

Planned Expansion / Phase 2 Requirements

Operator Custom Card Projects:
- Backend-created branded card projects
- Custom branding and URLs
- Campaign-level configuration
- Admin/operator workflow

Tier 2 & Tier 3 Uploads:
- Users upload print-ready card front
- File validation and storage
- Admin review capability
- Linked to fulfillment pipeline

Supported formats:
- PDF, PNG, SVG (primary)
- AI/EPS (optional)

Permission Model:
- Tier 1: standard card
- Tier 2: uploaded artwork
- Tier 3: advanced/custom cards
- Operator/Admin: full control

Architecture Requirements:
- Support multiple card types
- Project-based structure
- Uploaded asset storage
- Approval workflows
- Role-based access
- Separation of standard vs custom cards

Suggested future entities:
- projects
- branded_card_templates
- uploaded_print_assets
- fulfillment_jobs
- subscription_feature_flags

Constraint:
Do not hard-code current system in a way that blocks future expansion.

---

Future Build Considerations

Ensure flexibility for:
- custom branded card projects
- plan-based feature gating
- file-based print workflows
- admin approval pipelines

- multi-view public identity management
- office/department-specific contact routing
- future multi-profile ownership support

---

Deployment

Current:
- Vercel (active deployments)

Legacy:
- Netlify (previous target)

Ensure environment variables are correctly configured.

---

Final Notes

System is now:
- Functionally usable
- Internally controllable via admin tools
- Structurally ready for production hardening
- Architecturally prepared for multi-view identity workflows

Remaining work focuses on:
- slug security + UX refinement
- billing completion
- system reliability

Focus order:
1. Stability
2. Security (slug + access)
3. Billing completion
4. Expansion
