import type { RecipeDifficulty, RecipeIngredient } from "@/types";

/**
 * Données de démonstration (Lot 1) — remplacées par Supabase au Lot 2.
 * Elles servent à construire et valider l'écran Recettes sans backend.
 */

export interface MockCategory {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface MockRecipe {
  id: string;
  title: string;
  categoryId: string;
  timeMinutes: number;
  rating: number; // 0..5
  isFavorite: boolean;
  gradient: [string, string];
}

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "petit-dej", name: "Petit-déj", color: "#ff9f0a", count: 8 },
  { id: "plats", name: "Plats", color: "#0a84ff", count: 17 },
  { id: "healthy", name: "Healthy · Batch", color: "#30d158", count: 9 },
  { id: "desserts", name: "Desserts", color: "#ff2d55", count: 6 },
  { id: "boissons", name: "Boissons", color: "#bf5af2", count: 2 },
];

export const MOCK_RECIPES: MockRecipe[] = [
  {
    id: "granola",
    title: "Granola maison",
    categoryId: "petit-dej",
    timeMinutes: 40,
    rating: 4,
    isFavorite: true,
    gradient: ["#ffd27a", "#ff9f0a"],
  },
  {
    id: "bowl-saumon",
    title: "Bowl saumon avocat",
    categoryId: "healthy",
    timeMinutes: 15,
    rating: 5,
    isFavorite: false,
    gradient: ["#6fe08a", "#30d158"],
  },
  {
    id: "poulet-curry",
    title: "Poulet curry coco",
    categoryId: "plats",
    timeMinutes: 30,
    rating: 5,
    isFavorite: false,
    gradient: ["#5aa9ff", "#0a84ff"],
  },
  {
    id: "banana-bread",
    title: "Banana bread",
    categoryId: "desserts",
    timeMinutes: 55,
    rating: 5,
    isFavorite: true,
    gradient: ["#ff8fb0", "#ff2d55"],
  },
  {
    id: "smoothie-vert",
    title: "Smoothie vert détox",
    categoryId: "boissons",
    timeMinutes: 5,
    rating: 3,
    isFavorite: false,
    gradient: ["#c99bff", "#bf5af2"],
  },
  {
    id: "chili",
    title: "Chili sin carne",
    categoryId: "plats",
    timeMinutes: 45,
    rating: 4,
    isFavorite: false,
    gradient: ["#5aa9ff", "#5e5ce6"],
  },
];

/** Note brute d'exemple qui illustre le flux IA (panneau gauche). */
export const DEMO_RAW_NOTE = `poulet curry coco pour 4
2 blancs de poulet, une boite de lait coco, oignon, ail, 2 cs de pâte de curry rouge, un peu de gingembre. riz basmati à côté.

faire revenir oignon ail, ajouter poulet en morceaux, curry, deglacer au lait coco, laisser mijoter 20 min. servir avec coriandre.

env 30 min, on adore, refaire`;

/** Recette reformatée d'exemple (panneau droit) — ce que produira l'IA au Lot 3. */
export const DEMO_DRAFT: {
  title: string;
  categoryName: string;
  servings: number;
  timeMinutes: number;
  difficulty: RecipeDifficulty;
  rating: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
} = {
  title: "Poulet curry coco",
  categoryName: "Plats",
  servings: 4,
  timeMinutes: 30,
  difficulty: "facile",
  rating: 5,
  ingredients: [
    { qty: "2", unit: null, item: "blancs de poulet" },
    { qty: "400", unit: "ml", item: "lait de coco" },
    { qty: "1", unit: null, item: "oignon" },
    { qty: "2", unit: "gousses", item: "ail" },
    { qty: "2", unit: "c.à.s", item: "pâte de curry rouge" },
    { qty: "1", unit: "cm", item: "gingembre" },
    { qty: "300", unit: "g", item: "riz basmati" },
  ],
  steps: [
    "Faire revenir l'oignon et l'ail émincés.",
    "Ajouter le poulet en morceaux et la pâte de curry.",
    "Déglacer au lait de coco, laisser mijoter 20 min.",
    "Servir sur le riz, parsemer de coriandre.",
  ],
  tags: ["Plats", "Asiatique", "Coup de cœur", "À refaire"],
};
