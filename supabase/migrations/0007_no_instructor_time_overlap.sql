-- 0007_no_instructor_time_overlap.sql
-- A trainer cannot run two overlapping classes. Enforced with a GiST exclusion
-- constraint over (instructor_id, [starts_at, ends_at)). Cancelled classes and
-- unassigned (null instructor) slots are exempt.
create extension if not exists btree_gist;

alter table public.class_instances
  add constraint no_instructor_time_overlap
  exclude using gist (
    instructor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (instructor_id is not null and status <> 'cancelled');
