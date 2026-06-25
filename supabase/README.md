# Supabase Schema

## Fresh Project Setup

Run `supabase/capturepass_schema.sql` once in the Supabase SQL editor for a new CapturePass project.

That file is the consolidated fresh-project schema. It folds the current bootstrap plus the later feature phases into one pass:

- `public.profiles`
- `public.profile_views`
- `public.admin_audit_log`
- `public.organizations`
- `public.organization_members`
- `public.pass_tokens`
- profile/signup triggers
- slug moderation helpers
- profile access and public visibility RLS policies
- billing, referral, card fulfillment, business-token, and profile-view columns
- contact sharing, analytics, gamification, business webhooks, business assets, and public profile RPCs

If you need to regenerate the file after editing any of the source phase SQL
files, run `node scripts/build_capturepass_schema.js`.

## Existing Project Upgrades

Use the individual `phase*.sql` files only when upgrading an existing database that already has the earlier phases applied.

For older databases, apply phase files in chronological/order-of-dependency order. Do not start with a late phase file, because many of them assume `public.profiles` and related functions already exist.

Recent upgrades:

- `phase76_contact_submission_consent.sql` adds contact consent audit fields for inquiry follow-up consent. This is not a marketing opt-in.
- `phase77_theme_presets.sql` adds curated profile/business themes, custom color storage, and profile theme entitlement enforcement.
- `phase78_custom_theme_text_color.sql` adds a custom text color for readable custom themes.
- `phase87_multilocation_business.sql` adds business locations, future regions, employee location assignment, and analytics filter fields.
- `phase92_public_profile_rls.sql` tightens public profile/profile-view row access.
- `phase93_public_profile_rpc.sql` adds limited public profile RPCs for slug/token profile rendering without exposing internal profile columns.

## Stripe Billing Note

The app expects these billing columns on `public.profiles`:

- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_plan_key`
- `subscription_status`
- `subscription_current_period_end`
- `current_period_end`
- `card_notification_sent_at`

For a fresh project, `bootstrap.sql` includes them all.

## CapturePass Auth And Deployment URLs

Use these values when configuring Supabase Auth, redirect URLs, and callback URLs for production:

- Site URL: `https://capturepass.com`
- Auth callback URL: `https://capturepass.com/auth/callback`
- Password reset / update password URL: `https://capturepass.com/update-password`
- Login redirect URLs: `https://capturepass.com/login` and `https://capturepass.com/*/login`

For local development, keep the existing localhost values in your local environment while pointing production auth settings at `capturepass.com`.
