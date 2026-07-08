-- Add per-client hosting price and optional one-off build cost.
-- Existing customers keep their current price; new customers default to £15/month.

alter table clients add column if not exists hosting_price_pence integer default 1500;
alter table clients add column if not exists build_cost_pence integer;

-- Backfill existing rows to the new £15/month default.
update clients set hosting_price_pence = 1500 where hosting_price_pence is null;

-- Keep existing shukskitchen customer on £10/month hosting.
update clients
set hosting_price_pence = 1000
where email ilike '%shukskitchen%'
   or business_name ilike '%shuks kitchen%'
   or name ilike '%shuks kitchen%';
