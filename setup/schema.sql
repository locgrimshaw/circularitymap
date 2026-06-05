-- =====================================================
-- setup/schema.sql
-- Run this in the Supabase SQL Editor to create
-- the directory entries table.
-- =====================================================

-- Create the entries table
create table if not exists entries (
  id          bigserial primary key,
  created_at  timestamptz default now() not null,
  name        text not null,
  category    text not null check (category in ('shop','startup','education','skills','community')),
  website     text not null,
  location    text not null,
  lat         double precision not null,
  lng         double precision not null,
  photo       text,
  desc        text not null,
  borough     text
);

-- Index for fast category filtering
create index if not exists entries_category_idx on entries (category);

-- =====================================================
-- Row Level Security (RLS)
-- This allows anyone to read and insert entries,
-- but prevents deletion or modification — keeping
-- the directory safe while still being open.
-- =====================================================

alter table entries enable row level security;

-- Allow anyone to read all entries
create policy "Public read access"
  on entries for select
  using (true);

-- Allow anyone to insert new entries
create policy "Public insert access"
  on entries for insert
  with check (true);

-- Explicitly deny updates and deletes (only a logged-in
-- admin via the Supabase dashboard can modify entries)
-- No policies for UPDATE or DELETE = denied by default.
