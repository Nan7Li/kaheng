-- Site-wide catalog and posts. Public to read; writes go through signed-in admins.
-- First signed-in visitor to open /admin is recorded in site_admins.

create table if not exists site_admins (
  user_id    text primary key,
  created_at timestamptz not null default now()
);

create table if not exists site_meta (
  key   text primary key,
  value text not null
);

create table if not exists catalog_cards (
  slug       text primary key,
  payload    jsonb not null,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create table if not exists site_posts (
  id         text primary key,
  payload    jsonb not null,
  updated_by text not null,
  updated_at timestamptz not null default now()
);
