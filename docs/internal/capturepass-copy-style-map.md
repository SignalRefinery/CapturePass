# CapturePass Copy and Style Map

This note separates content from presentation so rebrand work stays surgical.

## 1. Actual Copy Sources

These files control the visible marketing and product wording:

- `app/page.tsx`
- `app/how-it-works/page.tsx`
- `app/pricing/page.tsx`
- `app/business/page.tsx`
- `app/business-individual/page.tsx`
- `app/capturepass-vs-popl/page.tsx`
- `app/best-digital-business-card-for-sales-teams/page.tsx`
- `app/best-digital-business-card-for-insurance-agents/page.tsx`
- `app/best-digital-business-card-for-real-estate-agents/page.tsx`
- `app/best-nfc-business-card-for-car-dealerships/page.tsx`
- `app/contact-capture-nfc-cards/page.tsx`
- `app/resources/**`
- `app/springfield-il-**`

Profile and dashboard copy is split across the route pages and feature components:

- `app/[slug]/page.tsx`
- `app/[slug]/[memberSlug]/page.tsx`
- `app/p/[token]/page.tsx`
- `app/u/[token]/page.tsx`
- `components/profile/taptagg-profile-shell.tsx`
- `components/dashboard/**`

## 2. Shared Presentation Layer

These files define the shared UI shell and global look:

- `app/layout.tsx`
- `app/globals.css`
- `components/shared/shell.tsx`
- `components/shared/brand-header.tsx`
- `components/shared/capturepass-brand-art.tsx`

The shared shell handles:

- header layout
- desktop/mobile navigation
- button styling
- card styling
- light/dark page variants

## 3. Homepage-Only Styling

The home page intentionally uses the light shell variant:

- `app/page.tsx` passes `pageVariant="light"` to `Shell`
- `app/globals.css` applies the `page-light` rules

That means:

- the homepage has its own light enterprise look
- other pages continue using the default shared shell styling
- a style change in `page-light` should not be expected to affect the rest of the site

## 4. Public Profile Styling

Public profile pages use a separate scoped stylesheet:

- `components/profile/taptagg-profile-shell.module.css`

This file controls:

- profile header brand row
- hero layout
- avatar/logo treatment
- buttons
- link cards
- QR panel
- mobile profile shell behavior

Profile route components that render the shell:

- `app/[slug]/page.tsx`
- `app/[slug]/[memberSlug]/page.tsx`
- `app/p/[token]/page.tsx`
- `app/u/[token]/page.tsx`
- `app/dashboard/preview/page.tsx`

## 5. Brand Assets

Centralized brand artwork lives in:

- `public/brand/README.md`
- `public/brand/CapturePass Logo.png`
- `public/brand/CapturePass Wordmark.png`
- `public/brand/Capturepass Logo with Wordmark.png`
- `public/brand/Capturepass Logo with Wordmark and Tagline.png`

The shared asset helper is:

- `lib/brand-assets.ts`
- `components/shared/capturepass-brand-art.tsx`

## 6. Why The Home Page Looked Different

The home page copy did not disappear.

What changed was presentation:

- the home page uses `page-light`
- the light shell overrides typography, spacing, nav color, and card styling
- the profile shell uses a completely separate module stylesheet
- some brand image sizing changes affected how large the logo artwork appeared inside those existing layout rules

## 7. Safe Change Boundaries

If you are adjusting copy:

- edit the route/component file that owns the text
- avoid touching `app/globals.css` unless the intent is visual

If you are adjusting styling:

- use `app/globals.css` for shared site-wide presentation
- use `components/profile/taptagg-profile-shell.module.css` for public profile pages
- use `page-light` rules only for the homepage shell variant

## 8. Quick Rule Of Thumb

- Content lives in page/component files.
- Shared chrome lives in the shared shell files.
- Homepage-only polish lives in `page-light`.
- Public profile polish lives in the profile shell module stylesheet.

