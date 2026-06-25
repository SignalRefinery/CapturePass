-- Repair and standardize FOUNDERS promo access.
--
-- Run once after phase67. Future FOUNDERS profiles should be active,
-- billing-exempt, lifetime-free, and mapped to the Creator package.

update public.profiles
set
  is_active = true,
  billing_exempt = true,
  lifetime_free = true,
  promo_code_used = 'FOUNDERS',
  stripe_plan_key = 'creator',
  updated_at = timezone('utc', now())
where upper(coalesce(promo_code_used, '')) = 'FOUNDERS'
   or stripe_plan_key = 'founder'
   or (
    billing_exempt = true
    and lifetime_free = true
    and stripe_plan_key = 'professional'
  );
