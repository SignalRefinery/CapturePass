# CapturePass — Final privacy surface audit

## Implemented

### Global non-indexing
- Profile pages use noindex / nofollow / nosnippet / noarchive / notranslate metadata.
- Profile-like routes receive `X-Robots-Tag`.
- Profile-like routes receive no-store / no-cache headers.

### Discovery removal
- Profiles are excluded from sitemap output.
- No public directory or user-search surface is included in these phases.
- Marketing homepage no longer links to public profile preview paths.
- `live-demo` has been neutralized to not-found.

### Shared-content minimization
- Profile metadata is reduced to minimal Open Graph values.
- Referrer policy is set to `no-referrer` for profile pages.

### URL hardening
- Existing custom slug system remains.
- Internal user IDs remain non-sequential.
- Optional randomized token route `/u/[token]` is supported.

### External data exposure
- Public vCard endpoint is restricted to owner/admin access.
- No public profile JSON or bulk user data endpoint was added in these phases.

### Cache / archive control
- Profile-like routes receive:
  - `Cache-Control: private, no-store, no-cache, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`

### Minimal safety
- Public profiles include a report control.
- Report submissions email internal operations.
- Admin can disable and re-enable profiles immediately.

### Consent
- Profile save/publish flow requires public-visibility consent.
- Public profile rendering now also checks consent state.

### Security baseline
- Admin routes remain server-protected.
- Stripe stays the payment boundary.
- HSTS is configured in production.
- No sequential IDs are exposed publicly.

## Remaining manual checks before production
- confirm all phase SQL files have been run
- confirm production env vars are set
- confirm production domain is used in `NEXT_PUBLIC_APP_URL`
- confirm Resend is verified on the production domain
- confirm Stripe success/cancel URLs are production URLs
- confirm at least one approved profile and one disabled profile behave as expected

## SQL files that should already be applied
- `supabase/phase2_profile_safety.sql`
- `supabase/phase5_randomized_slug.sql`
- slug moderation / signup moderation files from earlier phases if not yet applied

## Deployment recommendation
Use `PRODUCTION-CHECKLIST.md` as the final go-live checklist after all files are dropped in.

## Conclusion
The repo now matches the requested privacy model:
- direct-link accessible
- minimal public surface area
- non-indexable
- non-discoverable
- admin-controllable
- consent-gated
- no overbuilt moderation system
