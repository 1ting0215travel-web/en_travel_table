-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Lodging status enum
DO $$ BEGIN
  CREATE TYPE lodging_status AS ENUM ('already_has_partner', 'needs_partner', 'no_partner_needed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- App users (only admin accounts stored here)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role user_role not null default 'admin',
  is_destroyed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- App settings (singleton row)
create table if not exists app_settings (
  id int primary key default 1,
  member_login_password_hash text not null,
  login_background text,
  site_title text,
  updated_at timestamptz not null default now()
);

-- Travel codes (destination list)
create table if not exists travel_codes (
  id uuid primary key default gen_random_uuid(),
  code_name text not null,
  is_open boolean not null default true,
  is_destroyed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Travel entries
create table if not exists travel_entries (
  id uuid primary key default gen_random_uuid(),
  travel_code_id uuid not null references travel_codes(id),
  person_name text not null,
  depart_datetime timestamptz not null,
  depart_location text not null,
  has_transfer boolean not null default false,
  arrival_datetime timestamptz not null,
  arrival_location text not null,
  hotel_name text,
  lodging_status lodging_status not null,
  return_depart_datetime timestamptz,
  return_depart_location text,
  return_has_transfer boolean not null default false,
  return_transfer_location text,
  return_arrival_datetime timestamptz,
  return_arrival_location text,
  is_destroyed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transfer stops (optional, 0..n)
create table if not exists travel_transfers (
  id uuid primary key default gen_random_uuid(),
  travel_entry_id uuid not null references travel_entries(id) on delete cascade,
  seq int not null,
  transfer_location text not null,
  transfer_datetime timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_travel_entries_code on travel_entries(travel_code_id);
create index if not exists idx_travel_entries_destroyed on travel_entries(is_destroyed);
create index if not exists idx_travel_codes_destroyed on travel_codes(is_destroyed);
create index if not exists idx_travel_transfers_entry on travel_transfers(travel_entry_id);

-- Updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DO $$ BEGIN
  CREATE TRIGGER app_users_set_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER travel_codes_set_updated_at
  BEFORE UPDATE ON travel_codes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER travel_entries_set_updated_at
  BEFORE UPDATE ON travel_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Seed a default settings row if missing
insert into app_settings (id, member_login_password_hash)
values (1, 'CHANGE_ME')
on conflict (id) do nothing;
