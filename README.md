TapTagg – Developer Handoff README

Overview
TapTagg is a one-tap sharing product for creators, businesses, salespeople, teams, and everyday operators. It connects NFC cards, QR codes, and direct links to fast TapTagg profiles for sharing socials, links, content, bookings, music, business info, and contact details.

Profiles are:
- Easy to update from one dashboard
- Shareable by NFC tap, direct link, or QR code
- Backed by Supabase (auth + database)
- Monetized via Stripe subscriptions
- Designed for musicians, salespeople, creatives, and small business owners

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
- Unified dashboard save flow for profile and active profile view edits
- Public profile view deep links (`/[slug]?view=VIEW_KEY`) with safe fallback when multi-view is off
- Public QR codes generated from readable slug URLs, including active view query params when applicable
- vCard download headers hardened for `.vcf` handling across mobile browsers
- Stripe checkout, webhook subscription handling, and Customer Portal flow
- Checkout/signup continuation through auth and email verification
- Signup confirm-password field, password visibility toggles, and improved signup code-field placement
- Middleware/auth reliability hardening
- Auth callback profile bootstrap recovery
- Dashboard slug request UX with pending/rejected/approved feedback
- Slug moderation enforcement across dashboard, admin, public profile, token, and vCard paths
- Admin slug review confirmations and audit logging
- Public profile anti-indexing and crawl-hardening
- Database-level slug/profile enforcement migration
- API error response sanitization and contextual server-side diagnostics

The system has moved from prototype → **early production backend**.

---

Primary Use Cases

TapTagg is optimized for:
- Musicians and artists building their fanbase
- Sales professionals closing deals
- Small business owners and entrepreneurs
- Freelancers and creative professionals
- Event organizers and speakers
- Multi-role or multi-office professionals

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
- Public QR code targets readable slug URL, not private token URL

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
  - public view deep links via `?view=VIEW_KEY`
  - slug-based per-view QR targets when a view is active
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
- Remains the durable NFC/issued-card identity route; public QR display uses slug URLs

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

Auth / Onboarding:
- Signup supports password confirmation
- Signup and login support password visibility toggles
- Referral and promo code fields are optional and visually secondary

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
- phase62_profile_view_secondary_action.sql

Important:
- `phase_slug_db_enforcement.sql` should be applied in Supabase before production onboarding.
- `phase62_profile_view_secondary_action.sql` should be applied before using the "None" secondary action option on profile views.
- Test dashboard profile saves, profile view saves, admin slug review, Stripe webhook updates, and auth signup bootstrap after applying migrations.

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
- API error handling: checkout, admin slug review, admin user mutations, profile report, and slug availability now avoid raw provider/database messages in user-facing responses and log contextual diagnostics server-side.
- Dashboard save UX: one "Save changes" action saves profile settings and the active view together, with partial-save warnings.
- Multi-view UX: selecting favorite/landing display activates multi-view mode; default-view controls are hidden in single mode.
- Public sharing: view deep links are honored only when multi-view is active and fall back safely otherwise.
- Auth polish: signup password confirmation, show/hide password controls, and optional referral/promo code placement below submit.
- vCard reliability: `.vcf` download headers and fallback `?view=profile` handling are hardened.

---

Operational Checklist Before Onboarding

- Apply all Supabase migrations in order, including `phase_slug_db_enforcement.sql` and `phase62_profile_view_secondary_action.sql`.
- Run a dashboard profile save as a normal user.
- Run dashboard active-view save in single, favorite, and landing modes.
- Test `Text`, `Email`, and `None` secondary button options on a public profile view.
- Request a restricted slug from the dashboard and verify the current public URL remains active.
- Approve and deny slug requests from admin; confirm audit records are written.
- Test checkout as a logged-out user and verify signup/login continuation returns to checkout.
- Trigger Stripe checkout/webhook activation and confirm subscription fields, `is_active`, and card notification behavior.
- Open Stripe Customer Portal from `/account` for a paid user.
- Verify founder/billing-exempt account messaging does not push users into Stripe billing.
- Verify public profile, token route, and vCard route all respect active/consent/approved slug rules.
- Verify public view links (`/[slug]?view=VIEW_KEY`) open the requested view in multi-view mode and fall back in single mode.
- Verify public QR code targets slug URL / view URL, while issued/NFC token route still redirects correctly.
- Verify Add to Contacts downloads a `.vcf` file on iOS Safari, Chrome, and desktop.
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

1. Supabase migrations must be verified in production/staging after deploy, especially `phase_slug_db_enforcement.sql` and `phase62_profile_view_secondary_action.sql`.
2. Subscription/account UI can be clearer about renewal/cancel states, Stripe mismatch states, and plan history.
3. Public profiles are intentionally shareable; noindex headers discourage compliant crawlers but do not stop malicious scraping.
4. Lightweight monitoring/logging is still needed for auth, webhook, admin, checkout, and profile-save failures.
5. Add-to-Home-Screen / QR onboarding page is not implemented yet.
6. Remaining image optimization warnings exist in `app/custom/page.tsx` and legacy `components/profile/profile-shell.tsx`.

---

Priority Tasks

High:
- Verify Supabase migrations in a staging/production-like environment.
- Run full production-style QA after the latest auth, QR, vCard, and multi-view changes deploy.
- Verify Stripe webhook activation, checkout continuation, and portal behavior end-to-end.
- Build an Add-to-Home-Screen / QR helper page for users to save their TapTagg to a phone home screen and access/share QR codes.

Medium:
- Improve subscription UI + plan management clarity.
- Add lightweight operational logging/monitoring.
- Add "Copy/share this view" controls in dashboard now that public view deep links exist.
- Add a dedicated QR/share panel for base profile URL, active view URL, and issued/NFC token URL.

Low:
- UI polish
- Performance tuning
- Resolve remaining Next `<img>` optimization warnings
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
