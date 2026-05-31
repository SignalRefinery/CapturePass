-- Contact Sharing.
--
-- Visitors can privately share contact details with an individual profile owner
-- or a business/team profile. Inserts are handled by the server route.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  organization_id uuid,
  profile_view_id uuid,
  submitted_to_user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  title text,
  note text,
  source text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contact_submissions_profile_id_idx
on public.contact_submissions (profile_id, created_at desc);

create index if not exists contact_submissions_organization_id_idx
on public.contact_submissions (organization_id, created_at desc);

create index if not exists contact_submissions_submitted_to_user_id_idx
on public.contact_submissions (submitted_to_user_id, created_at desc);

alter table public.contact_submissions enable row level security;

drop policy if exists "Profile owners can read profile contacts" on public.contact_submissions;
create policy "Profile owners can read profile contacts"
on public.contact_submissions for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = contact_submissions.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Organization admins can read organization contacts" on public.contact_submissions;
create policy "Organization admins can read organization contacts"
on public.contact_submissions for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = contact_submissions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Team members can read own contacts" on public.contact_submissions;
create policy "Team members can read own contacts"
on public.contact_submissions for select
using (
  submitted_to_user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members m
    where m.id = contact_submissions.profile_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

comment on table public.contact_submissions
is 'Private contact details shared by visitors from public TapTagg profile pages.';
