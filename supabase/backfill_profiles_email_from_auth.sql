-- Copy auth.users.email into public.profiles.email where missing (fixes forward dropdown labels).
-- Run in Supabase SQL Editor as a one-off.

begin;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.user_id
  and u.email is not null
  and length(trim(u.email)) > 0
  and (p.email is null or trim(p.email) = '');

commit;
