import { z } from "zod";

import type { RecipeDraft } from "@/types";

/**
 * Contrat du reformatage IA : « note libre → recette structurée ».
 *
 * - `recipeDraftSchema` valide côté serveur ce que renvoie Claude avant de le
 *   proposer à l'utilisateur (garde-fou : jamais de JSON non conforme en UI).
 * - `RECIPE_JSON_SCHEMA` est envoyé à l'API Claude via `output_config.format`
 *   (structured outputs) pour garantir que la réponse suit exactement ce moule.
 * - Le template est volontairement fixe : c'est ce qui rend toutes les recettes
 *   identiques visuellement, quel que soit le style de la note d'origine.
 */

/** Catégories proposées à l'IA (elle peut en inventer une si rien ne colle). */
export const SUGGESTED_CATEGORIES = [
  "Petit-déj",
  "Plats",
  "Healthy · Batch",
  "Desserts",
  "Boissons",
  "Apéro",
  "Soupes",
] as const;

export const recipeIngredientSchema = z.object({
  qty: z.string().nullable(),
  unit: z.string().nullable(),
  item: z.string().min(1),
});

export const recipeDraftSchema = z.object({
  title: z.string().min(1),
  categoryName: z.string().min(1),
  servings: z.number().int().positive().nullable(),
  timeMinutes: z.number().int().positive().nullable(),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  ingredients: z.array(recipeIngredientSchema),
  steps: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
});

// Garantit à la compilation que le schéma reste aligné sur le type métier.
const _typecheck: RecipeDraft = {} as z.infer<typeof recipeDraftSchema>;
void _typecheck;

/**
 * JSON Schema envoyé à Claude (`output_config.format`). Contraintes des
 * structured outputs : chaque objet a `additionalProperties: false` et TOUTES
 * ses clés dans `required` (les champs « optionnels » sont exprimés en
 * `["...", "null"]`).
 */
export const RECIPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Nom court et clair de la recette" },
    categoryName: { type: "string", description: "Catégorie du carnet" },
    servings: { type: ["integer", "null"], description: "Nombre de portions" },
    timeMinutes: { type: ["integer", "null"], description: "Temps total en minutes" },
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
  },
  required: [
    "title",
    "categoryName",
    "servings",
    "timeMinutes",
    "difficulty",
    "ingredients",
    "steps",
    "tags",
  ],
} as const;

/** Consigne système : normaliser sans inventer, dans un template stable. */
export const FORMAT_SYSTEM_PROMPT = `Tu es l'assistant de mise en forme d'un carnet de recettes personnel.
On te donne une NOTE libre (écrite au fil de la pensée) et tu la ranges dans un template FIXE.

Règles :
- N'invente rien : n'ajoute pas d'ingrédient, d'étape ou de quantité absents de la note. Si une info manque, laisse null (servings, timeMinutes) ou reste factuel.
- title : nom court, clair, sans emoji.
- categoryName : choisis parmi ces catégories quand c'est pertinent — ${SUGGESTED_CATEGORIES.join(", ")} — sinon propose-en une courte et cohérente.
- servings / timeMinutes : nombres entiers si présents dans la note (déduis timeMinutes d'expressions comme « 30 min »), sinon null.
- difficulty : estime "facile", "moyen" ou "difficile" d'après le nombre d'étapes et de techniques.
- ingredients : sépare quantité (qty), unité (unit) et libellé (item). qty et unit sont null s'ils ne sont pas donnés.
- steps : reformule en étapes courtes à l'impératif, une action par étape, dans l'ordre.
- tags : 2 à 5 mots-clés utiles (catégorie, type de cuisine, occasion, « à refaire »…).
Réponds UNIQUEMENT via le format structuré imposé.`;
