-- Receivers could not forward: assert_can_act_on_document only checked current_holder_user_id.
-- Forwarding to a department sets current_holder_user_id NULL and current_holder_department_id.
-- Also enable reliable reads from documents inside SECURITY DEFINER (SET row_security OFF).

begin;

create or replace function public.assert_can_act_on_document(p_document_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
set row_security to off
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.is_admin() then
    return;
  end if;

  if exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and d.current_holder_user_id = v_uid
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.documents d
    join public.profiles p on p.user_id = v_uid
    where d.id = p_document_id
      and d.current_holder_department_id is not null
      and p.department_id is not null
      and d.current_holder_department_id = p.department_id
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.document_routes r
    join public.profiles p on p.user_id = v_uid
    where r.document_id = p_document_id
      and r.is_current = true
      and (
        r.to_user_id = v_uid
        or (
          r.to_department_id is not null
          and p.department_id is not null
          and r.to_department_id = p.department_id
        )
      )
  ) then
    return;
  end if;

  raise exception 'Not allowed to act on this document';
end;
$$;

commit;
