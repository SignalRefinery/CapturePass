# Bootstrap Admin Setup Note

Use this note when you need to create or recover the CapturePass bootstrap admin
account for `john@handshakeiq.org`.

This is documentation only. Do not run any SQL until you have confirmed the
target record first.

## Safety checks

1. Confirm the admin email is exactly `john@handshakeiq.org`.
2. Confirm there is exactly one matching row in `auth.users`.
3. Confirm there is exactly one matching row in `public.profiles`.
4. Confirm the account should be promoted to admin before changing any flags.
5. If the user already has the correct profile state, stop and do not overwrite it.

## What Supabase handles

Supabase Auth is responsible for:

- creating or inviting the user
- sending the password setup / reset email
- verifying the password update link

The app already routes password setup through `/update-password`.

## Verify the auth user

Use the Supabase SQL editor to confirm the auth account exists:

```sql
select
  id,
  email,
  confirmed_at,
  last_sign_in_at,
  created_at
from auth.users
where lower(trim(email)) = lower(trim('john@handshakeiq.org'));
```

If there is no row yet, create or invite the user from the Supabase Auth
dashboard first.

## Verify the profile row

After the auth user exists, confirm the profile row:

```sql
select
  id,
  user_id,
  full_name,
  email,
  slug,
  is_active,
  is_admin,
  slug_status,
  consent_public_visibility
from public.profiles
where lower(trim(email)) = lower(trim('john@handshakeiq.org'));
```

If the auth trigger has already run, this row should exist automatically.

## Promote the profile if needed

If the profile exists but is not yet marked as the platform admin, update the
profile state directly:

```sql
update public.profiles
set
  is_admin = true,
  is_active = true,
  slug_status = 'approved',
  consent_public_visibility = false,
  updated_at = now()
where lower(trim(email)) = lower(trim('john@handshakeiq.org'));
```

Only use this if the row is the correct admin account.

## Send the password setup email

Use the Supabase Auth dashboard to send a password reset / setup email to
`john@handshakeiq.org` with the redirect URL set to:

```text
https://capturepass.com/update-password
```

For local testing, use the local app URL instead of production.

## Final verification

After the password email is sent, confirm:

- the user can sign in with `john@handshakeiq.org`
- the password setup link lands on `/update-password`
- the profile row remains `is_admin = true`
- the admin dashboard opens after sign-in
