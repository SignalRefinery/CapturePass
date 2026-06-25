-- Generate stable business console slugs for existing organizations.
--
-- New organizations receive a slug from the app when created. This backfills
-- older rows so /business/[slug] and /[slug] business entry links can work.

update public.organizations
set slug = lower(
  regexp_replace(
    regexp_replace(coalesce(name, 'business') || '-' || left(replace(id::text, '-', ''), 6), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
)
where slug is null or trim(slug) = '';
