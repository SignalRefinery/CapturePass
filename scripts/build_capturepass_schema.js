const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'supabase', 'capturepass_schema.sql');

const sources = [
  'supabase/bootstrap.sql',
  'supabase/phase73_contact_sharing.sql',
  'supabase/phase76_contact_submission_consent.sql',
  'supabase/phase74_analytics_events.sql',
  'supabase/phase75_gamification.sql',
  'supabase/phase80_business_asset_uploads.sql',
  'supabase/phase81_business_webhooks.sql',
  'supabase/phase87_multilocation_business.sql',
  'supabase/phase95_profile_secondary_button.sql',
];

const footer = `
-- ============================================================
-- Fresh-project overrides
-- ============================================================

alter table public.profiles
  alter column consent_public_visibility set default false;

alter table public.profile_views
  alter column show_text set default false,
  alter column show_text set not null;

comment on column public.profiles.consent_public_visibility
is 'When true, the approved profile slug can resolve publicly. When false, the personalized slug is hidden for privacy.';

comment on column public.profile_views.show_text
is 'Secondary hero action mode: true=text, false=email, null=none.';
`;

function readSection(relPath) {
  const abs = path.join(root, relPath);
  const content = fs.readFileSync(abs, 'utf8').trimEnd();
  return `-- ============================================================\n-- Source: ${relPath}\n-- ============================================================\n\n${content}\n`;
}

const compiled = [
  '-- CapturePass consolidated Supabase schema for a fresh project.',
  '-- Generated from the current bootstrap plus later feature phases.',
  '',
  ...sources.map(readSection),
  footer.trimEnd(),
  '',
].join('\n');

fs.writeFileSync(outFile, compiled);
console.log(`Wrote ${path.relative(root, outFile)}`);
