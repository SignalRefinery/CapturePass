-- Bootstrap admin rebrand migration.
--
-- Updates the legacy platform admin seed to john@handshakeiq.org and ensures
-- the matching profile and organization member rows are promoted if the user
-- already exists in Supabase Auth.

update public.profiles
set
  is_admin = true,
  is_active = true,
  slug_status = 'approved',
  consent_public_visibility = false,
  updated_at = timezone('utc', now())
where lower(trim(email)) = lower(trim('john@handshakeiq.org'));

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
join auth.users u
  on lower(trim(u.email)) = lower(trim('john@handshakeiq.org'))
where not exists (
  select 1
  from public.organization_members m
  where m.organization_id = o.id
    and lower(coalesce(m.email, '')) = lower(trim('john@handshakeiq.org'))
);
