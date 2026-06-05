-- =============================================================
-- Ticket attachments (screenshots etc.)
-- Adds an attachment_urls text[] column on tickets and creates
-- a public Storage bucket clients can upload to.
-- Run this in Supabase Dashboard -> SQL Editor.
-- =============================================================

alter table tickets
  add column if not exists attachment_urls text[] not null default '{}';

-- Public bucket so the URLs we store can render directly in <img>.
-- File names contain a uuid so they're unguessable.
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', true)
on conflict (id) do nothing;

-- Authenticated users can upload (insert) into the bucket.
drop policy if exists ticket_attachments_insert on storage.objects;
create policy ticket_attachments_insert on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ticket-attachments');

-- Anyone (incl. unauthenticated) can read - bucket is public.
drop policy if exists ticket_attachments_select on storage.objects;
create policy ticket_attachments_select on storage.objects for select
  using (bucket_id = 'ticket-attachments');

-- Admins can delete attachments (for client deletion cascade etc.).
drop policy if exists ticket_attachments_admin_delete on storage.objects;
create policy ticket_attachments_admin_delete on storage.objects for delete
  using (bucket_id = 'ticket-attachments' and is_admin());
