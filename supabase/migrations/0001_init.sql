-- =============================================================
-- NoBound Portal — initial schema, indexes, RLS, triggers.
-- Run this in Supabase Dashboard → SQL Editor as one statement.
-- =============================================================

-- ---- TABLES ---------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  name text not null,
  email text not null unique,
  business_name text,
  website_url text,
  has_hosting boolean not null default false,
  has_seo boolean not null default false,
  hosting_price_pence integer default 1500,
  build_cost_pence integer,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  notes text,
  started_at date,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text check (subscription_status in (
    'none', 'incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'canceled'
  )) default 'none',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_stripe_customer_id_idx on clients (stripe_customer_id);
create index if not exists clients_stripe_subscription_id_idx on clients (stripe_subscription_id);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  stripe_invoice_id text not null unique,
  amount_pence integer not null,
  status text not null,
  invoice_pdf_url text,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invoices_client_id_created_idx on invoices (client_id, created_at desc);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null default 'modification' check (type in ('modification', 'emergency')),
  status text not null default 'new' check (status in (
    'new', 'priced', 'awaiting_payment', 'paid', 'in_progress', 'complete', 'declined', 'cancelled'
  )),
  price_pence integer,
  admin_notes text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  priced_at timestamptz,
  payment_sent_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tickets_client_id_created_idx on tickets (client_id, created_at desc);
create index if not exists tickets_status_idx on tickets (status, created_at desc);

-- ---- AUTO-UPDATE updated_at ----------------------------------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();

drop trigger if exists tickets_set_updated_at on tickets;
create trigger tickets_set_updated_at before update on tickets
  for each row execute function set_updated_at();

-- ---- HELPERS --------------------------------------------------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_client_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from clients where profile_id = auth.uid() limit 1;
$$;

-- ---- ROW LEVEL SECURITY --------------------------------------

alter table profiles enable row level security;
alter table clients  enable row level security;
alter table invoices enable row level security;
alter table tickets  enable row level security;

drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or is_admin());

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

drop policy if exists clients_self_read on clients;
create policy clients_self_read on clients for select
  using (profile_id = auth.uid() or is_admin());

drop policy if exists clients_admin_write on clients;
create policy clients_admin_write on clients for all
  using (is_admin()) with check (is_admin());

drop policy if exists invoices_self_read on invoices;
create policy invoices_self_read on invoices for select
  using (client_id = my_client_id() or is_admin());

drop policy if exists invoices_admin_write on invoices;
create policy invoices_admin_write on invoices for all
  using (is_admin()) with check (is_admin());

drop policy if exists tickets_self_read on tickets;
create policy tickets_self_read on tickets for select
  using (client_id = my_client_id() or is_admin());

drop policy if exists tickets_self_insert on tickets;
create policy tickets_self_insert on tickets for insert
  with check (client_id = my_client_id() or is_admin());

drop policy if exists tickets_admin_update on tickets;
create policy tickets_admin_update on tickets for update
  using (is_admin()) with check (is_admin());

drop policy if exists tickets_admin_delete on tickets;
create policy tickets_admin_delete on tickets for delete
  using (is_admin());

-- ---- AUTO-CREATE profile when an auth user is created --------

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role)
  values (new.id, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---- AFTER YOU'VE SIGNED IN ONCE -----------------------------
-- Run this single line, replacing the email, to make yourself admin:
--   update profiles set role = 'admin' where id = (select id from auth.users where email = 'araltd@hotmail.com');
