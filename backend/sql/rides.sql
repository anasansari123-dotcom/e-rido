create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references auth.users (id) on delete cascade,
  passenger_name text not null,
  passenger_phone text not null default '',
  driver_id uuid references auth.users (id),
  pickup text not null,
  pickup_area text not null default '',
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff text not null,
  drop_area text not null default '',
  drop_lat double precision not null,
  drop_lng double precision not null,
  fare integer not null,
  distance_km numeric not null,
  minutes integer not null,
  status text not null default 'requested',
  otp text not null,
  created_at timestamptz not null default now()
);

alter table public.rides
  add column if not exists driver_name text,
  add column if not exists driver_phone text,
  add column if not exists vehicle_number text,
  add column if not exists vehicle_model text,
  add column if not exists accepted_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists rides_status_created_at_idx
  on public.rides (status, created_at);

create index if not exists rides_passenger_id_created_at_idx
  on public.rides (passenger_id, created_at desc);

create index if not exists rides_driver_id_created_at_idx
  on public.rides (driver_id, created_at desc);

alter table public.rides enable row level security;

drop policy if exists "rides read own or open" on public.rides;
create policy "rides read own or open"
  on public.rides
  for select
  to authenticated
  using (
    passenger_id = auth.uid()
    or driver_id = auth.uid()
    or status = 'requested'
  );

drop policy if exists "rides insert own" on public.rides;
create policy "rides insert own"
  on public.rides
  for insert
  to authenticated
  with check (passenger_id = auth.uid());

drop policy if exists "rides passenger updates own" on public.rides;
create policy "rides passenger updates own"
  on public.rides
  for update
  to authenticated
  using (passenger_id = auth.uid())
  with check (passenger_id = auth.uid());

drop policy if exists "rides driver accepts open" on public.rides;
create policy "rides driver accepts open"
  on public.rides
  for update
  to authenticated
  using (status = 'requested' and driver_id is null)
  with check (driver_id = auth.uid());

drop policy if exists "rides driver updates own" on public.rides;
create policy "rides driver updates own"
  on public.rides
  for update
  to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.rides;
exception
  when duplicate_object then null;
end $$;
