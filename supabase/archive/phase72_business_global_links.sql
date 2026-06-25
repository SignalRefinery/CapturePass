-- Business-wide profile links.
--
-- These optional links appear on every business /p/[token] profile and replace
-- the default email/profile URL strip for business passes.

alter table public.organizations
  add column if not exists business_link_1_title text,
  add column if not exists business_link_1_url text,
  add column if not exists business_link_2_title text,
  add column if not exists business_link_2_url text,
  add column if not exists business_link_3_title text,
  add column if not exists business_link_3_url text,
  add column if not exists business_link_4_title text,
  add column if not exists business_link_4_url text;
