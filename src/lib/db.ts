import { Pool } from "pg";

import type { Recipe, RecipeDraft } from "@/types";

/**
 * Accès base de données — Postgres auto-hébergé sur le VPS (conteneur `db`).
 * Uniquement côté serveur (routes /api/recipes). La table est créée et migrée à
 * la volée au premier accès : aucune migration manuelle à lancer.
 */

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

/** La base est-elle configurée ? (variable serveur, jamais exposée au client) */
export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/** Garantit l'existence de la table + des colonnes (idempotent). */
async function ready(): Promise<Pool> {
  const p = getPool();
  if (!schemaReady) {
    schemaReady = p
      .query(
        `create table if not exists recipes (
           id            uuid primary key default gen_random_uuid(),
           title         text not null,
           category_name text,
           servings      int,
           time_minutes  int,
           difficulty    text check (difficulty in ('facile','moyen','difficile')),
           ingredients   jsonb not null default '[]'::jsonb,
           steps         jsonb not null default '[]'::jsonb,
           tags          jsonb not null default '[]'::jsonb,
           rating        int not null default 0,
           is_favorite   boolean not null default false,
           raw_note      text,
           source        text not null default 'ai' check (source in ('ai','manual')),
           image_url     text,
           created_at    timestamptz not null default now(),
           updated_at    timestamptz not null default now()
         );
         create index if not exists recipes_created_at_idx on recipes (created_at desc);
         alter table recipes add column if not exists prep_minutes int;
         alter table recipes add column if not exists rest_minutes int;
         alter table recipes add column if not exists cook_minutes int;
         alter table recipes add column if not exists kcal int;
         alter table recipes add column if not exists carbs_g int;
         alter table recipes add column if not exists protein_g int;
         alter table recipes add column if not exists fat_g int;
         create table if not exists recipe_images (
           recipe_id    uuid primary key references recipes(id) on delete cascade,
           content_type text not null,
           data         bytea not null,
           updated_at   timestamptz not null default now()
         );
         create table if not exists folders (
           id         uuid primary key default gen_random_uuid(),
           name       text not null,
           created_at timestamptz not null default now()
         );
         create table if not exists folder_recipes (
           folder_id uuid references folders(id) on delete cascade,
           recipe_id uuid references recipes(id) on delete cascade,
           primary key (folder_id, recipe_id)
         );
         create table if not exists shopping_items (
           id         uuid primary key default gen_random_uuid(),
           label      text not null,
           checked    boolean not null default false,
           created_at timestamptz not null default now()
         );
         create table if not exists meal_plan (
           id         uuid primary key default gen_random_uuid(),
           plan_date  date not null,
           recipe_id  uuid references recipes(id) on delete cascade,
           created_at timestamptz not null default now()
         );
         create index if not exists meal_plan_date_idx on meal_plan (plan_date);`,
      )
      .then(() => undefined)
      .catch((e) => {
        schemaReady = undefined; // retente au prochain appel si l'init a échoué
        throw e;
      });
  }
  await schemaReady;
  return p;
}

/** Ligne recette + indicateur de présence d'une photo (sans charger l'image). */
export type RecipeRow = Recipe & { has_image: boolean };

export async function dbListRecipes(): Promise<RecipeRow[]> {
  const p = await ready();
  const { rows } = await p.query<RecipeRow>(
    `select r.*, (ri.recipe_id is not null) as has_image
       from recipes r
       left join recipe_images ri on ri.recipe_id = r.id
      order by r.created_at desc`,
  );
  return rows;
}

export async function dbGetImage(id: string): Promise<{ contentType: string; data: Buffer } | null> {
  const p = await ready();
  const { rows } = await p.query<{ content_type: string; data: Buffer }>(
    "select content_type, data from recipe_images where recipe_id = $1",
    [id],
  );
  const row = rows[0];
  return row ? { contentType: row.content_type, data: row.data } : null;
}

export async function dbSetImage(id: string, contentType: string, data: Buffer): Promise<void> {
  const p = await ready();
  await p.query(
    `insert into recipe_images (recipe_id, content_type, data, updated_at)
       values ($1, $2, $3, now())
     on conflict (recipe_id) do update set content_type = $2, data = $3, updated_at = now()`,
    [id, contentType, data],
  );
}

export async function dbDeleteImage(id: string): Promise<void> {
  const p = await ready();
  await p.query("delete from recipe_images where recipe_id = $1", [id]);
}

/* ── Dossiers (collections) ──────────────────────────────────────────────── */

export interface FolderSummary {
  id: string;
  name: string;
  count: number;
}

export async function dbListFolders(): Promise<FolderSummary[]> {
  const p = await ready();
  const { rows } = await p.query<FolderSummary>(
    `select f.id, f.name, count(fr.recipe_id)::int as count
       from folders f
       left join folder_recipes fr on fr.folder_id = f.id
      group by f.id
      order by f.created_at desc`,
  );
  return rows;
}

export async function dbCreateFolder(name: string): Promise<FolderSummary> {
  const p = await ready();
  const { rows } = await p.query<{ id: string; name: string }>(
    "insert into folders (name) values ($1) returning id, name",
    [name],
  );
  const f = rows[0];
  if (!f) throw new Error("Création du dossier impossible.");
  return { id: f.id, name: f.name, count: 0 };
}

export async function dbDeleteFolder(id: string): Promise<void> {
  const p = await ready();
  await p.query("delete from folders where id = $1", [id]);
}

export async function dbFolderRecipes(folderId: string): Promise<RecipeRow[]> {
  const p = await ready();
  const { rows } = await p.query<RecipeRow>(
    `select r.*, (ri.recipe_id is not null) as has_image
       from folder_recipes fr
       join recipes r on r.id = fr.recipe_id
       left join recipe_images ri on ri.recipe_id = r.id
      where fr.folder_id = $1
      order by r.created_at desc`,
    [folderId],
  );
  return rows;
}

export async function dbRecipeFolderIds(recipeId: string): Promise<string[]> {
  const p = await ready();
  const { rows } = await p.query<{ folder_id: string }>(
    "select folder_id from folder_recipes where recipe_id = $1",
    [recipeId],
  );
  return rows.map((r) => r.folder_id);
}

export async function dbAddToFolder(folderId: string, recipeId: string): Promise<void> {
  const p = await ready();
  await p.query(
    "insert into folder_recipes (folder_id, recipe_id) values ($1, $2) on conflict do nothing",
    [folderId, recipeId],
  );
}

export async function dbRemoveFromFolder(folderId: string, recipeId: string): Promise<void> {
  const p = await ready();
  await p.query("delete from folder_recipes where folder_id = $1 and recipe_id = $2", [
    folderId,
    recipeId,
  ]);
}

/* ── Liste de courses ────────────────────────────────────────────────────── */

export interface ShoppingItem {
  id: string;
  label: string;
  checked: boolean;
}

export async function dbListShopping(): Promise<ShoppingItem[]> {
  const p = await ready();
  const { rows } = await p.query<ShoppingItem>(
    "select id, label, checked from shopping_items order by checked asc, created_at asc",
  );
  return rows;
}

export async function dbAddShopping(labels: string[]): Promise<void> {
  const clean = labels.map((l) => l.trim()).filter(Boolean);
  if (clean.length === 0) return;
  const p = await ready();
  const values = clean.map((_, i) => `($${i + 1})`).join(", ");
  await p.query(`insert into shopping_items (label) values ${values}`, clean);
}

export async function dbSetShoppingChecked(id: string, checked: boolean): Promise<void> {
  const p = await ready();
  await p.query("update shopping_items set checked = $2 where id = $1", [id, checked]);
}

export async function dbDeleteShopping(id: string): Promise<void> {
  const p = await ready();
  await p.query("delete from shopping_items where id = $1", [id]);
}

export async function dbClearShopping(onlyChecked: boolean): Promise<void> {
  const p = await ready();
  await p.query(
    onlyChecked ? "delete from shopping_items where checked = true" : "delete from shopping_items",
  );
}

/* ── Planning des repas ──────────────────────────────────────────────────── */

export interface PlanMealRow {
  id: string;
  plan_date: string;
  recipe_id: string;
  title: string;
  has_image: boolean;
}

export async function dbListPlan(from: string, to: string): Promise<PlanMealRow[]> {
  const p = await ready();
  const { rows } = await p.query<PlanMealRow>(
    `select mp.id, mp.plan_date::text as plan_date, mp.recipe_id, r.title,
            (ri.recipe_id is not null) as has_image
       from meal_plan mp
       join recipes r on r.id = mp.recipe_id
       left join recipe_images ri on ri.recipe_id = mp.recipe_id
      where mp.plan_date >= $1 and mp.plan_date <= $2
      order by mp.plan_date asc, mp.created_at asc`,
    [from, to],
  );
  return rows;
}

export async function dbAddPlan(date: string, recipeId: string): Promise<void> {
  const p = await ready();
  await p.query("insert into meal_plan (plan_date, recipe_id) values ($1, $2)", [date, recipeId]);
}

export async function dbDeletePlan(id: string): Promise<void> {
  const p = await ready();
  await p.query("delete from meal_plan where id = $1", [id]);
}

export async function dbCreateRecipe(
  draft: RecipeDraft,
  rawNote: string | null,
  source: "ai" | "manual",
): Promise<Recipe> {
  const p = await ready();
  const { rows } = await p.query<Recipe>(
    `insert into recipes
       (title, category_name, servings, prep_minutes, rest_minutes, cook_minutes,
        difficulty, ingredients, steps, tags, kcal, carbs_g, protein_g, fat_g, raw_note, source)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15, $16)
     returning *`,
    [
      draft.title,
      draft.categoryName,
      draft.servings,
      draft.prepMinutes,
      draft.restMinutes,
      draft.cookMinutes,
      draft.difficulty,
      JSON.stringify(draft.ingredients),
      JSON.stringify(draft.steps),
      JSON.stringify(draft.tags),
      draft.kcal,
      draft.carbsG,
      draft.proteinG,
      draft.fatG,
      rawNote,
      source,
    ],
  );
  const created = rows[0];
  if (!created) throw new Error("Insertion sans ligne retournée.");
  return created;
}

export async function dbUpdateRecipe(id: string, draft: RecipeDraft): Promise<Recipe> {
  const p = await ready();
  const { rows } = await p.query<Recipe>(
    `update recipes set
       title = $2, category_name = $3, servings = $4, prep_minutes = $5, rest_minutes = $6,
       cook_minutes = $7, difficulty = $8, ingredients = $9::jsonb, steps = $10::jsonb,
       tags = $11::jsonb, kcal = $12, carbs_g = $13, protein_g = $14, fat_g = $15, updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      draft.title,
      draft.categoryName,
      draft.servings,
      draft.prepMinutes,
      draft.restMinutes,
      draft.cookMinutes,
      draft.difficulty,
      JSON.stringify(draft.ingredients),
      JSON.stringify(draft.steps),
      JSON.stringify(draft.tags),
      draft.kcal,
      draft.carbsG,
      draft.proteinG,
      draft.fatG,
    ],
  );
  const updated = rows[0];
  if (!updated) throw new Error("Recette introuvable.");
  return updated;
}

export async function dbToggleFavorite(id: string, next: boolean): Promise<void> {
  const p = await ready();
  await p.query("update recipes set is_favorite = $1, updated_at = now() where id = $2", [next, id]);
}

export async function dbDeleteRecipe(id: string): Promise<void> {
  const p = await ready();
  await p.query("delete from recipes where id = $1", [id]);
}
