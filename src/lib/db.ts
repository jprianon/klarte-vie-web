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
         );`,
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
