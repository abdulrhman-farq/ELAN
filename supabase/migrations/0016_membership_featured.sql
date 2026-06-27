-- 0016 Featured/"most popular" flag for a membership plan (drives the badge).
alter table public.membership_plans add column if not exists featured boolean not null default false;
