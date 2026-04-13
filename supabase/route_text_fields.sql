-- Add free-text routing fields for printing and initial routing row

begin;

alter table public.document_routes
  add column if not exists from_text text,
  add column if not exists to_text text,
  add column if not exists action_requested text;

commit;

