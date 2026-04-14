-- Run after route_text_fields.sql (columns from_text, to_text, action_requested exist).
-- Recreates the view so PostgREST returns those columns for timeline / print preview.

begin;

-- Drop first — replacing a view whose old columns differ (e.g. former r.*) causes ERROR 42P16.
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
  tp.display_name as to_display_name,
  fd.name as from_department_name,
  td.name as to_department_name
from public.document_routes r
left join public.profiles fp on fp.user_id = r.from_user_id
left join public.profiles tp on tp.user_id = r.to_user_id
left join public.departments fd on fd.id = r.from_department_id
left join public.departments td on td.id = r.to_department_id;

commit;
