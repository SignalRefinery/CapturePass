-- Default new profiles to using their approved public slug.
--
-- Users can still opt out from the dashboard for added privacy; when they do,
-- the personalized slug is not publicly resolvable and sharing should use the
-- issued QR/private link path.

alter table public.profiles
  alter column consent_public_visibility set default true;

comment on column public.profiles.consent_public_visibility
is 'When true, the approved profile slug can resolve publicly. When false, the personalized slug is hidden for privacy.';
