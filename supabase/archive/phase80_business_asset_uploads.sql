-- Business asset uploads.
--
-- Business logos and employee headshots are stored in Supabase Storage while
-- profile records keep only the public URL.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-assets',
  'business-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.organization_members
  add column if not exists headshot_url text;

comment on column public.organization_members.headshot_url
is 'Optional employee headshot URL stored in the business-assets storage bucket.';
