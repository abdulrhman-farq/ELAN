-- 0015 Business rule: single-class (pay-as-you-go) price must never be below 250 SAR.
alter table public.membership_plans drop constraint if exists payg_min_price_250;
alter table public.membership_plans
  add constraint payg_min_price_250 check (is_payg = false or price_sar >= 250);
