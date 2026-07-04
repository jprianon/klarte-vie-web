"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Heart, Loader2, Trash2, X } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import {
  deleteRecipe,
  isSupabaseConfigured,
  listRecipes,
  recipeToView,
  toggleFavorite,
  type RecipeView,
} from "@/features/recipes/service";
import { MOCK_CATEGORIES, MOCK_RECIPES } from "@/features/recipes/mock";
import { AiCaptureCard } from "./ai-capture-card";
import { RecipeTemplate } from "./recipe-template";
import { Stars } from "./stars";

const ALL = "all";

/** Palette de dégradés (couleurs iOS) attribuée de façon stable par catégorie. */
const GRADIENTS: [string, string][] = [
  ["#5aa9ff", "#0a84ff"],
  ["#6fe08a", "#30d158"],
  ["#ffd27a", "#ff9f0a"],
  ["#ff8fb0", "#ff2d55"],
  ["#c99bff", "#bf5af2"],
  ["#5aa9ff", "#5e5ce6"],
];

function gradientFor(name: string | null): [string, string] {
  const key = name ?? "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  // Index toujours dans [0, length) → l'assertion est sûre (noUncheckedIndexedAccess).
  return GRADIENTS[hash % GRADIENTS.length]!;
}

/** Recettes mock (démo) mappées en vues quand Supabase n'est pas configuré. */
function mockViews(): RecipeView[] {
  const catName = new Map(MOCK_CATEGORIES.map((c) => [c.id, c.name]));
  return MOCK_RECIPES.map((r) => ({
    id: r.id,
    title: r.title,
    categoryName: catName.get(r.categoryId) ?? null,
    servings: null,
    timeMinutes: r.timeMinutes,
    difficulty: null,
    ingredients: [],
    steps: [],
    tags: [],
    rating: r.rating,
    isFavorite: r.isFavorite,
  }));
}

/** Écran principal du carnet : capture IA, filtres, grille de recettes. */
export function RecipesView() {
  const [configured] = useState(isSupabaseConfigured);
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>(ALL);
  const [detail, setDetail] = useState<RecipeView | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!configured) {
        setRecipes(mockViews());
        return;
      }
      const rows = await listRecipes();
      setRecipes(rows.map(recipeToView));
    } catch {
      toast.error("Chargement des recettes impossible.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) {
      const name = r.categoryName ?? "Sans catégorie";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [recipes]);

  const filtered = useMemo(
    () =>
      selectedCat === ALL
        ? recipes
        : recipes.filter((r) => (r.categoryName ?? "Sans catégorie") === selectedCat),
    [recipes, selectedCat],
  );

  async function handleToggleFavorite(view: RecipeView) {
    if (!configured || !view.id) return;
    const next = !view.isFavorite;
    setRecipes((rs) => rs.map((r) => (r.id === view.id ? { ...r, isFavorite: next } : r)));
    setDetail((d) => (d && d.id === view.id ? { ...d, isFavorite: next } : d));
    try {
      await toggleFavorite(view.id, next);
    } catch {
      toast.error("Impossible de mettre à jour le favori.");
      void refresh();
    }
  }

  async function handleDelete(view: RecipeView) {
    if (!configured || !view.id) return;
    try {
      await deleteRecipe(view.id);
      toast.success("Recette supprimée.");
      setDetail(null);
      void refresh();
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  return (
    <div className="animate-fade-in px-6 py-6 md:px-8">
      {!configured && (
        <div className="mb-5 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-[13px] text-muted-foreground">
          Supabase non configuré : recettes de démonstration. Renseigne les clés dans{" "}
          <code>.env</code> pour ajouter et enregistrer les tiennes.
        </div>
      )}

      <AiCaptureCard canSave={configured} onSaved={refresh} />

      {/* Puces de catégories */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        <Chip
          active={selectedCat === ALL}
          onClick={() => setSelectedCat(ALL)}
          label="Toutes"
          count={recipes.length}
        />
        {categories.map((c) => (
          <Chip
            key={c.name}
            active={selectedCat === c.name}
            onClick={() => setSelectedCat(c.name)}
            label={c.name}
            count={c.count}
            dot={gradientFor(c.name)[1]}
          />
        ))}
      </div>

      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Récemment ajoutées</h2>
        <span className="text-[13px] text-muted-foreground">
          {filtered.length} recette{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-[14px] text-muted-foreground">
          Aucune recette pour l&apos;instant. Écris une note ci-dessus pour en ajouter une.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              canFavorite={configured}
              onOpen={() => setDetail(r)}
              onToggleFavorite={() => handleToggleFavorite(r)}
            />
          ))}
        </div>
      )}

      {detail && (
        <DetailModal
          view={detail}
          canEdit={configured}
          onClose={() => setDetail(null)}
          onToggleFavorite={() => handleToggleFavorite(detail)}
          onDelete={() => handleDelete(detail)}
        />
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  canFavorite,
  onOpen,
  onToggleFavorite,
}: {
  recipe: RecipeView;
  canFavorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const gradient = gradientFor(recipe.categoryName);
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div
        className="relative flex h-[122px] items-end p-3"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        {canFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={recipe.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-white/85 backdrop-blur-sm transition-transform hover:scale-105"
          >
            <Heart
              className={cn(
                "size-[15px]",
                recipe.isFavorite ? "fill-klarte-pink text-klarte-pink" : "text-foreground/50",
              )}
            />
          </button>
        )}
        {recipe.categoryName && (
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {recipe.categoryName}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-semibold tracking-tight">{recipe.title}</h3>
        <div className="mt-2 flex items-center gap-3.5 text-xs text-muted-foreground">
          {recipe.timeMinutes != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatDuration(recipe.timeMinutes)}
            </span>
          )}
          {recipe.rating > 0 && <Stars value={recipe.rating} className="text-xs" />}
        </div>
      </div>
    </article>
  );
}

function DetailModal({
  view,
  canEdit,
  onClose,
  onToggleFavorite,
  onDelete,
}: {
  view: RecipeView;
  canEdit: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center gap-2 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur">
          {view.categoryName && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {view.categoryName}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-label="Favori"
                  className="grid size-9 place-items-center rounded-full hover:bg-secondary"
                >
                  <Heart
                    className={cn(
                      "size-[18px]",
                      view.isFavorite ? "fill-klarte-pink text-klarte-pink" : "text-foreground/50",
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Supprimer"
                  className="grid size-9 place-items-center rounded-full text-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-[18px]" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="grid size-9 place-items-center rounded-full hover:bg-secondary"
            >
              <X className="size-[18px]" />
            </button>
          </div>
        </div>
        <div className="p-5">
          <RecipeTemplate view={view} />
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground/70 hover:text-foreground",
      )}
    >
      {dot && <span className="size-2.5 rounded-full" style={{ backgroundColor: dot }} />}
      {label}
      <span
        className={cn(
          "text-[12.5px] tabular-nums",
          active ? "text-background/60" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
