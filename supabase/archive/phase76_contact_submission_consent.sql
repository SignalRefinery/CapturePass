-- Contact Sharing consent audit fields.
--
-- Visitors must explicitly consent to being contacted about their inquiry.
-- This is not a marketing opt-in.

alter table public.contact_submissions
add column if not exists consent_to_contact boolean not null default false,
add column if not exists consent_text text,
add column if not exists consent_given_at timestamptz,
add column if not exists source_profile_slug text,
add column if not exists source_url text,
add column if not exists ip_address text;

create index if not exists contact_submissions_consent_given_at_idx
on public.contact_submissions (consent_given_at desc);

comment on column public.contact_submissions.consent_to_contact
is 'True when the submitter explicitly agreed to be contacted about this inquiry.';

comment on column public.contact_submissions.consent_text
is 'Exact consent language shown to the submitter at the time of submission.';

comment on column public.contact_submissions.consent_given_at
is 'Timestamp when inquiry-response contact consent was granted.';

comment on column public.contact_submissions.source_url
is 'Public page URL or referrer where the consented contact submission originated.';

comment on column public.contact_submissions.ip_address
is 'Request IP available from platform headers at time of submission, used for consent audit context.';
