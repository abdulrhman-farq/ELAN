-- 0021_notification_delivery_queue.sql
-- B2: delivery bookkeeping for the notification queue worker.
-- ⚠️ PENDING STAGING VALIDATION.

alter table public.notifications add column if not exists attempts int not null default 0;
alter table public.notifications add column if not exists last_error text;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();
create index if not exists notifications_pending_idx on public.notifications (created_at) where status = 'pending';
