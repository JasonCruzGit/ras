-- Convenience views for UI (timeline / action slip)

begin;

create or replace view public.v_document_actions as
select
  a.id,
  a.document_id,
  a.route_id,
  a.actor_user_id,
  p.display_name as actor_display_name,
  p.role as actor_role,
  d.name as actor_department_name,
  a.action,
  a.remarks,
  a.created_at
from public.document_actions a
left join public.profiles p on p.user_id = a.actor_user_id
left join public.departments d on d.id = a.actor_department_id;

create or replace view public.v_document_routes as
select
  r.*,
  fp.display_name as from_display_name,
  tp.display_name as to_display_name,
  fd.name as from_department_name,
  td.name as to_department_name
from public.document_routes r
left join public.profiles fp on fp.user_id = r.from_user_id
left join public.profiles tp on tp.user_id = r.to_user_id
left join public.departments fd on fd.id = r.from_department_id
left join public.departments td on td.id = r.to_department_id;

commit;

