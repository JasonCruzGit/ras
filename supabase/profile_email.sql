-- Add email to profiles and keep it in sync with auth.users.email
-- Run once after schema.sql if you already deployed.

begin;

alter table public.profiles
  add column if not exists email text;

create index if not exists profiles_email_idx on public.profiles(email);

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
    set email = new.email
  where user_id = new.id;
  return new;
end;
$$;

-- Backfill existing
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.user_id
  and (p.email is null or p.email <> u.email);

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.sync_profile_email();

commit;

