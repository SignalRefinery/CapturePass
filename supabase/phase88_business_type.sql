-- Business type foundation for TapTagg business organizations.
--
-- Adds a single business_type field for future vertical-specific work while
-- keeping all existing businesses on the general business path.

alter table public.organizations
  add column if not exists business_type text;

update public.organizations
set business_type = coalesce(business_type, 'general_business');

alter table public.organizations
  alter column business_type set default 'general_business',
  alter column business_type set not null;

alter table public.organizations
  drop constraint if exists organizations_business_type_check;

alter table public.organizations
  add constraint organizations_business_type_check
  check (
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

comment on column public.organizations.business_type
is 'High-level business vertical used for future TapTagg business-specific features.';
