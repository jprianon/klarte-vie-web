import type { Recipe, RecipeDraft, RecipeDifficulty, RecipeIngredient } from "@/types";

/**
 * Accès aux recettes côté navigateur : appelle les routes /api/recipes, qui
 * tapent le Postgres local (cf. src/lib/db.ts). Le navigateur ne parle jamais
 * directement à la base.
 */

/** Vue unifiée consommée par l'UI (brouillon IA OU recette enregistrée). */
export interface RecipeView {
  id: string | null;
  title: string;
  categoryName: string | null;
  servings: number | null;
  prepMinutes: number | null;
  restMinutes: number | null;
  cookMinutes: number | null;
  /** Somme prépa + repos + cuisson (pour l'affichage rapide en carte). */
  totalMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  kcal: number | null;
  carbsG: number | null;
  proteinG: number | null;
  fatG: number | null;
  rating: number;
  isFavorite: boolean;
  hasImage: boolean;
}

function sumMinutes(...vals: (number | null)[]): number | null {
  const present = vals.filter((v): v is number => typeof v === "number");
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0);
}

/** Ligne base de données → vue UI. */
export function recipeToView(r: Recipe & { has_image?: boolean }): RecipeView {
  return {
    hasImage: Boolean(r.has_image),
    id: r.id,
    title: r.title,
    categoryName: r.category_name,
    servings: r.servings,
    prepMinutes: r.prep_minutes,
    restMinutes: r.rest_minutes,
    cookMinutes: r.cook_minutes,
    totalMinutes: sumMinutes(r.prep_minutes, r.rest_minutes, r.cook_minutes),
    difficulty: r.difficulty,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    tags: r.tags ?? [],
    kcal: r.kcal,
    carbsG: r.carbs_g,
    proteinG: r.protein_g,
    fatG: r.fat_g,
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
    prepMinutes: d.prepMinutes,
    restMinutes: d.restMinutes,
    cookMinutes: d.cookMinutes,
    totalMinutes: sumMinutes(d.prepMinutes, d.restMinutes, d.cookMinutes),
    difficulty: d.difficulty,
    ingredients: d.ingredients,
    steps: d.steps,
    tags: d.tags,
    kcal: d.kcal,
    carbsG: d.carbsG,
    proteinG: d.proteinG,
    fatG: d.fatG,
    rating: 0,
    isFavorite: false,
    hasImage: false,
  };
}

/** URL de la photo d'une recette (le paramètre `v` casse le cache après upload). */
export function recipeImageUrl(id: string | null, version = 0): string {
  if (!id) return "";
  return `/api/recipes/${id}/image${version ? `?v=${version}` : ""}`;
}

export async function uploadRecipeImage(id: string, file: Blob): Promise<void> {
  const res = await fetch(`/api/recipes/${id}/image`, {
    method: "POST",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.message || `Erreur ${res.status}`);
  }
}

export async function deleteRecipeImage(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}/image`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_image_failed");
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

/** Vue → brouillon éditable (pour pré-remplir le formulaire de modification). */
export function viewToDraft(v: RecipeView): RecipeDraft {
  return {
    title: v.title,
    categoryName: v.categoryName ?? "",
    servings: v.servings,
    prepMinutes: v.prepMinutes,
    restMinutes: v.restMinutes,
    cookMinutes: v.cookMinutes,
    difficulty: v.difficulty,
    ingredients: v.ingredients,
    steps: v.steps,
    tags: v.tags,
    kcal: v.kcal,
    carbsG: v.carbsG,
    proteinG: v.proteinG,
    fatG: v.fatG,
  };
}

export async function updateRecipe(id: string, draft: RecipeDraft): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.message || `Erreur ${res.status}`);
  }
  const data = await res.json();
  return data.recipe as Recipe;
}
