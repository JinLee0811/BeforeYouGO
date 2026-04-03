-- Distinguish Pro (/api/analyze) vs basic summary rows for cache and my-page.
alter table public.summaries
  add column if not exists is_pro_analysis boolean not null default false;

comment on column public.summaries.is_pro_analysis is 'true = Pro /api/analyze row; false = basic summary row';
