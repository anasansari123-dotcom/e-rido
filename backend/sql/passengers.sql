create table if not exists public.passengers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.passengers enable row level security;

drop policy if exists "passengers read own" on public.passengers;
create policy "passengers read own"
  on public.passengers
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "passengers insert own" on public.passengers;
create policy "passengers insert own"
  on public.passengers
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "passengers update own" on public.passengers;
create policy "passengers update own"
  on public.passengers
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
