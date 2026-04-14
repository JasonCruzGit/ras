-- Run this in Supabase SQL Editor if the app already had rls.sql applied
-- and print preview / timeline show no routing rows for document creators.

begin;

create or replace function public.user_is_creator_or_holder_of_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

drop policy if exists routes_read_via_document on public.document_routes;
create policy routes_read_via_document on public.document_routes
for select to authenticated
using (
  public.is_admin()
  or public.user_is_creator_or_holder_of_document(document_routes.document_id)
  or document_routes.to_user_id = auth.uid()
  or document_routes.from_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles me
    where me.user_id = auth.uid()
      and (
        (document_routes.to_department_id is not null and document_routes.to_department_id = me.department_id)
        or (document_routes.from_department_id is not null and document_routes.from_department_id = me.department_id)
      )
  )
);

commit;
