# TapTagg — Production privacy checklist

## Required environment values
- `NEXT_PUBLIC_APP_URL=https://taptagg.app`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `RESEND_API_KEY=...`
- `INTERNAL_ORDER_EMAIL=hello@taptagg.app`
- `INTERNAL_FROM_EMAIL="TapTagg <noreply@taptagg.app>"`

## Required database migrations already introduced
For a fresh project, run `supabase/bootstrap.sql` first, then apply any phase files newer than that bootstrap snapshot. For existing projects, run any phase SQL files not yet applied:
- `supabase/phase2_profile_safety.sql`
- `supabase/phase5_randomized_slug.sql`
- `supabase/phase92_public_profile_rls.sql`
- `supabase/phase93_public_profile_rpc.sql`

## Production checks
- confirm `NEXT_PUBLIC_APP_URL` is no longer localhost
- confirm Resend sending domain is verified
- confirm Stripe success and cancel URLs use production domain
- confirm sitemap only includes homepage, marketing, and legal routes
- confirm profile pages return:
  - `X-Robots-Tag`
  - `Cache-Control: private, no-store, no-cache, must-revalidate`
- confirm `/admin` is accessible only to TapTagg admins from the centralized admin helper/database flag
- confirm public profile only resolves when:
  - `is_active = true`
  - `consent_public_visibility = true`
  - `slug_status = approved`
- confirm public profile pages and vCards use the limited public profile RPC instead of broad `profiles.select("*")`
- confirm disabled profiles 404 immediately
- confirm report flow emails `hello@taptagg.app`
- confirm `/u/[token]` private route works if using token mode

## Netlify / host checks
- keep HTTPS enabled
- confirm HSTS header is present in production
- confirm there is no public directory or profile listing page
- confirm profile URLs are not linked from homepage, footer, or sitemap

## Manual smoke test
1. open homepage
2. open one approved profile by direct link
3. verify page source includes robots noindex tags
4. verify profile is absent from sitemap
5. disable the profile in admin and verify it no longer resolves
6. submit a profile issue report and verify email delivery
7. create a title-based signup and verify it enters review instead of going live
