/**
 * Types de la base Supabase.
 *
 * ⚠️ Fichier provisoire écrit à la main pour poser le socle (Lot 1).
 * Il décrit le schéma cible du carnet de recettes (voir cadrage projet).
 * À terme, il sera REMPLACÉ par la génération automatique :
 *   pnpm db:types   (supabase gen types typescript ...)
 * une fois les migrations SQL appliquées sur le projet Supabase partagé.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Difficulté d'une recette. */
export type RecipeDifficulty = "facile" | "moyen" | "difficile";

/** Origine d'une recette : reformatée par l'IA ou saisie manuellement. */
export type RecipeSource = "ai" | "manual";

/** Un ingrédient structuré : quantité + unité + libellé. */
export interface RecipeIngredient {
  qty: string | null;
  unit: string | null;
  item: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recipe_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          category_name: string | null;
          title: string;
          servings: number | null;
          time_minutes: number | null;
          difficulty: RecipeDifficulty | null;
          ingredients: RecipeIngredient[];
          steps: string[];
          tags: string[];
          rating: number;
          is_favorite: boolean;
          raw_note: string | null;
          source: RecipeSource;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_name?: string | null;
          title: string;
          servings?: number | null;
          time_minutes?: number | null;
          difficulty?: RecipeDifficulty | null;
          ingredients?: RecipeIngredient[];
          steps?: string[];
          tags?: string[];
          rating?: number;
          is_favorite?: boolean;
          raw_note?: string | null;
          source?: RecipeSource;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string | null;
          title?: string;
          servings?: number | null;
          time_minutes?: number | null;
          difficulty?: RecipeDifficulty | null;
          ingredients?: RecipeIngredient[];
          steps?: string[];
          tags?: string[];
          rating?: number;
          is_favorite?: boolean;
          raw_note?: string | null;
          source?: RecipeSource;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      recipe_difficulty: RecipeDifficulty;
      recipe_source: RecipeSource;
    };
  };
}
