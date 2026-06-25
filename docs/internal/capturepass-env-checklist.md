# CapturePass Env Checklist

Use this as the human-friendly version of the env inventory. The CSV stays available for copy/paste or spreadsheet use.

## Required

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `INTERNAL_FROM_EMAIL`
- `INTERNAL_ORDER_EMAIL`

## Feature-Gated

These are only needed for the flows you have enabled:

- `STRIPE_CORE_PRICE_ID`
- `STRIPE_DIGITAL_PRICE_ID`
- `STRIPE_TAGG_PLUS_PRICE_ID`
- `STRIPE_CREATOR_PRICE_ID`
- `STRIPE_PRICE_BUSINESS_INDIVIDUAL_LAUNCH_YEARLY`
- `STRIPE_PRICE_BUSINESS_INDIVIDUAL_YEARLY`
- `STRIPE_ADDITIONAL_CAPTUREPASS_CARD_PRICE_ID`
- `STRIPE_ADDITIONAL_TAPTAGG_CARD_PRICE_ID`

## Optional

- `NEXT_PUBLIC_SITE_URL`
- `ANALYTICS_IP_SALT`
- `CRON_SECRET`

## Notes

- `NEXT_PUBLIC_SITE_URL` is a fallback used in email flows when the primary app URL is not available.
- `ANALYTICS_IP_SALT` is preferred for analytics hashing, but the code can fall back if it is missing.
- `CRON_SECRET` protects the cron reconcile endpoint.
- The additional-card Stripe ID has a legacy alias, so either naming path may appear in older docs or env sets.

## CSV Reference

- [capturepass-env-vars.csv](./capturepass-env-vars.csv)
