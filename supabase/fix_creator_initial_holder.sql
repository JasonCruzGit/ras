-- One-time fix: make creators the initial holder for existing docs
-- Run this in Supabase SQL Editor if you already created documents before this fix.

update public.documents
set current_holder_user_id = created_by
where current_holder_user_id is null;

