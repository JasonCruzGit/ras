-- One-time: documents created before the app inserted an initial `document_routes` row
-- have no routing history in the DB, so timeline and print preview stay blank.
-- Safe to run multiple times (only inserts where no route exists).

begin;

insert into public.document_routes (
  document_id,
  from_user_id,
  to_user_id,
  is_current,
  assigned_at,
  initial_instruction
)
select
  d.id,
  d.created_by,
  coalesce(d.current_holder_user_id, d.created_by),
  true,
  coalesce(d.date_time_received, d.created_at),
  null
from public.documents d
where not exists (
  select 1 from public.document_routes r where r.document_id = d.id
);

commit;
