-- Public profile lookup indexes.
--
-- The public profile RPCs use a case-insensitive slug lookup and token-issued
-- profile lookup with active/approved filters. These indexes keep mobile
-- profile loads fast without changing public visibility behavior.

create index if not exists profiles_public_lower_slug_lookup_idx
on public.profiles (lower(slug))
where is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved';

create index if not exists profiles_public_private_token_lookup_idx
on public.profiles (private_token)
where private_token is not null
  and is_active = true
  and slug_status = 'approved';

create index if not exists profiles_active_approved_public_idx
on public.profiles (id)
where is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved';
