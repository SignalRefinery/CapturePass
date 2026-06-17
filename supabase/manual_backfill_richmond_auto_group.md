# Richmond Auto Group Stripe Backfill Note

Use this note when a Stripe payment succeeds but the TapTagg profile does not
flip active automatically. This is documentation only. Do not run any SQL from
here unless you have confirmed the target record first.

## Safety checks

1. Confirm the email is the exact expected profile email: `sales@richmondautogroup.com`.
2. Confirm there is exactly one matching row in `public.profiles`.
3. Check whether `stripe_customer_id` or `stripe_subscription_id` already exist on another profile before updating anything.
4. Confirm the Stripe subscription belongs to the TapTagg Business Individual plan.
5. If the profile is already active and linked correctly, stop. Do not overwrite working data.

## Important limitation

Pure SQL cannot fetch live data from Stripe in this TapTagg setup. Use Stripe
to retrieve the customer and subscription details first, then use SQL only to
write the confirmed values into `public.profiles`.

If you want the refresh workflow to be repeatable, use either:

- the Stripe Dashboard for the customer `cus_UiS2agVgJauvb9`
- the Stripe CLI or API to inspect the customer, list subscriptions, and confirm the paid plan

## Find the profile

Use a case-insensitive email lookup:

```sql
select
  id,
  user_id,
  full_name,
  email,
  slug,
  is_active,
  stripe_plan_key,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status
from public.profiles
where lower(trim(email)) = lower(trim('sales@richmondautogroup.com'));
```

If this returns more than one row, stop and resolve the duplicate profile issue
before touching Stripe fields.

## Check for existing Stripe linkage

Before attaching anything, make sure the Stripe IDs are not already assigned to
another profile:

```sql
select
  id,
  user_id,
  full_name,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_plan_key,
  subscription_status
from public.profiles
where stripe_customer_id = '<stripe_customer_id>'
   or stripe_subscription_id = '<stripe_subscription_id>';
```

If either ID is already linked to a different profile, do not update the
Richmond Auto Group row until the ownership of those Stripe records is clear.

## Attach Stripe IDs if missing

Once you have confirmed the correct profile and the correct Stripe customer and
subscription, attach the missing IDs:

```sql
update public.profiles
set
  stripe_customer_id = coalesce(stripe_customer_id, '<stripe_customer_id>'),
  stripe_subscription_id = coalesce(stripe_subscription_id, '<stripe_subscription_id>'),
  updated_at = now()
where lower(trim(email)) = lower(trim('sales@richmondautogroup.com'));
```

If either ID already exists on the correct row, `coalesce` preserves the
existing value.

## Re-fetch Stripe details first

Before writing the row, pull these values from Stripe and confirm them manually:

- Customer email
- Customer ID
- Subscription ID
- Subscription status
- Subscription price or plan

Then use the verified values in the update SQL below.

## Mark the Business Individual subscription active

For a successful paid Business Individual subscription, set the profile state
to active and keep the TapTagg plan key aligned with the paid product:

```sql
update public.profiles
set
  is_active = true,
  stripe_plan_key = 'business_individual',
  subscription_status = 'active',
  updated_at = now()
where lower(trim(email)) = lower(trim('sales@richmondautogroup.com'));
```

Only use this when the Stripe subscription is the Business Individual plan.
If the account should remain inactive for any reason, stop and investigate
instead of forcing activation.

## Post-update verification

Run the profile lookup again and confirm these values:

- `is_active = true`
- `stripe_plan_key = 'business_individual'`
- `subscription_status = 'active'`
- `stripe_customer_id` is populated
- `stripe_subscription_id` is populated

After that, verify the public profile and dashboard load as expected.
