-- Allow profile views to intentionally hide the secondary hero action.
--
-- show_text is intentionally tri-state:
-- true  = show Text as the secondary action
-- false = show Email as the secondary action
-- null  = show no secondary action

alter table public.profile_views
  alter column show_text drop not null;

comment on column public.profile_views.show_text
is 'Secondary hero action mode: true=text, false=email, null=none.';
