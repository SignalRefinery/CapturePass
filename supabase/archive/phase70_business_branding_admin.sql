-- Business branding and TapTagg central admin access.
--
-- Adds the three-color business brand palette used by /p/[token] pages and
-- ensures john@handshakeiq.org is listed as an admin member on every org.

alter table public.organizations
  add column if not exists brand_color_primary text,
  add column if not exists brand_color_secondary text,
  add column if not exists brand_color_accent text,
  add column if not exists brand_theme text not null default 'full_color';

alter table public.organizations
  drop constraint if exists organizations_brand_theme_check;

alter table public.organizations
  add constraint organizations_brand_theme_check
  check (brand_theme in ('deep_brand', 'clean_light', 'full_color', 'custom'));

insert into public.organization_members (
  organization_id,
  user_id,
  name,
  email,
  title,
  role,
  status
)
select
  o.id,
  u.id,
  'TapTagg Admin',
  'john@handshakeiq.org',
  'Platform admin',
  'admin',
  'active'
from public.organizations o
left join auth.users u
  on lower(u.email) = 'john@handshakeiq.org'
where not exists (
  select 1
  from public.organization_members m
  where m.organization_id = o.id
    and lower(coalesce(m.email, '')) = 'john@handshakeiq.org'
);
