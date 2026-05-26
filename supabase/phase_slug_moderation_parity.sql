-- =========================================
-- Slug normalization (anti-leetspeak)
-- =========================================

create or replace function public.slug_abuse_normalized_db(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(lower(coalesce(input, '')), '0', 'o'),
                    '1', 'i'),
                  '3', 'e'),
                '4', 'a'),
              '5', 's'),
            '7', 't'),
          '@', 'a'),
        '$', 's'),
      '!', 'i'),
    '+', 't'),
    '[^a-z0-9]',
    '',
    'g'
  );
$$;


-- =========================================
-- Slug blocking (system + abuse)
-- =========================================

create or replace function public.slug_is_blocked_db(input text)
returns boolean
language plpgsql
as $$
declare
  slug text := public.normalize_slug_candidate(input);
  normalized text := public.slug_abuse_normalized_db(input);
begin
  if slug is null or slug = '' then return true; end if;
  if length(slug) < 3 or length(slug) > 40 then return true; end if;

  -- System / reserved slugs
  if slug in (
    'about','abuse','account','accounts','admin','admin-support','affiliate','affiliates',
    'api','billing','careers','cdn','cms','contact','dashboard','demo','email','example',
    'favicon','founder','founders','ftp','help','home','hostmaster','how-it-works','imap',
    'index','info','js','legal','live-demo','livedemo','localhost','login','mail','media',
    'netlify','noreply','null','official','owner','partner','partners','payments','policy',
    'pop','postmaster','press','preview','pricing','privacy','private','public','resend',
    'robots','root','sales','security','signup','sitemap','smtp','staff','stripe',
    'support','supabase','system','taptagg','team','terms','undefined','verify',
    'verification','webmail','www'
  ) then return true; end if;

  if slug like 'admin%' or slug like 'api%' or slug like 'billing%' or slug like 'official%'
     or slug like 'security%' or slug like 'staff%' or slug like 'support%'
     or slug like 'taptagg%' then
    return true;
  end if;

  -- Strong abuse (contains match)
  if exists (
    select 1
    from unnest(array[
      'asshole','bastard','bitch','bollocks','bullshit','cocksucker','douchebag',
      'fucker','fucking','motherfucker','pervert','retard','beaner','wetback',
      'chink','gook','nigga','nigger','kike','neonazi','hitler','swastika',
      'raghead','towelhead','redskin','whitepower','whitesupremacy'
    ]) as term
    where normalized = term or normalized like '%' || term || '%'
  ) then
    return true;
  end if;

  -- Short words (exact only to avoid false positives)
  if normalized in (
    'cock','coon','cunt','damn','dick','dyke','fag','fuck','jap','kkk','klan',
    'nazi','penis','perv','piss','prick','pussy','shit','slut','spic','twat','whore'
  ) then return true; end if;

  -- Violent / extremist phrases
  if normalized like '%heilhitler%'
     or normalized like '%killjews%'
     or normalized like '%killblack%'
     or normalized like '%killmuslims%'
     or normalized like '%killgays%' then
    return true;
  end if;

  return false;
end;
$$;


-- =========================================
-- Slug review (impersonation / public office)
-- =========================================

create or replace function public.slug_requires_review_db(input text)
returns boolean
language plpgsql
as $$
declare
  normalized text := public.slug_abuse_normalized_db(input);
begin
  if normalized = '' then return false; end if;

  -- Prefix-based titles (high risk impersonation)
  if exists (
    select 1
    from unnest(array[
      'alderman','alderwoman','assemblyman','assemblymember','assemblyperson','assemblywoman',
      'boardmember','chair','chairman','chairperson','chairwoman','commissioner','congress',
      'congressman','congressmember','congressperson','congresswoman','council','councilman',
      'councilmember','councilperson','councilwoman','delegate','governor','judge','justice',
      'lieutenantgovernor','ltgovernor','mayor','mp','parliament','president','primeminister',
      'rep','representative','senator','speaker','spokesperson','supervisor','trustee',
      'vicepresident','administrator','agency','assessor','attorneygeneral','auditor','cabinet',
      'chief','citymanager','clerk','comptroller','controller','countyexecutive','deputy',
      'director','executive','inspector','inspectorgeneral','manager','ombudsman','registrar',
      'secretary','treasurer','attorney','court','da','districtattorney','hearingofficer',
      'magistrate','prosecutor','publicdefender','statesattorney','tribunal','captain',
      'chiefdeputy','constable','coroner','detective','ems','fire','firechief','firedepartment',
      'firefighter','firstresponder','lawenforcement','marshal','officer','police','policechief',
      'policedepartment','ranger','sheriff','trooper','undersheriff','warden','boardofeducation',
      'chancellor','principal','schoolboard','schooldistrict','superintendent','bureau','city',
      'cityhall','cityof','county','countyof','civic','department','dept','federal','gov',
      'government','municipal','municipality','officeof','officialaccount','officialpage',
      'publicauthority','publicoffice','state','stateof','town','township','village','ballot',
      'campaign','campaignteam','campaignoffice','candidate','committee','election','elect',
      'reelect','reelection','vote','actual','authentic','certified','confirmed','legit','real',
      'theofficial','true','verified'
    ]) as term
    where normalized = term or normalized like term || '%'
  ) then
    return true;
  end if;

  -- Contains patterns (campaign / impersonation phrasing)
  if exists (
    select 1
    from unnest(array[
      'foralderman','foralderwoman','forassembly','forcommissioner','forcongress',
      'forcongressperson','forcouncil','fordelegate','forgovernor','forjudge','formayor',
      'foroffice','forpresident','forrep','forrepresentative','forsenate','forsenator',
      'forsheriff','fortreasurer','official','officialaccount','officialsite','verified',
      'verifiedaccount','realaccount','office','team','thisis','iam','theofficial','vote',
      'elect','reelect','cityof','countyof','stateof','police','sheriff','governor',
      'senator','mayor','president','gov','government'
    ]) as term
    where normalized like '%' || term || '%'
  ) then
    return true;
  end if;

  return false;
end;
$$;
