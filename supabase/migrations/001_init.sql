-- TradeLog schema. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  starting_balance numeric(20,2) not null default 0,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create type public.trade_dir as enum ('long','short');
create type public.trade_status as enum ('open','closed');

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  instrument text not null,
  market text not null,
  direction public.trade_dir not null,
  status public.trade_status not null default 'closed',
  entry_at timestamptz not null,
  exit_at timestamptz,
  entry_price numeric(20,8) not null,
  exit_price numeric(20,8),
  quantity numeric(20,8) not null check (quantity > 0),
  contract_size numeric(20,8) not null check (contract_size > 0),
  stop_loss numeric(20,8),
  target_price numeric(20,8),
  session text check (session in ('Sydney','Asia','London','New York')),
  reason text,
  mistake text not null default 'None',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closed_needs_exit check (status <> 'closed' or (exit_price is not null and exit_at is not null))
);
create index trades_user_exit_idx on public.trades (user_id, exit_at desc);

create table public.trade_images (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null,
  category text not null default 'Other',
  file_name text,
  created_at timestamptz not null default now()
);
create index trade_images_trade_idx on public.trade_images (trade_id);

alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.trade_images enable row level security;

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own trades" on public.trades for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own images" on public.trade_images for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and exists (select 1 from public.trades t where t.id = trade_id and t.user_id = auth.uid()));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, starting_balance)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'starting_balance','')::numeric, 0)
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- private screenshot bucket, files stored as <user_id>/<trade_id>/<file>
insert into storage.buckets (id, name, public) values ('trade-images','trade-images', false);
create policy "read own images" on storage.objects for select
  using (bucket_id = 'trade-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own images" on storage.objects for insert
  with check (bucket_id = 'trade-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own images" on storage.objects for delete
  using (bucket_id = 'trade-images' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trades_touch before update on public.trades
  for each row execute function public.touch_updated_at();
