alter table public.profiles
  add column if not exists private_token text unique;

create or replace function public.generate_private_token_db(token_length integer default 7)
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
begin
  while i < token_length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    i := i + 1;
  end loop;

  return result;
end;
$$;

create or replace function public.ensure_profile_private_token()
returns trigger
language plpgsql
as $$
begin
  if new.private_token is null or trim(new.private_token) = '' then
    loop
      new.private_token := public.generate_private_token_db(7);
      exit when not exists (
        select 1 from public.profiles where private_token = new.private_token
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_profile_private_token_trigger on public.profiles;

create trigger ensure_profile_private_token_trigger
before insert or update on public.profiles
for each row
execute function public.ensure_profile_private_token();

update public.profiles
set private_token = public.generate_private_token_db(7)
where private_token is null or trim(private_token) = '';
