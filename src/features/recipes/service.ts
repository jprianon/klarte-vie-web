import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeDraft, RecipeDifficulty, RecipeIngredient } from "@/types";

/**
 * Accès aux recettes (Supabase, sans authentification — cf. supabase/schema.sql).
 * Utilisé côté navigateur ("use client"). Toutes les fonctions supposent la
 * config Supabase présente ; l'UI vérifie `isSupabaseConfigured()` avant.
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

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Ligne Supabase → vue UI. */
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

export async function listRecipes(): Promise<Recipe[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRecipe(
  draft: RecipeDraft,
  rawNote: string | null,
  source: "ai" | "manual",
): Promise<Recipe> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: draft.title,
      category_name: draft.categoryName,
      servings: draft.servings,
      time_minutes: draft.timeMinutes,
      difficulty: draft.difficulty,
      ingredients: draft.ingredients,
      steps: draft.steps,
      tags: draft.tags,
      raw_note: rawNote,
      source,
    })
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Enregistrement : aucune donnée retournée.");
  return data;
}

export async function toggleFavorite(id: string, next: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").update({ is_favorite: next }).eq("id", id);
  if (error) throw error;
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
