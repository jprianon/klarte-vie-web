-- Klarte Vie Web — carnet de recettes.
-- Usage PERSO sans authentification (choix assumé) : une seule « boîte » de
-- recettes, accessible via la clé anon. Le RLS est activé avec une policy
-- ouverte pour rester explicite ; si un jour on ajoute l'auth, on remplacera
-- la policy par un filtre sur auth.uid() (colonne user_id à réintroduire).
--
-- À coller dans Supabase → SQL Editor → New query, puis exécuter.

create extension if not exists "pgcrypto";

create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category_name text,
  servings      int,
  time_minutes  int,
  difficulty    text check (difficulty in ('facile', 'moyen', 'difficile')),
  ingredients   jsonb not null default '[]'::jsonb,   -- [{qty, unit, item}]
  steps         jsonb not null default '[]'::jsonb,   -- ["étape 1", ...]
  tags          jsonb not null default '[]'::jsonb,   -- ["Plats", ...]
  rating        int not null default 0,
  is_favorite   boolean not null default false,
  raw_note      text,                                 -- la note libre d'origine
  source        text not null default 'ai' check (source in ('ai', 'manual')),
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists recipes_created_at_idx on public.recipes (created_at desc);

-- Rafraîchit updated_at à chaque modification.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- Accès sans login : la clé anon peut tout faire sur cette table.
alter table public.recipes enable row level security;

drop policy if exists "anon full access" on public.recipes;
create policy "anon full access" on public.recipes
  for all to anon
  using (true) with check (true);
