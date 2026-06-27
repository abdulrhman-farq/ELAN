-- 0017 Per-pack perk descriptions (shown on the membership cards).
alter table public.credit_packs add column if not exists description_ar text;
alter table public.credit_packs add column if not exists description_en text;
