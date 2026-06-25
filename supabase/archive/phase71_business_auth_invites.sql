-- Business-only auth invite guard.
--
-- Business admins and employees should receive Supabase auth invites for
-- /business-slug/login without automatically creating normal TapTagg profiles.

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
when (coalesce((new.raw_user_meta_data->>'business_only')::boolean, false) = false)
execute function public.handle_new_user_profile();

delete from public.profiles p
using auth.users u
where p.user_id = u.id
  and coalesce((u.raw_user_meta_data->>'business_only')::boolean, false) = true;
