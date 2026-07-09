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

/**
 * URL de la photo d'une recette.
 * - `version` (`?v`) casse le cache après un ré-upload.
 * - `width` (`?w`) demande une vignette redimensionnée (bien plus légère).
 */
export function recipeImageUrl(id: string | null, version = 0, width = 0): string {
  if (!id) return "";
  const params = new URLSearchParams();
  if (version) params.set("v", String(version));
  if (width) params.set("w", String(width));
  const qs = params.toString();
  return `/api/recipes/${id}/image${qs ? `?${qs}` : ""}`;
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

/* ── Dossiers ────────────────────────────────────────────────────────────── */

export interface FolderSummary {
  id: string;
  name: string;
  count: number;
}

export async function fetchFolders(): Promise<{ configured: boolean; folders: FolderSummary[] }> {
  const res = await fetch("/api/folders", { cache: "no-store" });
  if (!res.ok) throw new Error("folders_failed");
  const data = await res.json();
  return { configured: Boolean(data.configured), folders: (data.folders ?? []) as FolderSummary[] };
}

export async function createFolder(name: string): Promise<FolderSummary> {
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("create_folder_failed");
  return (await res.json()).folder as FolderSummary;
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_folder_failed");
}

export async function fetchFolderRecipes(
  folderId: string,
): Promise<(Recipe & { has_image?: boolean })[]> {
  const res = await fetch(`/api/folders/${folderId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("folder_recipes_failed");
  return (await res.json()).recipes ?? [];
}

export async function fetchRecipeFolderIds(recipeId: string): Promise<string[]> {
  const res = await fetch(`/api/recipes/${recipeId}/folders`, { cache: "no-store" });
  if (!res.ok) throw new Error("recipe_folders_failed");
  return (await res.json()).folderIds ?? [];
}

export async function addRecipeToFolder(folderId: string, recipeId: string): Promise<void> {
  const res = await fetch(`/api/folders/${folderId}/recipes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recipeId }),
  });
  if (!res.ok) throw new Error("add_to_folder_failed");
}

export async function removeRecipeFromFolder(folderId: string, recipeId: string): Promise<void> {
  const res = await fetch(`/api/folders/${folderId}/recipes`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recipeId }),
  });
  if (!res.ok) throw new Error("remove_from_folder_failed");
}

/* ── Liste de courses ────────────────────────────────────────────────────── */

export interface ShoppingItem {
  id: string;
  label: string;
  checked: boolean;
}

export async function fetchShopping(): Promise<{ configured: boolean; items: ShoppingItem[] }> {
  const res = await fetch("/api/shopping", { cache: "no-store" });
  if (!res.ok) throw new Error("shopping_failed");
  const data = await res.json();
  return { configured: Boolean(data.configured), items: (data.items ?? []) as ShoppingItem[] };
}

export async function addShopping(labels: string[]): Promise<void> {
  const res = await fetch("/api/shopping", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ labels }),
  });
  if (!res.ok) throw new Error("add_shopping_failed");
}

export async function setShoppingChecked(id: string, checked: boolean): Promise<void> {
  const res = await fetch(`/api/shopping/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ checked }),
  });
  if (!res.ok) throw new Error("shopping_check_failed");
}

export async function deleteShopping(id: string): Promise<void> {
  const res = await fetch(`/api/shopping/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("shopping_delete_failed");
}

export async function clearShopping(onlyChecked: boolean): Promise<void> {
  const res = await fetch(`/api/shopping${onlyChecked ? "?checked=1" : ""}`, { method: "DELETE" });
  if (!res.ok) throw new Error("shopping_clear_failed");
}

/** Erreur d'appel IA/OCR portant le code HTTP (503 = IA non configurée). */
export class RecipeAiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RecipeAiError";
    this.status = status;
  }
}

/** Reformatage IA d'une note libre → brouillon structuré. */
export async function formatRecipe(note: string): Promise<RecipeDraft> {
  const res = await fetch("/api/recipes/format", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ note }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RecipeAiError(data?.message || `Erreur ${res.status}`, res.status);
  }
  return data.draft as RecipeDraft;
}

/**
 * Import depuis une URL : la page est récupérée, extraite, mise en fiche par
 * l'IA. `imageUrl` = photo trouvée sur la page (à enregistrer automatiquement).
 */
export async function importUrl(
  url: string,
): Promise<{ draft: RecipeDraft; imageUrl: string | null }> {
  const res = await fetch("/api/recipes/url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RecipeAiError(data?.message || `Erreur ${res.status}`, res.status);
  }
  return { draft: data.draft as RecipeDraft, imageUrl: (data.imageUrl as string) || null };
}

/** Enregistre la photo d'une recette depuis une URL distante (import auto). */
export async function attachImageFromUrl(recipeId: string, url: string): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/image`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("attach_image_failed");
}

/** Import depuis une capture d'écran : OCR (Tesseract) → template. */
export async function ocrRecipe(file: Blob): Promise<RecipeDraft> {
  const res = await fetch("/api/recipes/ocr", {
    method: "POST",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RecipeAiError(data?.message || `Erreur ${res.status}`, res.status);
  }
  return data.draft as RecipeDraft;
}

/** Libellé d'affichage d'un ingrédient (pour la liste de courses). */
export function ingredientLabel(ing: { qty: string | null; unit: string | null; item: string }): string {
  return [ing.qty, ing.unit, ing.item].filter(Boolean).join(" ");
}

/* ── Planning des repas ──────────────────────────────────────────────────── */

export interface PlanMeal {
  id: string;
  date: string; // YYYY-MM-DD
  recipeId: string;
  title: string;
  hasImage: boolean;
}

export async function fetchPlan(from: string, to: string): Promise<PlanMeal[]> {
  const res = await fetch(`/api/plan?from=${from}&to=${to}`, { cache: "no-store" });
  if (!res.ok) throw new Error("plan_failed");
  const data = await res.json();
  return ((data.meals ?? []) as Array<{
    id: string;
    plan_date: string;
    recipe_id: string;
    title: string;
    has_image: boolean;
  }>).map((m) => ({
    id: m.id,
    date: m.plan_date,
    recipeId: m.recipe_id,
    title: m.title,
    hasImage: Boolean(m.has_image),
  }));
}

export async function addPlan(date: string, recipeId: string): Promise<void> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date, recipeId }),
  });
  if (!res.ok) throw new Error("add_plan_failed");
}

export async function deletePlan(id: string): Promise<void> {
  const res = await fetch(`/api/plan/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_plan_failed");
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
