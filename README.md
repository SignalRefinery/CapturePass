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
- Multi-view profile architecture
- Landing-page vs favorite-view profile modes
- View-aware vCard generation
- Dashboard multi-view management
- Per-view contact visibility controls (email / phone / text)
- Stripe checkout, webhook subscription handling, and Customer Portal flow
- Checkout/signup continuation through auth and email verification
- Middleware/auth reliability hardening
- Auth callback profile bootstrap recovery
- Dashboard slug request UX with pending/rejected/approved feedback
- Slug moderation enforcement across dashboard, admin, public profile, token, and vCard paths
- Admin slug review confirmations and audit logging
- Public profile anti-indexing and crawl-hardening
- Database-level slug/profile enforcement migration

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
- Restricted slug detection
- Randomized fallback
- SQL-backed moderation fields
- Admin approval / denial pipeline
- Database trigger backstop for direct profile updates

Stripe:
- Checkout flow working
- Webhooks connected
- Subscription data stored
- Customer Portal wired from account page
- Signup/login checkout continuation preserved

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
- phase_slug_db_enforcement.sql

Important:
- `phase_slug_db_enforcement.sql` should be applied in Supabase before production onboarding.
- Test dashboard profile saves, admin slug review, Stripe webhook updates, and auth signup bootstrap after applying it.

---

Recent Hardening Pass

Completed production-hardening work:
- Stripe webhook consistency: subscription events update subscription fields; one-time additional-card purchases do not overwrite subscription state.
- Stripe Customer Portal: authenticated users with Stripe customer IDs can manage billing; founder/billing-exempt accounts get manual-billing messaging.
- Checkout continuation: selected checkout plan survives signup/login/email verification and returns users to checkout safely.
- Middleware/auth reliability: reduced duplicate auth calls, added timeout/failure tolerance, preserved public/token route reliability.
- Auth profile bootstrap: profile creation/update failures now route to a clear recovery state instead of silently landing users in broken dashboard states.
- Slug request UX: dashboard slug field is editable, explains pending review, rejected, restricted, approved, and available states.
- Slug moderation enforcement: app routes prevent restricted/review slugs from bypassing moderation through dashboard, admin, public profile, token, or vCard paths.
- Admin slug safety: approve/deny actions require confirmation and write audit records.
- Public profile privacy: profile and token routes use noindex/nofollow/noarchive metadata and `X-Robots-Tag`; sitemap remains marketing-only.
- DB slug/profile security: new migration adds database-level trigger protection for slug moderation and sensitive profile fields.

---

Operational Checklist Before Onboarding

- Apply all Supabase migrations in order, including `phase_slug_db_enforcement.sql`.
- Run a dashboard profile save as a normal user.
- Request a restricted slug from the dashboard and verify the current public URL remains active.
- Approve and deny slug requests from admin; confirm audit records are written.
- Test checkout as a logged-out user and verify signup/login continuation returns to checkout.
- Trigger Stripe checkout/webhook activation and confirm subscription fields, `is_active`, and card notification behavior.
- Open Stripe Customer Portal from `/account` for a paid user.
- Verify founder/billing-exempt account messaging does not push users into Stripe billing.
- Verify public profile, token route, and vCard route all respect active/consent/approved slug rules.
- Verify public profile responses include noindex headers and profiles are absent from `sitemap.xml`.

---

Stripe Setup

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook

Add webhook secret to .env.local

Test:
stripe trigger checkout.session.completed

---

Known Issues / Remaining Risks

1. `phase_slug_db_enforcement.sql` must be applied and verified in Supabase before production onboarding.
2. API routes still need a consistency pass for user-safe error messages and operational logging.
3. Subscription/account UI can be clearer about renewal/cancel states, Stripe mismatch states, and plan history.
4. Public profiles are intentionally shareable; noindex headers discourage compliant crawlers but do not stop malicious scraping.
5. Lightweight monitoring/logging is still needed for auth, webhook, admin, and profile-save failures.

---

Priority Tasks

High:
- Apply and verify Supabase migrations in a staging/production-like environment.
- Run full production-style QA after DB enforcement is applied.
- Verify Stripe webhook activation, checkout continuation, and portal behavior end-to-end.

Medium:
- Improve API error handling across checkout, portal, admin, profile-report, and profile-save routes.
- Improve subscription UI + plan management clarity.
- Add lightweight operational logging/monitoring.

Low:
- UI polish
- Performance tuning
- Phase 2 planning for custom card projects and uploaded assets

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
