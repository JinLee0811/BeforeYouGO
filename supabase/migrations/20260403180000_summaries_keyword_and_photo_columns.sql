-- Pro/basic summaries: keyword arrays + photos (PostgREST / summary-basic / analyze)
alter table public.summaries
  add column if not exists positive_keywords text[] not null default '{}'::text[];

alter table public.summaries
  add column if not exists negative_keywords text[] not null default '{}'::text[];

alter table public.summaries
  add column if not exists mentioned_menu_items text[] not null default '{}'::text[];

alter table public.summaries
  add column if not exists recommended_dishes text[] not null default '{}'::text[];

alter table public.summaries
  add column if not exists photo_urls text[] not null default '{}'::text[];

comment on column public.summaries.positive_keywords is 'Pro LLM output; basic tier uses empty array';
comment on column public.summaries.photo_urls is 'Place photo URLs from Google Places (Pro path)';
