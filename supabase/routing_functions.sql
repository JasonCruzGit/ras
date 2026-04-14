-- Stored procedures for routing workflow (atomic updates)

begin;

-- Who may forward / approve / reject:
-- - current user holder, or
-- - member of current holder department (forward-to-dept leaves user id null), or
-- - recipient on the current route (covers sync / edge cases).
-- row_security off: reading documents inside SECURITY DEFINER must not hit RLS recursion or hidden rows.
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

-- Forward document to next user/department
create or replace function public.forward_document(
  p_document_id uuid,
  p_to_user_id uuid default null,
  p_to_department_id uuid default null,
  p_instruction text default null,
  p_remarks text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_route_id uuid;
  v_new_route_id uuid;
  v_actor_dept uuid;
begin
  perform public.assert_can_act_on_document(p_document_id);

  if p_to_user_id is null and p_to_department_id is null then
    raise exception 'Must forward to a user or a department';
  end if;

  select department_id into v_actor_dept
  from public.profiles
  where user_id = auth.uid();

  select r.id into v_route_id
  from public.document_routes r
  where r.document_id = p_document_id and r.is_current = true
  order by r.assigned_at desc
  limit 1;

  if v_route_id is not null then
    update public.document_routes
      set is_current = false,
          completed_at = now()
    where id = v_route_id;
  end if;

  insert into public.document_actions(document_id, route_id, actor_user_id, actor_department_id, action, remarks)
  values (p_document_id, v_route_id, auth.uid(), v_actor_dept, 'forwarded', p_remarks);

  insert into public.document_routes(
    document_id,
    from_user_id,
    from_department_id,
    to_user_id,
    to_department_id,
    is_current,
    initial_instruction
  )
  values (
    p_document_id,
    auth.uid(),
    v_actor_dept,
    p_to_user_id,
    p_to_department_id,
    true,
    p_instruction
  )
  returning id into v_new_route_id;

  update public.documents
    set status = 'in_progress',
        current_holder_user_id = p_to_user_id,
        current_holder_department_id = p_to_department_id
  where id = p_document_id;

  if p_to_user_id is not null then
    insert into public.notifications(user_id, document_id, type, title, body)
    values (
      p_to_user_id,
      p_document_id,
      'assigned',
      'New document assigned',
      coalesce(p_instruction, 'You have been assigned a routing slip.')
    );
  end if;

  return v_new_route_id;
end;
$$;

-- Approve current document
create or replace function public.approve_document(
  p_document_id uuid,
  p_remarks text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_route_id uuid;
  v_actor_dept uuid;
begin
  perform public.assert_can_act_on_document(p_document_id);

  select department_id into v_actor_dept
  from public.profiles
  where user_id = auth.uid();

  select r.id into v_route_id
  from public.document_routes r
  where r.document_id = p_document_id and r.is_current = true
  order by r.assigned_at desc
  limit 1;

  if v_route_id is not null then
    update public.document_routes
      set is_current = false,
          completed_at = now()
    where id = v_route_id;
  end if;

  insert into public.document_actions(document_id, route_id, actor_user_id, actor_department_id, action, remarks)
  values (p_document_id, v_route_id, auth.uid(), v_actor_dept, 'approved', p_remarks);

  update public.documents
    set status = 'approved',
        current_holder_user_id = null,
        current_holder_department_id = null
  where id = p_document_id;
end;
$$;

-- Reject current document
create or replace function public.reject_document(
  p_document_id uuid,
  p_remarks text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_route_id uuid;
  v_actor_dept uuid;
begin
  perform public.assert_can_act_on_document(p_document_id);

  select department_id into v_actor_dept
  from public.profiles
  where user_id = auth.uid();

  select r.id into v_route_id
  from public.document_routes r
  where r.document_id = p_document_id and r.is_current = true
  order by r.assigned_at desc
  limit 1;

  if v_route_id is not null then
    update public.document_routes
      set is_current = false,
          completed_at = now()
    where id = v_route_id;
  end if;

  insert into public.document_actions(document_id, route_id, actor_user_id, actor_department_id, action, remarks)
  values (p_document_id, v_route_id, auth.uid(), v_actor_dept, 'rejected', p_remarks);

  update public.documents
    set status = 'rejected',
        current_holder_user_id = null,
        current_holder_department_id = null
  where id = p_document_id;
end;
$$;

commit;

