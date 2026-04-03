-- Places the user opened (search card click or restaurant page). click_count increments on each visit.
create table if not exists public.user_place_clicks (
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id text not null,
  restaurant_name text not null default 'Restaurant',
  restaurant_address text,
  image_url text,
  click_count int not null default 1,
  first_clicked_at timestamptz not null default now(),
  last_clicked_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index if not exists user_place_clicks_user_last_idx
  on public.user_place_clicks (user_id, last_clicked_at desc);

alter table public.user_place_clicks enable row level security;

grant select on public.user_place_clicks to authenticated;

drop policy if exists "user_place_clicks_select_own" on public.user_place_clicks;

create policy "user_place_clicks_select_own"
  on public.user_place_clicks for select to authenticated
  using (auth.uid() = user_id);

comment on table public.user_place_clicks is 'Per-user restaurant open history (search/detail); incremented via record_place_click';

create or replace function public.record_place_click(
  p_place_id text,
  p_name text default null,
  p_address text default null,
  p_image_url text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_name text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_place_id is null or length(trim(p_place_id)) = 0 then
    raise exception 'place_id required';
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), 'Restaurant');

  insert into public.user_place_clicks (
    user_id, place_id, restaurant_name, restaurant_address, image_url,
    click_count, first_clicked_at, last_clicked_at
  )
  values (
    uid, trim(p_place_id), v_name, nullif(trim(p_address), ''), nullif(trim(p_image_url), ''),
    1, now(), now()
  )
  on conflict (user_id, place_id) do update set
    click_count = public.user_place_clicks.click_count + 1,
    last_clicked_at = now(),
    restaurant_name = case
      when excluded.restaurant_name is not null and excluded.restaurant_name <> 'Restaurant'
      then excluded.restaurant_name
      else public.user_place_clicks.restaurant_name
    end,
    restaurant_address = coalesce(excluded.restaurant_address, public.user_place_clicks.restaurant_address),
    image_url = coalesce(excluded.image_url, public.user_place_clicks.image_url);
end;
$$;

revoke all on function public.record_place_click(text, text, text, text) from public;
grant execute on function public.record_place_click(text, text, text, text) to authenticated;
