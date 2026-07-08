# CapturePass Post-Rebrand Recap

## Executive Summary

The 12-phase TapTagg to CapturePass rebrand is complete in the repo. The public product now presents as CapturePass by HandshakeIQ, with centralized brand constants, CapturePass palette tokens, CapturePass metadata, CapturePass assets, updated marketing copy, and CapturePass-friendly indexing rules.

The codebase still contains a number of TapTagg-era internal identifiers, legacy theme keys, and historical docs. Those are mostly compatibility or archival leftovers, not user-facing brand leaks. The live theme picker now shows the seven CapturePass-era choices, while older theme keys remain only for compatibility with stored rows.

## Completed Work

### Brand System

- Added centralized brand constants in `lib/brand.ts`.
- Standardized product/company/full-brand naming on CapturePass by HandshakeIQ.
- Locked the primary tagline to `Turn Every Handshake Into a Prospect.`
- Centralized the palette in `lib/design-tokens.ts` and related theme helpers.
- Updated SEO helpers to use CapturePass constants and absolute canonicals.

### Visible Product Naming

- Rebranded public-facing copy across marketing, pricing, business, dashboard, and support surfaces.
- Updated footer, nav, CTA, legal, and email copy to CapturePass language.
- Kept the product positioned as a contact capture platform first, with digital business cards as the SEO acquisition category.

### Routes

- Confirmed public profile routing for:
  - individual profiles
  - business main profiles
  - business team member profiles
- Confirmed redirect handling for inactive/hidden business team members back to the business main profile.
- Left the route structure intact and did not add TapTagg redirects.

### Public Indexing

- `robots.txt` now follows the CapturePass visibility model.
- `sitemap.xml` uses `capturepass.com` and excludes private/unlisted profile-like routes.
- Public pages and comparison pages remain indexable where intended.
- Profile metadata now respects public / unlisted / private visibility modes.

### Design System And Colors

- Replaced the old purple-first identity with the CapturePass blue/gold/charcoal palette.
- Updated shared theme tokens, global CSS, profile shell styling, and social image routes.
- Kept legacy theme keys available for historical rows while presenting the seven current CapturePass theme choices in the editor.

### Assets, Icons, And OG Images

- Added CapturePass app icons and Apple touch icon support.
- Added CapturePass social image routes and CapturePass mark usage.
- Removed the old static TapTagg logo card asset from `public`.
- Confirmed OG/Twitter previews render CapturePass branding.

### Marketing Copy

- Repositioned the homepage around contact capture.
- Updated business pages to emphasize lead capture, team visibility, CRM readiness, and turnover protection.
- Updated pricing copy so digital business cards are included, not the core positioning.
- Kept SEO pages, comparison pages, and local landing pages intact.

### SEO, Canonicals, And Schema

- Canonical URLs now resolve to `capturepass.com`.
- Organization/Product/SoftwareApplication schema uses CapturePass / HandshakeIQ branding.
- Metadata helpers, OG/Twitter defaults, and JSON-LD all align to CapturePass.

### External Service Docs And Config References

- Updated `.env.example`, `README.md`, production checklist docs, and Supabase setup docs.
- Added a manual external dashboard checklist for Stripe, Resend, Supabase, Vercel, DNS, and Google Search Console.
- Preserved live webhook behavior and secret handling.

## Files And Areas Touched By The Rebrand

- `lib/brand.ts`
- `lib/design-tokens.ts`
- `lib/seo.ts`
- `lib/social-image.ts`
- `lib/themes.ts`
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- `app/icon.tsx`
- `app/apple-icon.tsx`
- `app/manifest.ts`
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/business/page.tsx`
- `app/business-individual/page.tsx`
- `app/business/pricing/page.tsx`
- `app/capturepass-vs-popl/page.tsx`
- `app/best-digital-business-card-for-*`
- `app/springfield-il-*`
- `components/profile/*`
- `components/shared/*`
- `components/dashboard/*`
- `components/marketing/*`
- `lib/notifications/*`
- `lib/business/*`
- `lib/privacy/profile-privacy.ts`
- `lib/urls/profile-url.ts`
- `app/api/checkout/route.ts`
- `app/api/webhook/route.ts`
- `app/api/contact-share/route.ts`
- `app/api/profile-report/route.ts`
- `app/auth/callback/route.ts`
- `README.md`
- `.env.example`
- `PRODUCTION-CHECKLIST.md`
- `supabase/README.md`
- `docs/internal/*`

## Remaining Brand References

### Launch Blockers

- None in the repo build, test, or active user-facing surfaces checked in this recap.

### Should Clean Before Launch

These are the only remaining items I would still consider worth fixing before a public launch if you want the repo completely clean of dead-brand filenames or dashboard placeholders:

- `components/contacts/contact-table.tsx`
  - cleaned in this pass
  - previously used `taptagg-contacts` and `taptagg-contact` in exported CSV/vCard filenames
  - now uses CapturePass filenames
- `lib/notifications/qr.ts`
  - cleaned in this pass
  - previously used `taptagg-profile` as the QR filename base
  - now uses CapturePass filenames
- `app/api/pass-vcard/[token]/route.ts`
  - cleaned in this pass
  - previously used `taptagg-contact` in vCard filenames
- `app/api/vcard/[slug]/route.ts`
  - cleaned in this pass
  - previously used `taptagg-contact` in vCard filenames
- `components/business/dashboard/business-automations-section.tsx`
  - cleaned in this pass
  - previously used a `taptagg` example webhook URL placeholder

### Safe Internal Leftovers

These remain in the codebase by design for compatibility or internal identity reasons:

- `taptagg_brand` theme key and related default theme storage
- `taptagg_pending_checkout` cookie name
- `TapTaggProfileShell`, `TapTaggAdminUser`, `getCurrentTapTaggAdmin`, `requireTapTaggAdmin`, and `isTapTaggBootstrapAdminEmail` compatibility aliases
- `calculateTapTaggScore` and `taptagg_score` gamification internals
- `taptagg` keys in the comparison page data model
- `taptagg.local` internal redirect fallback
- `package.json` / `package-lock.json` repo name `capturepass-repo`

### Historical Migration / Doc References

These are archival references from the TapTagg phases and can be deferred unless you want a fully debranded documentation archive:

- `docs/internal/dead-brand-audit.md`
- `docs/internal/baseline-repo-audit.md`
- `docs/internal/capturepass-asset-status.md`
- `docs/internal/public-profile-route-rules.md`
- `docs/internal/visibility-indexing-rules.md`
- `LAUNCH_TEST_PLAN.md`
- `FINAL-AUDIT.md`
- TapTagg-era Supabase phase files and notes in `supabase/`

## Verification Results

### Build And Tests

- `npm run typecheck` passed
- `npm run lint` passed
- `npm run build` passed
- `npm run test` passed

### Launch-Critical Behavior Checked

- Individual public profile routes are present and build successfully.
- Business main profile routes are present and build successfully.
- Business team member profile routes are present and build successfully.
- Inactive/hidden employee redirect logic remains in the public business profile resolver.
- Contact capture, vCard download, dashboard, and business dashboard routes still build successfully.
- Stripe checkout and webhook routes remain wired.
- Resend email helpers still use CapturePass branding.
- Sitemap and robots output are aligned with `capturepass.com`.
- OG and Twitter image routes now render CapturePass branding.
- Comparison pages and local SEO pages remain present and indexable as intended.

## Pre-Launch Checklist

- Verify the production domain in Vercel is `capturepass.com`.
- Verify Stripe public branding, descriptor, support URL, support email, and product names.
- Verify Resend sender domain, from address, reply-to, and email footer branding.
- Verify Supabase Auth Site URL and redirect URLs.
- Verify DNS and SSL for `capturepass.com`.
- Verify Google Search Console ownership and sitemap submission.
- Run a manual smoke test of:
  - `/john-keating`
  - `/richmond-auto`
  - `/richmond-auto/tyler`
  - contact capture
  - vCard download
  - checkout
  - dashboard access
  - business dashboard access

## Manual External Dashboard Checklist

### Stripe

- Set public business name to CapturePass.
- Set statement descriptor to `CAPTUREPASS` if supported.
- Use CapturePass logo and brand color.
- Set support URL to `https://capturepass.com/support`.
- Set support email to `support@capturepass.com`.
- Rename products/prices/descriptions to CapturePass language.
- Confirm customer portal and invoice branding.

### Resend

- Verify the sending domain.
- Use CapturePass in `from` addresses.
- Use `support@capturepass.com` or another CapturePass address for reply-to.
- Confirm footer copy uses `CapturePass by HandshakeIQ`.
- Replace any remaining TapTagg-branded assets in templates.

### Supabase

- Set Site URL to `https://capturepass.com`.
- Add auth redirect URLs for callback, login, and password flows.
- Verify auth template branding.
- Leave schema, RLS, and webhook logic intact.

### Vercel

- Confirm production domain is `capturepass.com`.
- Confirm production env vars use CapturePass values.
- Verify deployment aliases and previews do not leak old URLs.

### DNS / Domain

- Confirm `capturepass.com` resolves to the production deployment.
- Confirm `www.capturepass.com` behavior, if used.
- Confirm SSL certificate and redirects are correct.

### Google Search Console

- Verify domain property ownership.
- Submit the new sitemap.
- Inspect indexing coverage and canonical URLs.

## SEO Follow-Up List

- Re-submit `sitemap.xml` after the domain cutover.
- Confirm canonical URLs in Search Console after launch.
- Monitor comparison/local SEO pages for crawl coverage.
- Confirm no accidental noindex on public business pages.
- Re-check OG snippets for the homepage and major landing pages.

## Product Follow-Up List

- Decide whether to eventually remove legacy compatibility aliases like `TapTaggProfileShell`.
- Decide whether to eventually rename `taptagg_brand` and `taptagg_score` internally.
- Decide whether to leave the `tt_classic` legacy theme available long term.
- Verify the public profile journey and dashboard save flows on real devices.

## Design / Asset Follow-Up List

- Replace any placeholder or temporary brand assets with final CapturePass artwork when ready.
- Confirm logo usage on email and checkout surfaces.
- Confirm icon and OG assets look good on mobile and social previews.

## Recommended Next 5 Commits

1. `docs: add CapturePass post-rebrand recap`
2. `fix: remove remaining user-facing dead-brand filenames`
3. `chore: verify CapturePass external service dashboards`
4. `chore: finalize Search Console and domain cutover`
5. `refactor: optionally rename legacy TapTagg internal symbols`

## Recommended Launch Order

1. Stripe dashboard branding and product verification
2. Resend sender/domain verification
3. Supabase auth URL verification
4. Vercel production domain and env verification
5. DNS cutover for `capturepass.com`
6. Google Search Console submission
7. Final smoke test on production
8. Monitor logs, emails, checkout, and indexing

## Recommended Rollback Plan

- Revert the Vercel production alias to the prior deployment if the launch introduces a user-facing issue.
- Restore previous DNS targets if domain routing breaks.
- Leave the repo changes intact unless the bug is in code.
- If a service dashboard setting causes the issue, roll back that setting first before touching code.
- Keep the last known-good build artifact handy so you can redeploy quickly.
