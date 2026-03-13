-- ============================================================
-- CFG Outdoor Events — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Racer',
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read all profiles (for display names in race detail)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============================================================
-- 2. SCRAPER SOURCES (must exist before races for FK)
-- ============================================================
create table if not exists public.scraper_sources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  url             text not null,
  race_type       text,
  render_method   text check (render_method in ('static', 'playwright')),
  field_map       jsonb,
  geo_filter      boolean not null default true,
  active          boolean not null default true,
  last_run_at     timestamptz,
  last_error      text,
  created_at      timestamptz not null default now()
);

alter table public.scraper_sources enable row level security;

-- Only admins can manage sources (handled via service role key in API routes)
create policy "Admins can manage scraper sources"
  on public.scraper_sources for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 3. RACES
-- ============================================================
create table if not exists public.races (
  id                              uuid primary key default gen_random_uuid(),
  name                            text not null,
  race_type                       text check (race_type in ('trail','ultra','ocr','adventure','orienteering','mtb','gravel','other')),
  date                            date not null,
  end_date                        date,
  location_name                   text,
  location_city                   text,
  location_state                  text,
  lat                             numeric(9,6),
  lng                             numeric(9,6),
  distance_miles_from_woodstock   numeric(7,2),
  description                     text,
  registration_url                text,
  race_url                        text,
  cost_min                        numeric(8,2),
  cost_max                        numeric(8,2),
  is_active                       boolean not null default true,
  source_id                       uuid references public.scraper_sources(id) on delete set null,
  manually_added                  boolean not null default false,
  added_by                        uuid references auth.users(id) on delete set null,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

alter table public.races enable row level security;

-- Everyone can read active races
create policy "Active races are publicly viewable"
  on public.races for select
  using (is_active = true);

-- Admins can read all races
create policy "Admins can view all races"
  on public.races for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can insert/update/delete (via service role in API routes)
create policy "Admins can manage races"
  on public.races for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 4. REGISTRATIONS
-- ============================================================
create table if not exists public.registrations (
  id          uuid primary key default gen_random_uuid(),
  race_id     uuid not null references public.races(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (race_id, user_id)
);

alter table public.registrations enable row level security;

-- Authenticated users can read all registrations (for counts)
create policy "Registrations viewable by authenticated users"
  on public.registrations for select
  to authenticated
  using (true);

-- Users can insert their own registrations
create policy "Users can register for races"
  on public.registrations for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own registrations
create policy "Users can unregister from races"
  on public.registrations for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 5. GROUPME POSTS
-- ============================================================
create table if not exists public.groupme_posts (
  id            uuid primary key default gen_random_uuid(),
  race_id       uuid references public.races(id) on delete set null,
  trigger_type  text not null check (trigger_type in ('new_race','registration','4_month','2_month','1_month')),
  message       text not null,
  sent_at       timestamptz not null default now()
);

alter table public.groupme_posts enable row level security;

-- Only admins can read groupme posts
create policy "Admins can view groupme posts"
  on public.groupme_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 6. TRIGGER: auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Racer'
  );

  insert into public.profiles (id, display_name, role)
  values (new.id, display_name, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 7. TRIGGER: updated_at for races
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_races_updated_at on public.races;
create trigger set_races_updated_at
  before update on public.races
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 8. SEED: scraper sources
-- ============================================================
insert into public.scraper_sources (name, url, race_type, render_method, geo_filter, active)
values
  (
    'UltraSignup Southeast',
    'https://ultrasignup.com/results_region.aspx?did=91',
    'ultra',
    'static',
    true,
    true
  ),
  (
    'Ultrasignup Trail Races',
    'https://ultrasignup.com/register.aspx',
    'trail',
    'static',
    true,
    true
  ),
  (
    'RunSignup Southeast',
    'https://runsignup.com/Races?state=GA&type=trail',
    'trail',
    'static',
    true,
    true
  ),
  (
    'USOA OCR Events',
    'https://www.usoa.co/events',
    'ocr',
    'playwright',
    true,
    true
  ),
  (
    'Adventure Race Southeast',
    'https://www.adventureracesouth.com/races',
    'adventure',
    'static',
    true,
    true
  ),
  (
    'MTB Georgia Events',
    'https://www.mtbgeorgia.com/races',
    'mtb',
    'static',
    true,
    true
  )
on conflict do nothing;
