-- Allow any authenticated user to forward / approve / reject (assert_can_act_on_document).
-- Run in Supabase SQL Editor after prior versions of this function.

begin;

create or replace function public.assert_can_act_on_document(p_document_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
set row_security to off
as $$
begin
  if auth.uid() is null then
    raise exception 'Not allowed to act on this document';
  end if;

  if not exists (select 1 from public.documents d where d.id = p_document_id) then
    raise exception 'Not allowed to act on this document';
  end if;

  return;
end;
$$;

commit;
