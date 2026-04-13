-- Routing Action Slip System (RAS) schema
-- Designed to mirror the provided Excel template fields:
-- Originating Office, Reference Number, Subject, Date of Document, Date & Time Received

begin;

-- Extensions
-- Supabase projects typically keep extensions in the `extensions` schema
create extension if not exists pgcrypto with schema extensions;

-- Enums
do $$ begin
  create type public.document_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_status as enum ('pending', 'in_progress', 'approved', 'rejected', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.route_action as enum ('viewed', 'remarked', 'approved', 'rejected', 'forwarded');
exception when duplicate_object then null; end $$;

-- Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Profiles (one row per auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  department_id uuid references public.departments(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_department_id_idx on public.profiles(department_id);

-- Documents / Routing Slips
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  originating_office text not null,
  reference_number text,
  date_of_document date,
  date_time_received timestamptz,
  priority public.document_priority not null default 'medium',
  status public.document_status not null default 'pending',

  created_by uuid not null references auth.users(id),
  current_holder_user_id uuid references auth.users(id),
  current_holder_department_id uuid references public.departments(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_current_holder_user_idx on public.documents(current_holder_user_id);
create index if not exists documents_current_holder_department_idx on public.documents(current_holder_department_id);

-- Attachments (files stored in Supabase Storage; this table stores metadata)
create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  file_name text not null,
  mime_type text,
  storage_bucket text not null default 'document-attachments',
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists document_attachments_document_id_idx on public.document_attachments(document_id);

-- Routing: one row per recipient "step"
create table if not exists public.document_routes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  from_user_id uuid references auth.users(id),
  from_department_id uuid references public.departments(id),

  to_user_id uuid references auth.users(id),
  to_department_id uuid references public.departments(id),

  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  is_current boolean not null default true,

  -- For quick reads; full narrative goes into actions. Mirrors the "REMARKS/INSTRUCTION..." column.
  initial_instruction text
);

create index if not exists document_routes_document_id_idx on public.document_routes(document_id);
create index if not exists document_routes_to_user_id_idx on public.document_routes(to_user_id);
create index if not exists document_routes_to_department_id_idx on public.document_routes(to_department_id);
create index if not exists document_routes_is_current_idx on public.document_routes(is_current);

-- Actions taken by recipients (timeline/audit)
create table if not exists public.document_actions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  route_id uuid references public.document_routes(id) on delete set null,
  actor_user_id uuid not null references auth.users(id),
  actor_department_id uuid references public.departments(id),
  action public.route_action not null,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists document_actions_document_id_idx on public.document_actions(document_id);
create index if not exists document_actions_route_id_idx on public.document_actions(route_id);
create index if not exists document_actions_actor_user_id_idx on public.document_actions(actor_user_id);

-- In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_at_idx on public.notifications(read_at);

-- Updated-at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();

commit;

