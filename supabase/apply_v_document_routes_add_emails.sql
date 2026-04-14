-- Adds from_email / to_email to v_document_routes (profiles often have email but no display_name).
-- Run in Supabase SQL Editor; safe to run after apply_v_document_routes_refresh.sql.

begin;

drop view if exists public.v_document_routes cascade;

create view public.v_document_routes as
select
  r.id,
  r.document_id,
  r.from_user_id,
  r.from_department_id,
  r.to_user_id,
  r.to_department_id,
  r.assigned_at,
  r.completed_at,
  r.is_current,
  r.initial_instruction,
  r.from_text,
  r.to_text,
  r.action_requested,
  fp.display_name as from_display_name,
  fp.email as from_email,
  tp.display_name as to_display_name,
  tp.email as to_email,
  fd.name as from_department_name,
  td.name as to_department_name
from public.document_routes r
left join public.profiles fp on fp.user_id = r.from_user_id
left join public.profiles tp on tp.user_id = r.to_user_id
left join public.departments fd on fd.id = r.from_department_id
left join public.departments td on td.id = r.to_department_id;

commit;
