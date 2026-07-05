/**
 * Types métier (découplés des lignes Supabase brutes) — facilite un futur
 * portage React Native : la couche UI ne dépend jamais de la forme SQL.
 */
import type {
  Database,
  RecipeDifficulty,
  RecipeIngredient,
  RecipeSource,
} from "./database.types";

export type { RecipeDifficulty, RecipeIngredient, RecipeSource };

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

/** Une catégorie du carnet (Plats, Desserts…), éditable par l'utilisateur. */
export type RecipeCategory = Row<"recipe_categories">;

/** Une recette telle que stockée. */
export type Recipe = Row<"recipes">;

/**
 * Payload renvoyé par l'IA après reformatage d'une note (Lot 3).
 * Validé par un schéma zod côté serveur avant d'être proposé à l'utilisateur.
 */
export interface RecipeDraft {
  title: string;
  categoryName: string;
  servings: number | null;
  prepMinutes: number | null;
  restMinutes: number | null;
  cookMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  /** Valeurs nutritionnelles estimées (par portion ou pour la recette). */
  kcal: number | null;
  carbsG: number | null;
  proteinG: number | null;
  fatG: number | null;
}

/** Domaines (onglets) du dashboard de pilotage de vie. */
export type DashboardDomain = "today" | "recettes" | "trading" | "sport";
