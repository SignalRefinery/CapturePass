# TapTagg Production Launch Checklist

Last updated: 2026-06-01

Use this before pointing the main URL at production, switching Stripe live, or onboarding paying customers. For each item, mark pass/fail, date tested, account used, and notes.

Tester:
Date:
Environment:
Domain:
Supabase project:
Vercel deployment:

## 1. Launch Gate

Do not launch broadly until these are true.

- [ ] Production deployment is on the intended branch and commit.
- [ ] `npm run typecheck` passes locally.
- [ ] `npm run build` passes locally.
- [ ] Production Vercel build passes.
- [ ] Production Supabase project is the intended project.
- [ ] Real domain DNS is ready and verified.
- [ ] SSL is active on the real domain.
- [ ] Rollback path is known: previous Vercel deployment can be restored.
- [ ] One admin account can log in and repair accounts if needed.
- [ ] Test user data can be safely deleted after launch testing.

## 2. Production Environment Variables

Confirm these are set in Vercel production.

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` or current site URL variable points to the production domain.
- [ ] `NEXT_PUBLIC_APP_URL`, if used, points to the production domain.
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] Stripe live price IDs for all paid plans.
- [ ] `RESEND_API_KEY`, if contact/business notifications are enabled.
- [ ] `CRON_SECRET` is set to a long random value.
- [ ] `.env.local` is not committed.
- [ ] No env var points to localhost after production cutover.
- [ ] No env var points to an old Vercel preview URL after production cutover.

## 3. Supabase Auth And Email

- [ ] Supabase Auth Site URL points to the production domain.
- [ ] Supabase Auth redirect URLs include `https://yourdomain.com/auth/callback`.
- [ ] Supabase Auth redirect URLs include `https://yourdomain.com/update-password`.
- [ ] Supabase Auth redirect URLs include `https://yourdomain.com/*/login`.
- [ ] Personal signup confirmation email sends.
- [ ] Password reset email sends.
- [ ] Business invite email sends.
- [ ] All auth links land on the production domain.
- [ ] SMTP sender/from address is correct.
- [ ] Email deliverability is acceptable in Gmail and Apple Mail.

## 4. Supabase Schema And SQL Phases

Confirm these exist in production Supabase.

- [ ] `profiles`
- [ ] `profile_views`
- [ ] `organizations`
- [ ] `organization_members`
- [ ] `pass_tokens`
- [ ] `contact_submissions`
- [ ] `analytics_events`
- [ ] `gamification_badge_definitions`
- [ ] `gamification_user_badges`
- [ ] `gamification_team_challenges`
- [ ] `gamification_challenge_progress_snapshots`
- [ ] `gamification_competitions`
- [ ] `gamification_competition_results`
- [ ] `sales_attribution_events`
- [ ] Business branding columns exist on `organizations`.
- [ ] Business global link columns exist on `organizations`.
- [ ] Business-only auth trigger from phase71 is active.
- [ ] Public profile RLS from phase92 is active.
- [ ] Limited public profile RPCs from phase93 exist and return only public profile fields.
- [ ] Contact Sharing SQL phase is applied.
- [ ] Analytics SQL phase is applied.
- [ ] Gamification SQL phase is applied.
- [ ] Unique index exists for challenge snapshots by challenge/date.
- [ ] Unique index exists for competition results by competition/user.
- [ ] Seed badge definitions exist or fallback badge definitions are acceptable.

## 5. RLS And Access Control

Test with at least two normal users, one business admin, one team member, and platform admin.

- [ ] Users can read/update only their own personal profile.
- [ ] Public active profiles are readable only when visibility and slug status allow it.
- [ ] Contact submissions are not publicly readable.
- [ ] Personal users can read only their own contacts.
- [ ] Business admins can read contacts for their organization.
- [ ] Team members can read only contacts/events allowed by current team rules.
- [ ] Analytics events do not leak between users or organizations.
- [ ] Gamification badges do not leak private user/org data.
- [ ] Challenge data does not leak across organizations.
- [ ] Challenge snapshots do not leak across organizations.
- [ ] Competitions do not leak across organizations.
- [ ] Competition results do not leak across organizations.
- [ ] Sales attribution events do not leak across users or organizations.
- [ ] Non-admin business members cannot create/update/delete challenges.
- [ ] Non-admin business members cannot create/update/delete competitions.
- [ ] Finalized competition results cannot be edited through normal update/delete paths.
- [ ] Explicit competition recalculation is admin-only.

## 6. Cron And Scheduled Reconciliation

Production cron route:

- [ ] `POST /api/cron/gamification-reconcile` exists.
- [ ] Request without `Authorization` returns unauthorized.
- [ ] Request with wrong bearer token returns unauthorized.
- [ ] Request with `Authorization: Bearer ${CRON_SECRET}` succeeds.
- [ ] `vercel.json` includes daily cron path `/api/cron/gamification-reconcile`.
- [ ] `vercel.json` schedule is `0 8 * * *`.
- [ ] Vercel project has cron enabled.
- [ ] Vercel project has `CRON_SECRET` in production env vars.
- [ ] Cron logs summary counts.
- [ ] Re-running cron does not duplicate badges.
- [ ] Re-running cron does not duplicate challenge snapshots for the same date.
- [ ] Re-running cron replaces/recalculates expired competition results safely.
- [ ] Expired challenges become `completed` when goal is met.
- [ ] Expired challenges become `expired` when goal is not met.
- [ ] Expired competitions become `completed`.
- [ ] Current and previous month badge eligibility is reconciled.

## 7. Build And Smoke Test

- [ ] Production homepage loads.
- [ ] Pricing page loads.
- [ ] Login page loads.
- [ ] Signup page loads.
- [ ] Public personal profile page loads.
- [ ] Public business `/p/[token]` page loads.
- [ ] Dashboard loads for active users.
- [ ] Business console loads for business admins.
- [ ] Admin console loads for platform admin.
- [ ] No obvious mobile layout break on iPhone size.
- [ ] No obvious desktop layout break.
- [ ] Browser console has no launch-blocking errors.
- [ ] Vercel function logs have no recurring launch-blocking errors.

## 8. Personal Signup And Access

Test account:

- [ ] Create a new personal TapTagg account.
- [ ] Confirmation email arrives.
- [ ] Confirmation link goes to production domain.
- [ ] User can log in after confirming.
- [ ] Profile row is created in Supabase.
- [ ] Slug is created.
- [ ] Dashboard loads.
- [ ] Account is inactive before paid or exempt access.
- [ ] Public profile preview works.
- [ ] Inactive account cannot expose public profile unexpectedly.

## 9. FOUNDERS Promo

Test account:

- [ ] Sign up with promo code `FOUNDERS`.
- [ ] Profile is created.
- [ ] `is_active = true`.
- [ ] `billing_exempt = true`.
- [ ] `lifetime_free = true`.
- [ ] `promo_code_used = FOUNDERS`.
- [ ] `stripe_plan_key = creator`.
- [ ] Dashboard shows Creator-level access.
- [ ] Promo/access fields are not user-editable in the dashboard.
- [ ] Founder card claim form sends notification if configured.

## 10. Personal Profile Editing

- [ ] Update name.
- [ ] Update title/role.
- [ ] Update intro.
- [ ] Update email.
- [ ] Update phone.
- [ ] Update website.
- [ ] Save changes.
- [ ] Refresh dashboard and confirm values persisted.
- [ ] Public profile reflects changes.
- [ ] Add to Contacts downloads/opens a vCard.
- [ ] Call button works.
- [ ] Text button works.
- [ ] Email button works.
- [ ] Website button works.
- [ ] QR/Digital Pass opens the correct public profile URL.

## 11. Stripe Checkout

Use Stripe test mode until final live activation. Repeat once with live keys before public launch using a real low-risk payment path or Stripe-approved live test process.

Core:

- [ ] Start checkout for Core.
- [ ] Stripe Checkout opens.
- [ ] Checkout success redirects to `/dashboard?checkout=success`.
- [ ] Dashboard does not send user back to pricing.
- [ ] Profile becomes active.
- [ ] `stripe_customer_id` is stored.
- [ ] `stripe_plan_key = core`.
- [ ] `is_active = true`.

Tagg Plus:

- [ ] Start checkout for Tagg Plus.
- [ ] Checkout success redirects to dashboard.
- [ ] Webhook updates subscription fields.
- [ ] `stripe_subscription_id` is stored.
- [ ] `stripe_plan_key = tagg_plus`.
- [ ] `subscription_status` is active/trialing as expected.
- [ ] `is_active = true`.

Creator:

- [ ] Start checkout for Creator.
- [ ] Checkout success redirects to dashboard.
- [ ] Webhook updates subscription fields.
- [ ] `stripe_subscription_id` is stored.
- [ ] `stripe_plan_key = creator`.
- [ ] Creator-only features appear.

Failure/cancel:

- [ ] Cancel checkout returns to pricing.
- [ ] Failed payment does not incorrectly activate account.
- [ ] Stripe webhook logs show successful processing.
- [ ] Stripe webhook endpoint uses the production URL.
- [ ] Stripe webhook secret matches Vercel production env var.

## 12. Stripe Webhook Events

In Stripe test mode, confirm the app handles:

- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.paid`
- [ ] `invoice.payment_failed`
- [ ] Duplicate webhook retry does not create bad duplicate effects.
- [ ] Card notification behavior is acceptable.

## 13. Contact Sharing

Personal profile:

- [ ] Public profile shows `Share My Contact`.
- [ ] Click opens modal titled `Share Your Contact`.
- [ ] Name is required.
- [ ] Email or phone is required.
- [ ] Invalid email is rejected.
- [ ] Phone is normalized.
- [ ] Long note is limited.
- [ ] Consent-to-contact checkbox is visible and not pre-checked.
- [ ] Submit is blocked with a clear error if consent is unchecked.
- [ ] Successful submit says `Contact shared successfully.`
- [ ] Row appears in `contact_submissions` with `consent_to_contact`, `consent_text`, `consent_given_at`, `source_profile_slug`, `source_url`, `user_agent`, and `ip_address` populated where available.
- [ ] Profile owner can see the contact in Dashboard > Contacts.
- [ ] Dashboard consent row shows granted status, date/time, and language.
- [ ] Another user cannot see it.
- [ ] CSV export works and includes consent granted, consent date, consent language, and source URL.
- [ ] vCard export works.
- [ ] Notification email sends if Resend is configured.
- [ ] Notification failure does not block submission.

Business profile:

- [ ] Business `/p/[token]` profile shows `Share My Contact`.
- [ ] Successful submit says `Contact shared successfully.`
- [ ] Row includes `organization_id`.
- [ ] Row includes the consent audit fields.
- [ ] Row is tied to the correct team member.
- [ ] Business admin can see it in Business Console > Contacts.
- [ ] Team member can only see their own contacts.
- [ ] CSV export includes consent granted, consent date, consent language, and source URL.
- [ ] vCard export works.

## 14. Analytics

- [ ] Page view event records.
- [ ] Contact shared event records.
- [ ] QR/token profile opens record expected event.
- [ ] vCard download event records.
- [ ] Button click events record expected action type.
- [ ] Analytics dashboard loads.
- [ ] Analytics dashboard respects entitlement.
- [ ] Business analytics view does not leak other organizations.
- [ ] Analytics event normalization supports expected aliases.

## 15. Gamification Personal Dashboard

- [ ] Dashboard Performance section loads.
- [ ] Contacts Captured This Month matches contact data.
- [ ] All-time contacts count is reasonable.
- [ ] Monthly TapTagg score is reasonable.
- [ ] All-time TapTagg score is reasonable.
- [ ] Streak display does not error with no activity.
- [ ] Profile activity counts are reasonable.
- [ ] Recently earned badges display.
- [ ] Locked badge progress displays.
- [ ] Empty state is acceptable for a brand-new user.
- [ ] Opportunistic badge awarding works on dashboard/API reads.
- [ ] Badge awarding is idempotent after refresh.

## 16. Business Gamification

Leaderboard:

- [ ] Business leaderboard loads.
- [ ] Current month ranking is ordered by TapTagg score.
- [ ] Contacts captured are visually easy to identify.
- [ ] Leaderboard does not show another organization's data.
- [ ] Team members without auth users do not break leaderboard rendering.

Challenges:

- [ ] Business admin can create challenge.
- [ ] Business admin can edit challenge.
- [ ] Business admin can delete challenge.
- [ ] Delete challenge requires confirmation.
- [ ] Non-admin cannot create/edit/delete challenge.
- [ ] Challenge progress uses analytics/contact/attribution data, not manual progress entry.
- [ ] Challenge progress bar is reasonable.
- [ ] Expired challenge closes correctly after cron.

Competitions:

- [ ] Business admin can create competition.
- [ ] Business admin can edit active competition.
- [ ] Business admin can delete active competition.
- [ ] Delete competition requires confirmation.
- [ ] Non-admin cannot create/edit/delete competition.
- [ ] Expired competition results are calculated by cron.
- [ ] Finalized competition results are immutable through normal edit/delete.
- [ ] Explicit recalculation action requires admin confirmation.
- [ ] Explicit recalculation is admin-only.

Revenue attribution:

- [ ] Personal user can log own attribution event.
- [ ] Business user can log allowed organization attribution event.
- [ ] User cannot log attribution into an unrelated organization.
- [ ] Business admin can see organization attribution totals.
- [ ] Revenue-assisted totals display only when data exists or empty state is acceptable.

## 17. Business Admin Console

Platform admin account:

- [ ] `/dashboard/business` shows all business accounts.
- [ ] Can click into an existing business.
- [ ] Can onboard a new business.
- [ ] Normal users cannot access business onboarding.
- [ ] Business quote/self-setup page is not exposed as a self-serve public setup path.

Business account:

- [ ] Business admin login URL works: `/business-slug/login`.
- [ ] Invite email arrives.
- [ ] Invite link lets admin set password.
- [ ] Admin lands in business console.
- [ ] Business admin does not automatically receive a normal personal TapTagg profile.
- [ ] Business admin can manage employees for their organization only.

## 18. Business Onboarding

Test business:

- [ ] Create organization.
- [ ] Slug is generated.
- [ ] First user is created as business admin.
- [ ] Admin invite email sends.
- [ ] Managed service flag can be set.
- [ ] Organization appears in all-business list.
- [ ] Admin console link works.
- [ ] Business branding section loads.
- [ ] Business contact/links section loads.

## 19. Business Branding

- [ ] Save brand theme.
- [ ] Save primary color.
- [ ] Save secondary color.
- [ ] Save accent color.
- [ ] Save logo URL.
- [ ] Save business link 1.
- [ ] Save business link 2.
- [ ] Save business link 3.
- [ ] Save business link 4.
- [ ] Refresh page and confirm saved values persist.
- [ ] Public `/p/[token]` uses brand colors.
- [ ] Public `/p/[token]` shows logo when set.
- [ ] Empty business links do not show.
- [ ] Filled business links show.
- [ ] Business links replace the email/profile URL strip.

## 20. Employees And Tokens

- [ ] Create employee.
- [ ] Employee appears in employee table.
- [ ] Send login email works.
- [ ] Employee can set password.
- [ ] Employee login URL works.
- [ ] Employee can access only allowed business/member data.
- [ ] Create or assign permanent token.
- [ ] Token URL is `/p/[token]`.
- [ ] QR code points to `/p/[token]`.
- [ ] Active assigned token displays employee profile.
- [ ] Unassigned token shows safe inactive page.
- [ ] Inactive token shows safe inactive page.
- [ ] Deactivated employee no longer displays through token.
- [ ] Reassign token from Employee A to Employee B.
- [ ] URL stays the same.
- [ ] Public page now shows Employee B.
- [ ] No Employee A data leaks after reassignment.

## 21. Business Public Profile Navigation

- [ ] Business public profile menu does not show login/signup.
- [ ] Home button routes to the business main profile/page, not TapTagg generic homepage.
- [ ] Main business profile/admin profile behavior is correct.
- [ ] Add to Contacts vCard works on business profiles.
- [ ] Share My Contact works on business profiles.

## 22. Admin Tools

- [ ] Admin user table loads.
- [ ] Admin can search users.
- [ ] Admin can view user account detail.
- [ ] Admin can set account access safely.
- [ ] Admin can make account Founder/Creator when needed.
- [ ] Admin can see billing status.
- [ ] Admin can see businesses.
- [ ] Admin can manage business accounts.
- [ ] Admin can view contacts where appropriate.
- [ ] Admin actions do not expose controls to non-admin users.

## 23. Privacy, Legal, And Support

- [ ] Privacy Policy page exists.
- [ ] Terms page exists.
- [ ] Contact/support email exists.
- [ ] Refund/cancellation policy exists or is clearly stated.
- [ ] Data deletion request path exists.
- [ ] Public inactive pages do not leak private employee data.
- [ ] Contact submissions are not publicly readable.
- [ ] Business contacts are visible only to allowed users.
- [ ] Sales attribution data is not publicly readable.
- [ ] Gamification data does not reveal another organization.

## 24. Mobile QA

Test on real phone if possible.

- [ ] Personal public profile on iPhone Safari.
- [ ] Personal public profile on Android Chrome.
- [ ] Business `/p/[token]` profile on iPhone Safari.
- [ ] Business `/p/[token]` profile on Android Chrome.
- [ ] Dashboard mobile layout.
- [ ] Business console mobile layout.
- [ ] Gamification dashboard mobile layout.
- [ ] Challenge/competition management mobile layout.
- [ ] Contact Sharing modal scrolls correctly.
- [ ] Password reset page works on mobile.
- [ ] Stripe Checkout works on mobile.
- [ ] QR code is scannable from another device.

## 25. Main URL Cutover

- [ ] DNS records are ready.
- [ ] Vercel domain is verified.
- [ ] Supabase Auth URLs are updated before cutover.
- [ ] Stripe webhook endpoint uses the final production URL.
- [ ] Email templates use the final production URL.
- [ ] QR/test links use the final production URL.
- [ ] Sitemap uses the final production URL.
- [ ] Robots file is acceptable.
- [ ] Old preview links are not used in customer-facing communications.
- [ ] Smoke test immediately after DNS propagation.

## 26. Final Go/No-Go

Do not launch broadly until these are all true.

- [ ] Production signup works.
- [ ] Production login works.
- [ ] Production password reset works.
- [ ] Production email sending works.
- [ ] Stripe checkout works end to end.
- [ ] Stripe webhook updates activation.
- [ ] Contact Sharing works.
- [ ] Analytics records events.
- [ ] Gamification dashboard loads.
- [ ] Gamification cron route is protected.
- [ ] Gamification cron reconciliation succeeds.
- [ ] Business onboarding works.
- [ ] Business token reassignment works.
- [ ] Public inactive token page is safe.
- [ ] Admin can recover or repair accounts.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Real domain DNS is live.
- [ ] Stripe live keys and live webhook endpoint are ready.
- [ ] Rollback plan is ready.

## Notes

Use this section for issues found during testing.

-
-
-
