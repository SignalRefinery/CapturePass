# Dead Brand Audit

**Scope:** Remaining TapTagg-era references in the copied TapTagg repo that will become CapturePass  
**Rule:** Audit only. No strings were replaced in source files.

## Summary

- Source files were searched across `app/`, `components/`, `lib/`, `supabase/`, `public/`, `README.md`, config files, and tests.
- Build output and dependencies were not used to drive replacement planning.
- No source matches were found for: `Tap Tagg`, `TapTag`, `Tap Tag`, `tap-tagg`, `tap_tagg`, `www.taptagg.app`, `taptagg.com`, `www.taptagg.com`, `Play Tag`, `Share Instantly`, or `support@taptagg.app`.
- Highest-risk surfaces are the public marketing pages, metadata/image routes, profile shell, and checkout/email copy.

## Marketing Pages

- **Search terms:** `TapTagg`, `Play Tagg`, `taptagg.app`
- **File:** `app/page.tsx`
- **Current usage:** Home hero, nav/footer labels, headline copy, CTA labels, and organization JSON-LD seed
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass` / `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** Primary public brand surface; this should be one of the last visible pages to flip so the rest of the site has a consistent foundation.

- **Search terms:** `TapTagg`, `Play Tagg`
- **File:** `app/how-it-works/page.tsx`
- **Current usage:** Public explainer copy and footer branding
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Strong brand-copy density, including the “Play Tagg” phrase.

- **Search terms:** `TapTagg`, `Play Tagg`
- **Files:** `app/partners/page.tsx`, `app/partner-request/page.tsx`
- **Current usage:** Partner pitch copy and request CTA text
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Both pages are public lead-gen surfaces and reinforce the old brand loudly.

- **Search terms:** `TapTagg`
- **File:** `app/contact-capture-nfc-cards/page.tsx`
- **Current usage:** Public SEO/landing page about contact-capture NFC cards
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Category page for the new positioning, so rename/copy alignment will matter later.

- **Search terms:** `TapTagg`
- **File:** `app/dealerships/page.tsx`
- **Current usage:** Industry landing page copy, FAQ, hero, and metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Industry page with repeated brand mentions.

- **Search terms:** `TapTagg`
- **File:** `app/insurance-agents/page.tsx`
- **Current usage:** Industry landing page copy, FAQ, hero, and metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Same pattern as dealerships; public SEO surface.

- **Search terms:** `TapTagg`
- **File:** `app/real-estate-agents/page.tsx`
- **Current usage:** Industry landing page copy, FAQ, hero, and metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Public SEO page with multiple branded statements.

- **Search terms:** `TapTagg`
- **File:** `app/sales-teams/page.tsx`
- **Current usage:** Industry landing page copy, FAQ, hero, and metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Another public lead-gen page that still teaches the old name.

- **Search terms:** `TapTagg`, `taptagg.app`
- **Files:** `app/best-digital-business-card-for-sales-teams/page.tsx`, `app/best-digital-business-card-for-insurance-agents/page.tsx`, `app/best-digital-business-card-for-real-estate-agents/page.tsx`
- **Current usage:** SEO comparison/landing content, canonical URLs, titles, FAQ copy, and JSON-LD
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** These are acquisition pages built around the old brand and the SEO category.

- **Search terms:** `TapTagg`
- **File:** `app/best-nfc-business-card-for-car-dealerships/page.tsx`
- **Current usage:** Public SEO landing page, canonical URL, FAQ, and schema
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Heavy repeated brand usage, including the page title.

- **Search terms:** `TapTagg`
- **Files:** `app/resources/page.tsx`, `app/resources/[slug]/page.tsx`, `app/resources/category/[category]/page.tsx`
- **Current usage:** Resource hub copy, footer labels, and category-page metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Mostly SEO/support content, but still public and branded.

- **Search terms:** `TapTagg`, `Play Tagg`
- **Files:** `app/springfield-il-contact-capture/page.tsx`, `app/springfield-il-digital-business-cards/page.tsx`, `app/springfield-il-nfc-business-cards/page.tsx`, `app/springfield-il-sales-team-business-cards/page.tsx`
- **Current usage:** Local SEO landing pages and associated metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Region-specific SEO pages; brand text is present but the pages are less central than the main homepage.

- **Search terms:** `TapTagg`, `taptagg.app`
- **File:** `app/taptagg-vs-popl/page.tsx`
- **Current usage:** Comparison page title, copy, table labels, FAQ, schema, and canonical URL
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Keep the route in place for SEO continuity, but the visible brand is still the old one.

## Pricing Pages

- **Search terms:** `TapTagg`, `taptagg.app`
- **File:** `app/pricing/page.tsx`
- **Current usage:** Individual-plan copy, FAQ, brand labels, and pricing metadata
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** This page is a primary purchase funnel and contains multiple brand mentions.

- **Search terms:** `TapTagg`
- **File:** `app/business-individual/page.tsx`
- **Current usage:** Solo-business pricing, FAQ, product schema, and checkout entry point
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Direct pricing/checkout funnel; very visible and revenue-adjacent.

- **Search terms:** `TapTagg`
- **File:** `app/business/pricing/page.tsx`
- **Current usage:** Team pricing page copy, schema, and CTA labels
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Business pricing is one of the core rebrand surfaces.

## Business Pages

- **Search terms:** `TapTagg`, `TapTagg Business`
- **File:** `app/business/page.tsx`
- **Current usage:** Business landing page copy, inquiry email, schema, and footer branding
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** Has both public-facing copy and a server action that emails the old brand.

- **Search terms:** `TapTagg`
- **Files:** `app/dashboard/business/page.tsx`, `app/dashboard/business/actions.ts`
- **Current usage:** Business dashboard shell, onboarding flows, invite logic, and pass-fulfillment email copy
- **Visible:** Mixed
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** This is a shared operational surface where the old brand still reaches customers by email and UI.

- **Search terms:** `TapTagg`
- **Files:** `components/business/dashboard/business-automations-section.tsx`, `components/business/dashboard/business-settings-section.tsx`, `components/business/dashboard/business-team-section.tsx`
- **Current usage:** Business dashboard labels, webhook copy, and admin/help text
- **Visible:** Mixed
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Internal UI text, but still visible to business admins.

- **Search terms:** `taptagg_brand`
- **Files:** `lib/themes.ts`, `lib/profiles/default-profile.ts`, `app/api/checkout/route.ts`, `app/dashboard/business/actions.ts`, `supabase/bootstrap.sql`, `supabase/phase82_taptagg_profile_brand_theme.sql`, `supabase/phase83_taptagg_brand_universal.sql`, `supabase/phase84_taptagg_brand_theme_constraint_fix.sql`, `supabase/phase85_business_taptagg_brand_theme.sql`
- **Current usage:** Default theme key, theme presets, DB defaults/constraints, and new organization/profile bootstrapping
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** high
- **Notes:** This is a schema-level legacy brand key, so changing it later needs coordinated data and migration work.

## Public Profile Pages

- **Search terms:** `TapTagg`, `taptagg.app`
- **File:** `app/[slug]/page.tsx`
- **Current usage:** Public profile rendering, metadata, and redirect logic
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** The user-facing profile route is central to the brand migration.

- **Search terms:** `TapTagg`, `taptagg.app`
- **File:** `app/u/[token]/page.tsx`
- **Current usage:** Private/issued token profile rendering and redirect behavior
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Privacy-mode route still advertises the old brand.

- **Search terms:** `TapTagg`
- **File:** `app/p/[token]/page.tsx`
- **Current usage:** Business pass rendering and inactive-state copy
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Pass cards are public and customer-facing.

- **Search terms:** `TapTagg`
- **Files:** `app/pass/[token]/page.tsx`, `app/pass/business/[token]/page.tsx`
- **Current usage:** Public pass URL handling for personal and business passes
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** These are hard customer-facing entry points.

- **Search terms:** `TapTagg`
- **Files:** `app/dashboard/pass/pass-page.tsx`, `app/dashboard/preview/page.tsx`, `components/profile/taptagg-profile-shell.tsx`, `components/profile/contact-share-modal.tsx`
- **Current usage:** Public preview, pass fallback, profile shell branding, and contact-share modal copy
- **Visible:** Mixed
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** The profile shell is one of the most reused rendering layers in the app.

## Dashboard

- **Search terms:** `TapTagg`, `taptagg.app`, `taptagg_pending_checkout`
- **File:** `app/dashboard/page.tsx`
- **Current usage:** Main dashboard copy, founder-card workflow, checkout recovery, and email notifications
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Contains both visible and operational brand strings.

- **Search terms:** `TapTagg`
- **Files:** `app/dashboard/contacts/page.tsx`, `app/dashboard/analytics/page.tsx`, `app/account/page.tsx`, `app/dashboard/preview/page.tsx`, `components/dashboard/inactive-state.tsx`, `components/dashboard/profile-editor.tsx`
- **Current usage:** Dashboard labels, preview text, account copy, and profile editor helper text
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Mostly UI copy, but it appears in daily user workflows.

## Admin

- **Search terms:** `TapTagg`, `taptagg.app`, `TapTagg Admin`
- **Files:** `app/admin/page.tsx`, `app/admin/account/[userId]/page.tsx`, `app/api/admin/users/[userId]/route.ts`, `app/api/admin/users/[userId]/disable/route.ts`, `app/api/admin/slug-review/route.ts`, `app/api/referrals/[profileId]/reconcile/route.ts`
- **Current usage:** Admin console copy, operational email notices, and protected admin helpers
- **Visible:** Mixed
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Mostly internal, but admin-triggered emails still send the old brand to customers.

- **Search terms:** `TapTagg`
- **File:** `app/api/business/webhooks/test/route.ts`
- **Current usage:** Internal business webhook test route naming and admin guard usage
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** low
- **Notes:** Brand impact is minimal, but this route is part of admin instrumentation.

## Emails

- **Search terms:** `TapTagg`, `hello@taptagg.app`, `noreply@taptagg.app`, `john@taptagg.app`
- **Files:** `lib/notifications/send-registration-email.ts`, `lib/notifications/send-slug-approved-email.ts`, `lib/notifications/send-business-individual-logo-email.ts`
- **Current usage:** Resend templates, default from/to addresses, and email subjects/body copy
- **Visible:** User-visible
- **Recommended replacement:** `support@capturepass.com` and/or `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** These messages go directly to customers and internal ops.

- **Search terms:** `TapTagg`, `hello@taptagg.app`, `noreply@taptagg.app`
- **Files:** `app/business/page.tsx`, `app/api/partner-request/route.ts`, `app/api/profile-report/route.ts`, `app/api/contact-share/route.ts`, `app/api/admin/users/[userId]/route.ts`, `app/auth/callback/route.ts`, `app/api/webhook/route.ts`, `app/dashboard/page.tsx`, `app/dashboard/business/actions.ts`
- **Current usage:** Inquiry emails, report emails, profile-approval emails, webhook notifications, and invite/pass emails
- **Visible:** User-visible
- **Recommended replacement:** `support@capturepass.com`
- **Risk:** high
- **Notes:** These are live operational emails and should move carefully with the rest of the brand.

## Metadata

- **Search terms:** `TapTagg`, `Play Tagg`, `taptagg.app`
- **Files:** `lib/seo.ts`, `lib/social-image.ts`, `app/layout.tsx`
- **Current usage:** Site name, tagline, description, metadata base, Open Graph/Twitter defaults, and JSON-LD author/site naming
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** This is the shared metadata backbone and should stay consistent during the rebrand.

- **Search terms:** `TapTagg`, `Play Tagg`
- **Files:** `app/opengraph-image.tsx`, `app/twitter-image.tsx`
- **Current usage:** Generated social preview artwork and brand wordmark text
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** These are generated assets and heavily shape the public brand impression.

- **Search terms:** `taptagg.app`
- **Files:** `lib/site.ts`, `lib/urls/profile-url.ts`, `lib/business/dashboard-utils.ts`, `app/[slug]/login/page.tsx`, `app/u/[token]/page.tsx`, `app/p/[token]/page.tsx`, `app/pass/[token]/page.tsx`, `app/pass/business/[token]/page.tsx`, `app/admin/account/[userId]/page.tsx`
- **Current usage:** App URL fallback for profile URLs, login redirects, and admin/business helpers
- **Visible:** Mixed
- **Recommended replacement:** `capturepass.com`
- **Risk:** high
- **Notes:** These fallbacks are still the old production domain.

## Schema / JSON-LD

- **Search terms:** `TapTagg`
- **Files:** `app/page.tsx`, `app/pricing/page.tsx`, `app/business/page.tsx`, `app/business/pricing/page.tsx`, `app/business-individual/page.tsx`
- **Current usage:** Organization, software application, product, and FAQ schema generation
- **Visible:** User-visible through search/snippet surfaces
- **Recommended replacement:** `CapturePass` / `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** These schema objects feed search engines and social previews.

- **Search terms:** `TapTagg`
- **Files:** `app/dealerships/page.tsx`, `app/insurance-agents/page.tsx`, `app/real-estate-agents/page.tsx`, `app/sales-teams/page.tsx`
- **Current usage:** Local-business JSON-LD and marketing schema for industry pages
- **Visible:** User-visible through search/snippet surfaces
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Strong SEO impact but narrower than the root metadata layer.

- **Search terms:** `TapTagg`
- **Files:** `app/resources/page.tsx`, `app/resources/[slug]/page.tsx`, `app/resources/category/[category]/page.tsx`, `app/springfield-il-*`
- **Current usage:** Article/local-business metadata and resource page schema
- **Visible:** User-visible through search/snippet surfaces
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Mostly SEO surfaces with moderate branding visibility.

- **Search terms:** `TapTagg`
- **File:** `app/taptagg-vs-popl/page.tsx`
- **Current usage:** Comparison schema and recommendation logic
- **Visible:** User-visible through search/snippet surfaces
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** The page is strategically important even if the route remains unchanged.

## Sitemap / Robots

- **Search terms:** `TapTagg`, `taptagg.app`
- **Files:** `app/robots.ts`, `app/sitemap.ts`, `lib/privacy/profile-privacy.ts`
- **Current usage:** Crawl rules, sitemap allow-list, and profile-page privacy metadata
- **Visible:** User-visible to crawlers/search engines
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Keep the crawl/privacy behavior intact while the brand text changes later.

## Checkout / Stripe

- **Search terms:** `TapTagg`, `taptagg.app`, `taptagg_brand`
- **Files:** `app/api/checkout/route.ts`, `app/api/webhook/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/portal/route.ts`
- **Current usage:** Checkout flow, webhook handling, customer portal, checkout organization bootstrap, and fallback brand defaults
- **Visible:** Mixed
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Change brand text only after keeping payment and subscription logic stable.

- **Search terms:** `TapTagg`
- **Files:** `lib/plans.ts`, `lib/business/plans.ts`, `app/business-individual/page.tsx`, `app/business/pricing/page.tsx`, `app/account/page.tsx`, `app/dashboard/page.tsx`
- **Current usage:** Plan labels, pricing descriptions, and billing UI copy
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Pricing and checkout copy are intertwined; do not rename plan behavior yet.

- **Search terms:** `TapTagg`
- **File:** `lib/stripe.ts`
- **Current usage:** Stripe client bootstrap only
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** low
- **Notes:** No user-facing copy here; the file matters only for integration wiring.

## Supabase / Auth

- **Search terms:** `TapTagg`, `taptagg.app`, `taptagg.local`
- **Files:** `app/auth/callback/route.ts`, `app/auth/setup-error/page.tsx`, `app/[slug]/login/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`
- **Current usage:** Auth callback, setup-recovery, login, signup, and redirect messaging
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** Auth callbacks and redirects are brittle, so keep behavior and URLs unchanged until later.

- **Search terms:** `TapTagg`, `taptagg.app`
- **Files:** `lib/auth/admin.ts`, `lib/auth/admin-shared.ts`, `lib/auth/redirect.ts`, `lib/business/dashboard-utils.ts`, `lib/business/dashboard-data.ts`
- **Current usage:** Admin helper names, internal redirect base, and business dashboard helper URLs
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** The function names and helper constants are implementation-level; rebrand them after public copy is done.

- **Search terms:** `TapTagg`, `taptagg.app`
- **Files:** `lib/urls/profile-url.ts`, `app/p/[token]/page.tsx`, `app/u/[token]/page.tsx`, `app/[slug]/login/page.tsx`, `app/admin/account/[userId]/page.tsx`
- **Current usage:** App URL resolution for profile links, issued tokens, and admin redirects
- **Visible:** Mixed
- **Recommended replacement:** `capturepass.com`
- **Risk:** high
- **Notes:** These fallbacks directly affect generated links and redirects.

- **Search terms:** `taptagg_brand`
- **Files:** `lib/themes.ts`, `lib/profiles/default-profile.ts`, `app/api/checkout/route.ts`, `app/dashboard/business/actions.ts`, `supabase/bootstrap.sql`, `supabase/phase82_taptagg_profile_brand_theme.sql`, `supabase/phase83_taptagg_brand_universal.sql`, `supabase/phase84_taptagg_brand_theme_constraint_fix.sql`, `supabase/phase85_business_taptagg_brand_theme.sql`
- **Current usage:** Default brand theme key in app logic and database schema
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** high
- **Notes:** This is a cross-layer identifier and should not be changed casually.

- **Search terms:** `TapTagg`
- **Files:** `app/api/pass-vcard/[token]/route.ts`, `app/api/vcard/[slug]/route.ts`, `app/api/analytics/event/route.ts`
- **Current usage:** Internal fallback names, analytics salt fallback, and vCard/profile rendering paths
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** Not direct branding, but the old name still appears in internal defaults.

## Resend / Email Config

- **Search terms:** `hello@taptagg.app`, `noreply@taptagg.app`, `john@taptagg.app`
- **Files:** `README.md`, `PRODUCTION-CHECKLIST.md`, `app/api/profile-report/route.ts`, `app/business/page.tsx`, `app/dashboard/page.tsx`, `app/auth/callback/route.ts`, `app/api/partner-request/route.ts`, `app/api/contact-share/route.ts`, `app/api/admin/users/[userId]/route.ts`, `lib/notifications/send-registration-email.ts`, `lib/notifications/send-slug-approved-email.ts`, `lib/notifications/send-business-individual-logo-email.ts`
- **Current usage:** Env examples, default operational mailboxes, and message senders
- **Visible:** Mixed
- **Recommended replacement:** `support@capturepass.com`
- **Risk:** high
- **Notes:** These addresses are embedded across both docs and live email flows.

## Legal Pages

- **Search terms:** `TapTagg`
- **Files:** `app/privacy/page.tsx`, `app/terms/page.tsx`, `components/legal/affiliate-terms.tsx`
- **Current usage:** Legal copy and support links
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** medium
- **Notes:** Lower revenue risk, but still public and brand-bearing.

## Static Assets

- **Search terms:** `TapTagg`, `Play Tagg`
- **Files:** `app/opengraph-image.tsx`, `app/twitter-image.tsx`
- **Current usage:** Generated social image artwork and brand wordmark text
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** These are effectively brand assets even though they are code-generated.

- **Search terms:** `TapTagg`
- **Files:** `public/custom-taptagg-card.jpg`, `lib/seo.ts`
- **Current usage:** Current logo/OG image asset reference and metadata logo target
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass by HandshakeIQ`
- **Risk:** high
- **Notes:** This is the clearest old-brand asset name still in the tree.

- **Search terms:** `TapTagg`
- **Files:** `components/shared/taptagg-mark.tsx`, `components/shared/brand-header.tsx`, `components/profile/taptagg-profile-shell.module.css`
- **Current usage:** Old brand component/module names and visible brand mark text
- **Visible:** Mixed
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** File/component renames should wait until the public-copy migration is already underway.

## Public Manifest / Icons

- **Search terms:** `manifest`, `icon`, `apple-icon`, `favicon`, `site.webmanifest`
- **Files found:** none in `app/` or `public/`
- **Current usage:** No source manifest/icon files were present to audit
- **Visible:** N/A
- **Recommended replacement:** `defer`
- **Risk:** low
- **Notes:** Any matching files in `.next/` are build artifacts and should not guide source replacement.

## Environment Variables

- **Search terms:** `taptagg.app`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`
- **Files:** `README.md`, `PRODUCTION-CHECKLIST.md`, `app/api/checkout/route.ts`, `app/api/webhook/route.ts`, `app/api/stripe/webhook/route.ts`, `app/auth/callback/route.ts`, `app/dashboard/page.tsx`, `app/admin/account/[userId]/page.tsx`, `app/p/[token]/page.tsx`, `app/u/[token]/page.tsx`, `app/[slug]/login/page.tsx`, `lib/seo.ts`, `lib/site.ts`, `lib/business/dashboard-utils.ts`, `lib/urls/profile-url.ts`
- **Current usage:** Domain fallbacks, redirect URLs, and env examples
- **Visible:** Mixed
- **Recommended replacement:** `capturepass.com`
- **Risk:** high
- **Notes:** These values are sprinkled across docs and runtime code.

## Tests

- **Search terms:** `TapTagg`, `taptagg.app`, `taptagg_brand`
- **Files:** `tests/unit/admin-shared.test.cjs`, `tests/unit/business-dashboard-utils.test.cjs`, `tests/unit/plans.test.cjs`, `tests/unit/profile-buttons.test.cjs`
- **Current usage:** Assertions for old brand helpers, domain fallback behavior, and legacy brand keys
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** low
- **Notes:** Update tests after the source replacements land so the assertions track the new brand truth.

## Documentation

- **Search terms:** `TapTagg`, `taptagg.app`, `hello@taptagg.app`, `noreply@taptagg.app`
- **Files:** `README.md`, `PRODUCTION-CHECKLIST.md`, `LAUNCH_TEST_PLAN.md`, `LAUNCH_TEST_PLAN.txt`, `FINAL-AUDIT.md`, `supabase/README.md`, `supabase/bootstrap.sql`, `supabase/manual_backfill_richmond_auto_group.md`
- **Current usage:** Handoff docs, launch checklists, schema notes, and SQL comments
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** These are valuable audit targets, but they are not product behavior.

- **Search terms:** `TapTagg`
- **Files:** `supabase/phase70_business_branding_admin.sql`, `supabase/phase71_business_auth_invites.sql`, `supabase/phase73_contact_sharing.sql`, `supabase/phase74_analytics_events.sql`, `supabase/phase75_gamification.sql`, `supabase/phase79_business_pricing.sql`, `supabase/phase81_business_webhooks.sql`, `supabase/phase82_taptagg_profile_brand_theme.sql`, `supabase/phase83_taptagg_brand_universal.sql`, `supabase/phase84_taptagg_brand_theme_constraint_fix.sql`, `supabase/phase85_business_taptagg_brand_theme.sql`, `supabase/phase87_multilocation_business.sql`, `supabase/phase88_business_type.sql`, `supabase/phase93_public_profile_rpc.sql`, `supabase/phase_slug_moderation_parity.sql`, `supabase/signup_slug_moderation_fix.sql`
- **Current usage:** SQL comments, theme constraints, org/profile behavior notes, and moderation logic
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** These files contain a mix of brand comments and schema logic; update them only when the database migration phase is ready.

- **Search terms:** `TapTagg`
- **Files:** `package.json`, `package-lock.json`, `vercel.json`
- **Current usage:** Package/repo metadata and deployment cron config
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** low
- **Notes:** No user-facing brand copy here, but they are part of the repo metadata audit surface.

## Other

- **Search terms:** `TapTagg`
- **Files:** `lib/marketing-content.ts`, `lib/social-image.ts`, `components/marketing/resource-index-page.tsx`, `components/marketing/resource-article-page.tsx`, `components/marketing/industry-landing-page.tsx`, `components/marketing/springfield-page.tsx`
- **Current usage:** Shared marketing copy, footer labels, and reusable page shells
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** These are reusable content builders, so replacing the brand here will cascade across many routes.

- **Search terms:** `TapTagg`
- **Files:** `lib/gamification/server.ts`, `lib/gamification/scoring.ts`, `lib/gamification/event-normalizer.ts`, `components/gamification/gamification-panels.tsx`, `components/gamification/business-gamification-manager.tsx`, `lib/types.ts`
- **Current usage:** Metric names, labels, helper names, and data keys such as `taptagg_score`
- **Visible:** Mixed
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** This is not public brand copy, but the old brand is embedded in product metrics and helper names.

- **Search terms:** `TapTagg`, `taptagg_brand`, `taptagg_score`
- **Files:** `lib/themes.ts`, `lib/profiles/default-profile.ts`, `lib/gamification/*`, `supabase/*phase*`
- **Current usage:** Legacy brand keys, default themes, and analytics vocabulary
- **Visible:** Internal
- **Recommended replacement:** `defer`
- **Risk:** medium
- **Notes:** These identifiers are deeper than copy changes and should be handled after public-facing text is stabilized.

- **Search terms:** `TapTagg`
- **Files:** `components/shared/shell.tsx`, `components/shared/brand-header.tsx`, `components/shared/taptagg-mark.tsx`
- **Current usage:** Global nav brand wordmark and shared shell branding
- **Visible:** User-visible
- **Recommended replacement:** `CapturePass`
- **Risk:** high
- **Notes:** This is the shared chrome that many pages inherit, so a later rename will be visually broad.
