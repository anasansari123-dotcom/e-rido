create table if not exists public.providers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null,
  vehicle_number text not null,
  vehicle_model text not null default 'E-Rickshaw',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers enable row level security;

drop policy if exists "providers read own" on public.providers;
create policy "providers read own"
  on public.providers
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "providers insert own" on public.providers;
create policy "providers insert own"
  on public.providers
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "providers update own" on public.providers;
create policy "providers update own"
  on public.providers
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
