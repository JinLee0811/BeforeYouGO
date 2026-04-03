-- Analysis quota bypass per user (set via SQL Editor / service role; not self-service from the app).
alter table public.profiles
  add column if not exists is_analysis_admin boolean not null default false;

comment on column public.profiles.is_analysis_admin is 'When true, server skips user_api_usage quota for this user.';

-- Block clients (JWT role authenticated) from toggling the flag; allow service_role API and SQL Editor (no JWT).
create or replace function public.profiles_lock_is_analysis_admin_for_clients()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims_text text;
  jwt_role text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if new.is_analysis_admin is not distinct from old.is_analysis_admin then
    return new;
  end if;
  claims_text := nullif(trim(current_setting('request.jwt.claims', true)), '');
  if claims_text is null then
    return new;
  end if;
  jwt_role := claims_text::json->>'role';
  if jwt_role is not null and jwt_role <> 'service_role' then
    new.is_analysis_admin := old.is_analysis_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_is_analysis_admin on public.profiles;
create trigger profiles_lock_is_analysis_admin
  before update on public.profiles
  for each row
  execute function public.profiles_lock_is_analysis_admin_for_clients();
