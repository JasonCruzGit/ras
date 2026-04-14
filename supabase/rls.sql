-- Row Level Security (RLS) policies for RAS

begin;

-- Helper: determine if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Read documents.created_by / current_holder without joining document_routes (avoids RLS recursion).
-- Lets creators and holders see the full routing history for print/timeline even after forwards.
-- SECURITY DEFINER alone still applies RLS to documents for the invoker — must disable row_security
-- inside the function or inserts/selects recurse: documents policy → document_routes → this → documents…
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

-- Used only by routes INSERT policy — same row_security off so WITH CHECK does not recurse via documents RLS.
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

-- Enable RLS
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_attachments enable row level security;
alter table public.document_routes enable row level security;
alter table public.document_actions enable row level security;
alter table public.notifications enable row level security;

-- Departments: read for authenticated; write for admin
drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments
for select to authenticated
using (true);

drop policy if exists departments_write_admin on public.departments;
create policy departments_write_admin on public.departments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Profiles: readable for authenticated (user directory), writable by self; admin can update any
drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
for select to authenticated
using (true);

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
for update to authenticated
using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

-- Documents: creator can CRUD; recipients can read
drop policy if exists documents_read_creator_recipient_or_admin on public.documents;
create policy documents_read_creator_recipient_or_admin on public.documents
for select to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or current_holder_user_id = auth.uid()
  or exists (
    select 1
    from public.document_routes r
    join public.profiles me on me.user_id = auth.uid()
    where r.document_id = documents.id
      and (
        r.to_user_id = auth.uid()
        or (r.to_department_id is not null and r.to_department_id = me.department_id)
      )
  )
);

drop policy if exists documents_insert_creator on public.documents;
create policy documents_insert_creator on public.documents
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists documents_update_creator_or_admin on public.documents;
create policy documents_update_creator_or_admin on public.documents
for update to authenticated
using (public.is_admin() or created_by = auth.uid())
with check (public.is_admin() or created_by = auth.uid());

drop policy if exists documents_delete_creator_or_admin on public.documents;
create policy documents_delete_creator_or_admin on public.documents
for delete to authenticated
using (public.is_admin() or created_by = auth.uid());

-- Attachments: readable by anyone who can read the parent document; insert by document creator/holder/admin
drop policy if exists attachments_read_via_document on public.document_attachments;
create policy attachments_read_via_document on public.document_attachments
for select to authenticated
using (
  exists (
    select 1
    from public.documents d
    join public.profiles me on me.user_id = auth.uid()
    where d.id = document_attachments.document_id
      and (
        public.is_admin()
        or d.created_by = auth.uid()
        or d.current_holder_user_id = auth.uid()
        or exists (
          select 1
          from public.document_routes r
          where r.document_id = d.id
            and (
              r.to_user_id = auth.uid()
              or (r.to_department_id is not null and r.to_department_id = me.department_id)
            )
        )
      )
  )
);

drop policy if exists attachments_insert_by_doc_access on public.document_attachments;
create policy attachments_insert_by_doc_access on public.document_attachments
for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.documents d
    where d.id = document_attachments.document_id
      and (
        public.is_admin()
        or d.created_by = auth.uid()
        or d.current_holder_user_id = auth.uid()
      )
  )
);

-- Routes: document creator and participants can read; creator/admin can create routes
drop policy if exists routes_read_via_document on public.document_routes;
create policy routes_read_via_document on public.document_routes
for select to authenticated
using (
  -- IMPORTANT: do not reference `documents` directly here (recursion with documents policy).
  -- Use security definer helper above for creator/holder visibility.
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

drop policy if exists routes_insert_creator_or_admin on public.document_routes;
create policy routes_insert_creator_or_admin on public.document_routes
for insert to authenticated
with check (
  public.is_admin()
  or public.user_is_document_creator(document_routes.document_id)
);

-- Actions: participants can insert their own actions; participants/creator/admin can read
drop policy if exists actions_read_via_document on public.document_actions;
create policy actions_read_via_document on public.document_actions
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.documents d
    join public.profiles me on me.user_id = auth.uid()
    where d.id = document_actions.document_id
      and (
        d.created_by = auth.uid()
        or d.current_holder_user_id = auth.uid()
        or exists (
          select 1
          from public.document_routes r
          where r.document_id = d.id
            and (
              r.to_user_id = auth.uid()
              or r.from_user_id = auth.uid()
              or (r.to_department_id is not null and r.to_department_id = me.department_id)
              or (r.from_department_id is not null and r.from_department_id = me.department_id)
            )
        )
      )
  )
);

drop policy if exists actions_insert_self on public.document_actions;
create policy actions_insert_self on public.document_actions
for insert to authenticated
with check (actor_user_id = auth.uid());

-- Notifications: user reads own
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

commit;

