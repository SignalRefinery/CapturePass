# CapturePass External Service Dashboard Checklist

Use this checklist for the manual dashboard changes that cannot be completed safely from the repo.

## Scope

- Repo docs and examples can be updated locally.
- Live dashboard settings still need to be changed in Stripe, Resend, Supabase, and Vercel.
- Do not change secrets, webhook signing, or integration behavior from this checklist.

## Environment Values To Set

- `NEXT_PUBLIC_APP_URL=https://capturepass.com`
- `NEXT_PUBLIC_SITE_URL=https://capturepass.com`
- `STRIPE_ADDITIONAL_CAPTUREPASS_CARD_PRICE_ID=<CapturePass additional-card price id>`
- `INTERNAL_FROM_EMAIL="CapturePass <noreply@capturepass.com>"`
- `INTERNAL_ORDER_EMAIL=support@capturepass.com`
- `INTERNAL_REGISTRATION_EMAIL=hello@capturepass.com`

## Stripe

- Set the public business name to `CapturePass`.
- Set the statement descriptor to `CAPTUREPASS` if the account supports it.
- Set branding color to `#0B5FFF`.
- Replace any TapTagg logo references with CapturePass assets.
- Set the support URL to `https://capturepass.com/support`.
- Set the support email to `support@capturepass.com`.
- Rename product and price labels so they read as CapturePass offerings.
- Make product descriptions emphasize contact capture, relationship ownership, and CRM readiness.
- Confirm checkout branding uses CapturePass copy and assets.
- Confirm customer portal branding matches CapturePass.
- Confirm invoice branding matches CapturePass.

## Resend

- Verify the sending domain is configured for the CapturePass domain.
- Use CapturePass as the display name in `from` addresses.
- Use `support@capturepass.com` or another CapturePass address for `reply-to` where needed.
- Keep email footer copy aligned with `CapturePass by HandshakeIQ`.
- Replace any TapTagg-branded logo references in email templates.
- Confirm transactional emails still render correctly after the brand copy update.

## Supabase

- Keep the existing Supabase project.
- Set the Site URL to `https://capturepass.com`.
- Add redirect URLs for:
  - `https://capturepass.com/auth/callback`
  - `https://capturepass.com/update-password`
  - `https://capturepass.com/login`
  - `https://capturepass.com/*/login`
- Confirm any auth email template copy uses CapturePass branding.
- Leave table names, RLS policies, and webhook logic unchanged unless a separate bug fix is required.

## Vercel

- Rename the project to CapturePass if desired for clarity.
- Set the production domain to `capturepass.com`.
- Confirm production environment variables use the CapturePass values above.
- Confirm build-time metadata uses the shared CapturePass constants from the repo.
- Confirm sitemap and robots output resolve against `capturepass.com`.

## Final Manual Verification

- Open a checkout session and confirm CapturePass branding appears end to end.
- Send a transactional email and confirm the sender, footer, and logo are CapturePass-branded.
- Run the auth flow from a real email link and confirm redirects stay on `capturepass.com`.
- Confirm the production domain is live in Vercel before opening the site to users.
