SignalPass – Developer Handoff README

Overview
SignalPass is a dynamic digital identity platform that generates personalized profile pages, downloadable vCards, and QR codes tied to unique slugs.

Profiles are:
- Non-indexed
- Accessible only via direct link, NFC, or QR
- Backed by Supabase (auth + database)
- Monetized via Stripe subscriptions

---

Your Role

You are taking over active development and stabilization of this project.

Responsibilities:
- Maintain and improve the system
- Complete Stripe integration and subscription UX
- Harden Supabase + auth flows
- Improve slug handling and user feedback
- Prepare the app for production stability

---

Tech Stack

- Next.js 15 (App Router)
- Supabase (Auth + Postgres)
- Stripe (Billing)
- TypeScript

---

Core System Architecture

Profiles:
- Route: /[slug]
- Dynamic rendering
- Includes contact info, vCard, QR code

Supabase:
- Auth
- Profiles
- Slug system
- Token issuance
- Billing linkage

Slug System:
- User-selected slugs
- Restricted slugs
- Randomized fallback
- SQL moderation logic

Stripe:
- Subscription handling
- Billing tracking

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

---

Stripe Setup

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook

Add webhook secret to .env.local

Test:
stripe trigger checkout.session.completed

---

Known Issues (Must Fix)

1. Slug restriction feedback missing
2. Middleware breaks when Supabase unavailable
3. Stripe UX incomplete

---

Priority Tasks

High:
- Fix slug UX
- Stabilize middleware
- Verify Stripe webhooks

Medium:
- Subscription UI
- Error handling improvements

Low:
- Admin tools
- Monitoring

---

Development Rules

- Never expose service role key client-side
- Keep profiles non-indexed
- Do not allow silent failures
- Preserve slug security

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

Supported future formats:
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

---

Deployment

Target:
- Netlify current. Your best practice is the default here.

Ensure environment variables are set.

---

Final Notes

System is functionally complete but needs:
- better UX
- stronger error handling
- full Stripe integration

Focus on stability first, then expansion.
