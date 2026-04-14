-- ERROR: 42P17 infinite recursion detected in policy for relation "document_routes"
-- Cause: INSERT ... WITH CHECK queried public.documents, which re-evaluated document_routes RLS.
-- Fix: SECURITY DEFINER helpers that SET row_security OFF when reading documents.

begin;

create or replace function public.user_is_creator_or_holder_of_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security to off
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        d.created_by = auth.uid()
        or d.current_holder_user_id = auth.uid()
      )
  );
$$;

grant execute on function public.user_is_creator_or_holder_of_document(uuid) to authenticated;

create or replace function public.user_is_document_creator(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security to off
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and d.created_by = auth.uid()
  );
$$;

grant execute on function public.user_is_document_creator(uuid) to authenticated;

drop policy if exists routes_insert_creator_or_admin on public.document_routes;
create policy routes_insert_creator_or_admin on public.document_routes
for insert to authenticated
with check (
  public.is_admin()
  or public.user_is_document_creator(document_routes.document_id)
);

commit;
