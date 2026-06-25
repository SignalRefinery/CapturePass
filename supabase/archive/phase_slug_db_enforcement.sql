-- Database-level profile/slug enforcement.
--
-- App code performs slug moderation before saving, but normal authenticated
-- clients still reach Supabase directly. This trigger is the backstop that
-- prevents owner updates from publishing restricted slugs or changing
-- server/admin/billing fields outside trusted server-side routes.

do $$
begin
  alter table public.profiles
    add constraint profiles_slug_status_check
    check (slug_status is null or slug_status in ('approved', 'pending_review', 'rejected'));
exception when duplicate_object then
  null;
end $$;

create unique index if not exists profiles_slug_idx
on public.profiles (slug);

create unique index if not exists profiles_slug_requested_unique_idx
on public.profiles (slug_requested)
where slug_requested is not null;

create index if not exists profiles_slug_status_idx
on public.profiles (slug_status);

create or replace function public.jsonb_value_changed(before_row jsonb, after_row jsonb, field_name text)
returns boolean
language sql
stable
as $$
  select coalesce(before_row -> field_name, 'null'::jsonb) is distinct from coalesce(after_row -> field_name, 'null'::jsonb);
$$;

create or replace function public.jsonb_has_non_default_value(row_data jsonb, field_name text)
returns boolean
language sql
stable
as $$
  select
    row_data ? field_name
    and coalesce(row_data -> field_name, 'null'::jsonb) not in ('null'::jsonb, 'false'::jsonb, '""'::jsonb);
$$;

create or replace function public.enforce_profile_slug_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  normal_owner_write boolean := jwt_role = 'authenticated' and auth.uid() = new.user_id;
  before_row jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  after_row jsonb := to_jsonb(new);
  protected_fields text[] := array[
    'is_admin',
    'is_active',
    'billing_exempt',
    'lifetime_free',
    'stripe_customer_id',
    'stripe_subscription_id',
    'stripe_plan_key',
    'subscription_status',
    'subscription_current_period_end',
    'current_period_end',
    'promo_code_used',
    'referral_code',
    'referred_by',
    'is_affiliate',
    'affiliate_tier',
    'referral_reconciled',
    'referral_reconciled_at',
    'referral_reconciled_by',
    'card_notification_sent_at'
  ];
  field_name text;
  normalized_live_slug text := public.normalize_slug_candidate(new.slug);
  normalized_requested_slug text := public.normalize_slug_candidate(new.slug_requested);
begin
  if not normal_owner_write then
    return new;
  end if;

  if tg_op = 'INSERT' then
    foreach field_name in array protected_fields loop
      if public.jsonb_has_non_default_value(after_row, field_name) then
        raise exception 'Authenticated users cannot set protected profile field: %', field_name;
      end if;
    end loop;
  else
    foreach field_name in array protected_fields loop
      if public.jsonb_value_changed(before_row, after_row, field_name) then
        raise exception 'Authenticated users cannot update protected profile field: %', field_name;
      end if;
    end loop;
  end if;

  if normalized_live_slug is null or normalized_live_slug = '' then
    raise exception 'Profile slug is required.';
  end if;

  if public.slug_is_blocked_db(normalized_live_slug) then
    raise exception 'That slug is blocked.';
  end if;

  new.slug := normalized_live_slug;

  if new.slug_status is not null and new.slug_status not in ('approved', 'pending_review', 'rejected') then
    raise exception 'Invalid slug status.';
  end if;

  if normalized_requested_slug is not null and normalized_requested_slug <> '' then
    if public.slug_is_blocked_db(normalized_requested_slug) then
      raise exception 'That requested slug is blocked.';
    end if;

    new.slug_requested := normalized_requested_slug;

    if public.slug_requires_review_db(normalized_requested_slug) and new.slug_status is distinct from 'pending_review' then
      raise exception 'Review-required slug requests must remain pending_review.';
    end if;
  else
    new.slug_requested := null;
  end if;

  if public.slug_requires_review_db(new.slug) then
    if tg_op = 'INSERT' then
      raise exception 'Review-required slugs cannot be published directly.';
    end if;

    if new.slug is distinct from old.slug then
      raise exception 'Review-required slugs must be approved by an admin before publication.';
    end if;

    if old.slug_status is distinct from 'approved' or new.slug_status is distinct from 'approved' then
      raise exception 'Review-required live slugs must keep approved status.';
    end if;
  end if;

  if new.slug_requested is not null and new.slug_requested = new.slug and new.slug_status is distinct from 'approved' then
    raise exception 'Pending requested slug cannot also be the live slug.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_slug_security_trigger on public.profiles;

create trigger enforce_profile_slug_security_trigger
before insert or update on public.profiles
for each row
execute function public.enforce_profile_slug_security();

drop policy if exists "Profiles are publicly readable by slug" on public.profiles;
create policy "Profiles are publicly readable by slug"
on public.profiles for select
using (
  is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved'
  and not public.slug_is_blocked_db(slug)
);

drop policy if exists "Public can view published profile views" on public.profile_views;
create policy "Public can view published profile views"
on public.profile_views for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.is_active = true
      and p.consent_public_visibility = true
      and p.slug_status = 'approved'
      and not public.slug_is_blocked_db(p.slug)
  )
);

comment on function public.enforce_profile_slug_security()
is 'Backstops app-layer slug moderation and blocks normal authenticated users from mutating protected profile billing/admin fields directly.';
