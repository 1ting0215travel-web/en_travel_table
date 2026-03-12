alter table travel_entries
  add column if not exists return_depart_datetime timestamptz,
  add column if not exists return_depart_location text,
  add column if not exists return_has_transfer boolean not null default false,
  add column if not exists return_transfer_location text,
  add column if not exists return_arrival_datetime timestamptz,
  add column if not exists return_arrival_location text;
