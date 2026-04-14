-- Fix: new users could not upsert their own profile row during sign-up (RLS blocked INSERT).
-- 1. Add an INSERT policy so a user can create their own profile row.
-- 2. Add a SECURITY DEFINER function used by the frontend sign-up so it works even if the
--    profile trigger already created a stub row (upsert via definer bypasses RLS cleanly).

begin;

-- Allow any authenticated user to insert exactly their own profile row.
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (user_id = auth.uid());

-- SECURITY DEFINER upsert so sign-up always succeeds regardless of trigger timing.
create or replace function public.upsert_own_profile(
  p_display_name text,
  p_email        text,
  p_department_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security to off
as $$
begin
  insert into public.profiles (user_id, display_name, email, role, department_id)
  values (auth.uid(), p_display_name, p_email, 'staff', p_department_id)
  on conflict (user_id) do update
    set display_name  = excluded.display_name,
        email         = excluded.email,
        department_id = coalesce(excluded.department_id, profiles.department_id);
end;
$$;

grant execute on function public.upsert_own_profile(text, text, uuid) to authenticated;

commit;
