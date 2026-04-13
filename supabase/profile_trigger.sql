-- Optional: auto-create a profile when a user signs up

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles(user_id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null), 'staff')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

commit;

