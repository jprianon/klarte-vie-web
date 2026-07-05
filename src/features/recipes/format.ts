import { z } from "zod";

import type { RecipeDraft } from "@/types";

/**
 * Contrat du reformatage IA : « note libre → recette structurée ».
 * Template FIXE (c'est lui qui rend toutes les recettes identiques) : titre,
 * temps (prépa/repos/cuisson), portions, difficulté, ingrédients structurés,
 * étapes, tags et macros nutritionnelles estimées.
 */

export const SUGGESTED_CATEGORIES = [
  "Petit-déj",
  "Plats",
  "Healthy · Batch",
  "Desserts",
  "Boissons",
  "Apéro",
  "Pains",
  "Soupes",
] as const;

export const recipeIngredientSchema = z.object({
  qty: z.string().nullable(),
  unit: z.string().nullable(),
  item: z.string().min(1),
});

const nullableInt = z.number().int().nonnegative().nullable();

export const recipeDraftSchema = z.object({
  title: z.string().min(1),
  categoryName: z.string().min(1),
  servings: z.number().int().positive().nullable(),
  prepMinutes: nullableInt,
  restMinutes: nullableInt,
  cookMinutes: nullableInt,
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  ingredients: z.array(recipeIngredientSchema),
  steps: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
  kcal: nullableInt,
  carbsG: nullableInt,
  proteinG: nullableInt,
  fatG: nullableInt,
});

// Garantit à la compilation que le schéma reste aligné sur le type métier.
const _typecheck: RecipeDraft = {} as z.infer<typeof recipeDraftSchema>;
void _typecheck;

const intOrNull = { type: ["integer", "null"] } as const;

export const RECIPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Nom court et clair de la recette" },
    categoryName: { type: "string", description: "Catégorie du carnet" },
    servings: { type: ["integer", "null"], description: "Nombre de portions" },
    prepMinutes: { type: ["integer", "null"], description: "Temps de préparation (min)" },
    restMinutes: { type: ["integer", "null"], description: "Temps de repos (min)" },
    cookMinutes: { type: ["integer", "null"], description: "Temps de cuisson (min)" },
    difficulty: { type: "string", enum: ["facile", "moyen", "difficile"] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          qty: { type: ["string", "null"], description: "Quantité, ex. '2' ou '400'" },
          unit: { type: ["string", "null"], description: "Unité, ex. 'g', 'ml', 'c.à.s'" },
          item: { type: "string", description: "Ingrédient" },
        },
        required: ["qty", "unit", "item"],
      },
    },
    steps: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    kcal: { ...intOrNull, description: "Calories estimées" },
    carbsG: { ...intOrNull, description: "Glucides estimés (g)" },
    proteinG: { ...intOrNull, description: "Protéines estimées (g)" },
    fatG: { ...intOrNull, description: "Lipides estimés (g)" },
  },
  required: [
    "title",
    "categoryName",
    "servings",
    "prepMinutes",
    "restMinutes",
    "cookMinutes",
    "difficulty",
    "ingredients",
    "steps",
    "tags",
    "kcal",
    "carbsG",
    "proteinG",
    "fatG",
  ],
} as const;

export const FORMAT_SYSTEM_PROMPT = `Tu es l'assistant de mise en forme d'un carnet de recettes personnel.
On te donne une NOTE libre et tu la ranges dans un template FIXE.

Règles :
- N'invente pas d'ingrédient ni d'étape absents de la note.
- title : nom court, clair, sans emoji.
- categoryName : choisis parmi — ${SUGGESTED_CATEGORIES.join(", ")} — sinon propose-en une courte et cohérente.
- prepMinutes / restMinutes / cookMinutes : entiers en minutes déduits de la note (« Préparation : 30 min », « Repos : 1 h » = 60, « Cuisson : 5 min »). null si absent.
- servings : entier si présent (« pour 4 »), sinon null.
- difficulty : "facile", "moyen" ou "difficile" selon le nombre d'étapes/techniques.
- ingredients : sépare quantité (qty), unité (unit) et libellé (item). qty/unit à null s'ils manquent.
- steps : étapes courtes à l'impératif, une action par étape, dans l'ordre.
- tags : 2 à 5 mots-clés (catégorie, type de cuisine, occasion…).
- kcal, carbsG, proteinG, fatG : ESTIME les macros de la recette entière (nombres entiers) à partir des ingrédients. Mets null seulement si vraiment impossible à estimer.
Réponds UNIQUEMENT via le format structuré imposé.`;
