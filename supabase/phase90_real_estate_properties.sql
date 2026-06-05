-- Real estate property support.
--
-- Adds a profile-level business_type mirror so real estate brokerage profiles
-- can unlock property-style multi-view behavior without new tables.

alter table public.profiles
  add column if not exists business_type text not null default 'general_business';

update public.profiles p
set business_type = coalesce(
  (
    select o.business_type
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = p.user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
    order by m.created_at asc
    limit 1
  ),
  p.business_type,
  'general_business'
)
where p.business_type is null
   or p.business_type = 'general_business';

alter table public.profiles
  drop constraint if exists profiles_business_type_check;

alter table public.profiles
  add constraint profiles_business_type_check check (
    business_type in (
      'automotive_dealership',
      'real_estate_brokerage',
      'insurance_agency',
      'mortgage_lender',
      'staffing_recruiting',
      'financial_advisor',
      'general_business'
    )
  );

comment on column public.profiles.business_type is 'Business vertical mirrored from the user''s organization for profile-level behavior.';
