-- Hardcopy proof upload via QR (cross-device)
-- Creates an upload session (token) and allows anon users to upload a photo tied to that token.

begin;

-- Add a kind column for attachments (non-breaking)
alter table public.document_attachments
  add column if not exists kind text not null default 'attachment';

-- Upload sessions
create table if not exists public.hardcopy_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  uploaded_at timestamptz,
  attachment_id uuid references public.document_attachments(id) on delete set null
);

create index if not exists hardcopy_upload_sessions_document_id_idx on public.hardcopy_upload_sessions(document_id);
create index if not exists hardcopy_upload_sessions_token_idx on public.hardcopy_upload_sessions(token);

alter table public.hardcopy_upload_sessions enable row level security;

-- Authenticated users can read sessions for documents they can read
drop policy if exists hardcopy_sessions_read_auth on public.hardcopy_upload_sessions;
create policy hardcopy_sessions_read_auth on public.hardcopy_upload_sessions
for select to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.documents d
    where d.id = hardcopy_upload_sessions.document_id
      and (
        d.created_by = auth.uid()
        or d.current_holder_user_id = auth.uid()
      )
  )
);

-- IMPORTANT:
-- Do NOT allow anon SELECT on the sessions table directly (would expose all tokens).
-- Anon access is provided via security definer RPCs below.

-- RPC: create a session (authenticated)
create or replace function public.create_hardcopy_upload_session(p_document_id uuid)
returns table (upload_token uuid, url text)
language plpgsql
security definer
as $$
declare
  v_token uuid;
  v_origin text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.hardcopy_upload_sessions(document_id, created_by)
  values (p_document_id, auth.uid())
  returning hardcopy_upload_sessions.token into v_token;

  -- caller provides origin in the app; here we just return token
  v_origin := '';
  return query
  select v_token as upload_token, v_origin as url;
end;
$$;

-- RPC: fetch session by token (anon-safe)
create or replace function public.get_hardcopy_upload_session(p_token uuid)
returns table (token uuid, document_id uuid, expires_at timestamptz, uploaded_at timestamptz)
language plpgsql
security definer
as $$
begin
  return query
  select s.token, s.document_id, s.expires_at, s.uploaded_at
  from public.hardcopy_upload_sessions s
  where s.token = p_token and now() < s.expires_at;
end;
$$;

-- RPC: finalize upload (creates attachment + marks uploaded)
create or replace function public.finalize_hardcopy_upload(
  p_token uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_doc_id uuid;
  v_attachment_id uuid;
begin
  select s.document_id into v_doc_id
  from public.hardcopy_upload_sessions s
  where s.token = p_token
    and s.uploaded_at is null
    and now() < s.expires_at
  limit 1;

  if v_doc_id is null then
    raise exception 'Invalid or expired token';
  end if;

  insert into public.document_attachments(
    document_id, file_name, mime_type, storage_bucket, storage_path, uploaded_by, kind
  )
  values (
    v_doc_id,
    p_file_name,
    p_mime_type,
    'document-attachments',
    p_storage_path,
    coalesce(auth.uid(), (select created_by from public.hardcopy_upload_sessions where token = p_token)),
    'hardcopy_proof'
  )
  returning id into v_attachment_id;

  update public.hardcopy_upload_sessions
    set uploaded_at = now(),
        attachment_id = v_attachment_id
  where token = p_token;

  return v_attachment_id;
end;
$$;

-- Storage policies: bucket must exist (recommended private)
-- Allow anon to upload into document-attachments bucket under hardcopy/<token>/
-- NOTE: Storage RLS is on storage.objects
-- `storage.objects` is managed by Supabase; RLS is already enabled there.
-- Do not run ALTER TABLE here (often fails with "must be owner of table objects").

drop policy if exists hardcopy_upload_insert_anon on storage.objects;
create policy hardcopy_upload_insert_anon on storage.objects
for insert to anon
with check (
  bucket_id = 'document-attachments'
  and (name like 'hardcopy/%')
  and exists (
    select 1
    from public.hardcopy_upload_sessions s
    where s.token = (split_part(name, '/', 2))::uuid
      and s.uploaded_at is null
      and now() < s.expires_at
  )
);

drop policy if exists hardcopy_upload_read_auth on storage.objects;
create policy hardcopy_upload_read_auth on storage.objects
for select to authenticated
using (bucket_id = 'document-attachments');

commit;

