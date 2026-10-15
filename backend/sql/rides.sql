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
