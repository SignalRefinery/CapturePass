-- Tighten public profile reads.
--
-- Keeps owner access intact while replacing any legacy public select policy
-- that exposed every profile row to anonymous clients.

alter table public.profiles
  add column if not exists is_active boolean not null default false,
  add column if not exists slug_status text not null default 'approved',
  add column if not exists consent_public_visibility boolean not null default true;

drop policy if exists "Profiles are publicly readable by slug" on public.profiles;

do $$
begin
  if to_regprocedure('public.slug_is_blocked_db(text)') is not null then
    execute $policy$
      create policy "Profiles are publicly readable by slug"
      on public.profiles for select
      using (
        is_active = true
        and consent_public_visibility = true
        and slug_status = 'approved'
        and not public.slug_is_blocked_db(slug)
      )
    $policy$;
  else
    execute $policy$
      create policy "Profiles are publicly readable by slug"
      on public.profiles for select
      using (
        is_active = true
        and consent_public_visibility = true
        and slug_status = 'approved'
      )
    $policy$;
  end if;

  if to_regclass('public.profile_views') is not null then
    execute 'drop policy if exists "Public can view published profile views" on public.profile_views';

    if to_regprocedure('public.slug_is_blocked_db(text)') is not null then
      execute $policy$
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
        )
      $policy$;
    else
      execute $policy$
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
          )
        )
      $policy$;
    end if;
  end if;
end $$;
