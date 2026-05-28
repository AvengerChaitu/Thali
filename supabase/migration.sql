-- Thali Database Schema — Clean install
-- WARNING: Drops all existing app tables before creating Thali tables.

-- 0. Extensions
create extension if not exists "postgis" with schema "extensions";

-- 1. Drop ALL existing app tables (cascade handles FK order)
drop table if exists public.attendance cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.meal_slots cascade;
drop table if exists public.hotels cascade;
drop table if exists public.workout_exercises cascade;
drop table if exists public.exercise_sets cascade;
drop table if exists public.exercises cascade;
drop table if exists public.meal_foods cascade;
drop table if exists public.meals cascade;
drop table if exists public.food_items cascade;
drop table if exists public.user_health_profiles cascade;
drop table if exists public.notifications cascade;
drop table if exists public.user_xp cascade;
drop table if exists public.messages cascade;
drop table if exists public.challenge_participants cascade;
drop table if exists public.challenges cascade;
drop table if exists public.friendships cascade;
drop table if exists public.progress_entries cascade;
drop table if exists public.step_counts cascade;
drop table if exists public.sleep_records cascade;
drop table if exists public.nutrition cascade;
drop table if exists public.workouts cascade;
drop table if exists public.device_tokens cascade;
drop table if exists public.profiles cascade;

-- 2. Profiles (extends auth.users)
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text not null default '',
  name            text not null default '',
  role            text not null default 'subscriber' check (role in ('subscriber', 'owner')),
  avatar_initials text not null default '',
  language        text not null default 'en' check (language in ('en', 'hi')),
  created_at      timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 3. Hotels
create table public.hotels (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  address       text not null,
  location      geography(point, 4326) not null,
  is_verified   boolean not null default false,
  qr_code       text not null default '',
  created_at    timestamptz not null default now()
);
alter table public.hotels enable row level security;

-- 4. Meal slots
create table public.meal_slots (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references public.hotels(id) on delete cascade,
  meal_type   text not null check (meal_type in ('lunch', 'dinner')),
  start_time  time not null,
  cutoff_time time not null,
  is_active   boolean not null default true
);
alter table public.meal_slots enable row level security;

-- 5. Subscriptions
create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  hotel_id    uuid not null references public.hotels(id) on delete cascade,
  meal_type   text not null check (meal_type in ('lunch', 'dinner')),
  total_meals int not null default 30,
  meals_used  int not null default 0,
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

-- 6. Attendance (core table)
create table public.attendance (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  hotel_id        uuid not null references public.hotels(id) on delete cascade,
  date            date not null,
  meal_type       text not null check (meal_type in ('lunch', 'dinner')),
  status          text not null default 'pending' check (status in ('pending', 'coming', 'absent')),
  marked_at       timestamptz,
  unique (subscription_id, date, meal_type)
);
alter table public.attendance enable row level security;

-- 7. Indexes
create index if not exists idx_attendance_hotel_date on public.attendance(hotel_id, date);
create index if not exists idx_attendance_user_date on public.attendance(user_id, date);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_hotel on public.subscriptions(hotel_id);
create index if not exists idx_hotels_owner on public.hotels(owner_id);

-- 8. RLS Policies

-- Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Hotels
create policy "hotels_select_all" on public.hotels
  for select using (true);
create policy "hotels_insert_owner" on public.hotels
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );
create policy "hotels_update_owner" on public.hotels
  for update using (auth.uid() = owner_id);
create policy "hotels_delete_owner" on public.hotels
  for delete using (auth.uid() = owner_id);

-- Meal slots
create policy "meal_slots_select" on public.meal_slots
  for select using (true);
create policy "meal_slots_insert_owner" on public.meal_slots
  for insert with check (
    exists (select 1 from public.hotels where id = hotel_id and owner_id = auth.uid())
  );
create policy "meal_slots_update_owner" on public.meal_slots
  for update using (
    exists (select 1 from public.hotels where id = hotel_id and owner_id = auth.uid())
  );
create policy "meal_slots_delete_owner" on public.meal_slots
  for delete using (
    exists (select 1 from public.hotels where id = hotel_id and owner_id = auth.uid())
  );

-- Subscriptions
create policy "subscriptions_select_own" on public.subscriptions
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.hotels where id = hotel_id and owner_id = auth.uid())
  );
create policy "subscriptions_insert" on public.subscriptions
  for insert with check (user_id = auth.uid());
create policy "subscriptions_update_own" on public.subscriptions
  for update using (user_id = auth.uid());

-- Attendance
create policy "attendance_select" on public.attendance
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.hotels where id = hotel_id and owner_id = auth.uid())
  );
create policy "attendance_insert_own" on public.attendance
  for insert with check (user_id = auth.uid());
create policy "attendance_update_own" on public.attendance
  for update using (user_id = auth.uid());

-- 9. Helper function: nearby hotels (PostGIS)
create or replace function public.nearby_hotels(
  lat float8, lng float8, radius_km float8 default 5
)
returns table (
  id uuid, name text, address text,
  distance_km float8, subscriber_count bigint, is_verified boolean
)
language sql stable
as $$
  select
    h.id, h.name, h.address,
    round((h.location::geography <-> st_makepoint(lng, lat)::geography)::numeric, 2)::float8,
    (select count(*) from public.subscriptions s where s.hotel_id = h.id and s.is_active),
    h.is_verified
  from public.hotels h
  where st_dwithin(h.location::geography, st_makepoint(lng, lat)::geography, radius_km * 1000)
  order by distance_km;
$$;

-- 10. Edge function helpers (also callable via pg_cron)

create or replace function public.create_daily_attendance()
returns void language plpgsql security definer
as $$
begin
  insert into public.attendance (subscription_id, user_id, hotel_id, date, meal_type, status)
  select s.id, s.user_id, s.hotel_id, current_date, s.meal_type, 'pending'
  from public.subscriptions s
  where s.is_active = true
    and current_date between s.start_date and s.end_date
    and not exists (
      select 1 from public.attendance a
      where a.subscription_id = s.id and a.date = current_date and a.meal_type = s.meal_type
    );
end;
$$;

create or replace function public.auto_close_pending()
returns void language plpgsql security definer
as $$
begin
  update public.attendance a
  set status = 'absent'
  from public.subscriptions s
  join public.meal_slots ms on ms.hotel_id = s.hotel_id and ms.meal_type = s.meal_type
  where a.subscription_id = s.id
    and a.date = current_date
    and a.status = 'pending'
    and current_time > ms.cutoff_time;
end;
$$;
