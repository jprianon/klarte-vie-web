import type { Recipe, RecipeDraft, RecipeDifficulty, RecipeIngredient } from "@/types";

/**
 * Accès aux recettes côté navigateur : appelle les routes /api/recipes, qui
 * elles-mêmes tapent le Postgres local (cf. src/lib/db.ts). Le navigateur ne
 * parle jamais directement à la base.
 */

/** Vue unifiée consommée par l'UI : sert autant pour un brouillon IA que pour
 *  une recette enregistrée, afin que le rendu soit strictement identique. */
export interface RecipeView {
  id: string | null;
  title: string;
  categoryName: string | null;
  servings: number | null;
  timeMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  rating: number;
  isFavorite: boolean;
}

/** Ligne base de données → vue UI. */
export function recipeToView(r: Recipe): RecipeView {
  return {
    id: r.id,
    title: r.title,
    categoryName: r.category_name,
    servings: r.servings,
    timeMinutes: r.time_minutes,
    difficulty: r.difficulty,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    tags: r.tags ?? [],
    rating: r.rating,
    isFavorite: r.is_favorite,
  };
}

/** Brouillon IA → vue UI (aperçu avant enregistrement). */
export function draftToView(d: RecipeDraft): RecipeView {
  return {
    id: null,
    title: d.title,
    categoryName: d.categoryName,
    servings: d.servings,
    timeMinutes: d.timeMinutes,
    difficulty: d.difficulty,
    ingredients: d.ingredients,
    steps: d.steps,
    tags: d.tags,
    rating: 0,
    isFavorite: false,
  };
}

/** Liste + indicateur « base branchée ? ». */
export async function fetchRecipes(): Promise<{ configured: boolean; recipes: Recipe[] }> {
  const res = await fetch("/api/recipes", { cache: "no-store" });
  if (!res.ok) throw new Error("list_failed");
  const data = await res.json();
  return { configured: Boolean(data.configured), recipes: (data.recipes ?? []) as Recipe[] };
}

export async function createRecipe(
  draft: RecipeDraft,
  rawNote: string | null,
  source: "ai" | "manual",
): Promise<Recipe> {
  const res = await fetch("/api/recipes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ draft, rawNote, source }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.message || `Erreur ${res.status}`);
  }
  const data = await res.json();
  return data.recipe as Recipe;
}

export async function toggleFavorite(id: string, next: boolean): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ is_favorite: next }),
  });
  if (!res.ok) throw new Error("update_failed");
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_failed");
}
