"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import type { RecipeDraft } from "@/types";
import {
  deleteRecipe,
  fetchRecipes,
  recipeToView,
  toggleFavorite,
  updateRecipe,
  type RecipeView,
} from "@/features/recipes/service";
import { MOCK_CATEGORIES, MOCK_RECIPES } from "@/features/recipes/mock";
import { AiCaptureCard } from "./ai-capture-card";
import { RecipeDetail } from "./recipe-detail";
import { Stars } from "./stars";

type Mode = "home" | "add" | "browse";
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
    prepMinutes: r.timeMinutes,
    restMinutes: null,
    cookMinutes: null,
    totalMinutes: r.timeMinutes,
    difficulty: null,
    ingredients: [],
    steps: [],
    tags: [],
    kcal: null,
    carbsG: null,
    proteinG: null,
    fatG: null,
    rating: r.rating,
    isFavorite: r.isFavorite,
  }));
}

/**
 * Carnet de recettes — hub minimaliste. À l'arrivée, deux actions seulement :
 * « Ajouter » (capture IA / manuelle) ou « Consulter » (grille + détail).
 */
export function RecipesView() {
  const [configured, setConfigured] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>(ALL);
  const [detail, setDetail] = useState<RecipeView | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { configured: ok, recipes } = await fetchRecipes();
      setConfigured(ok);
      setRecipes(ok ? recipes.map(recipeToView) : mockViews());
    } catch {
      toast.error("Chargement des recettes impossible.");
      setConfigured(false);
      setRecipes(mockViews());
    } finally {
      setLoading(false);
    }
  }, []);

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

  /** Après un ajout : on recharge et on bascule sur la consultation. */
  function handleSaved() {
    void refresh();
    setMode("browse");
  }

  async function handleSaveEdit(view: RecipeView, draft: RecipeDraft) {
    if (!view.id) return;
    const updated = await updateRecipe(view.id, draft);
    const newView = recipeToView(updated);
    setRecipes((rs) => rs.map((r) => (r.id === newView.id ? newView : r)));
    setDetail(newView);
    toast.success("Recette modifiée.");
  }

  // ── Écran d'accueil du carnet : deux actions ────────────────────────────
  if (mode === "home") {
    return (
      <div className="mx-auto flex min-h-[68dvh] w-full max-w-md flex-col justify-center px-5 py-8">
        <div className="animate-fade-in">
          <h1 className="font-display text-[28px] font-bold tracking-tight">Mon carnet</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Que veux-tu faire ?</p>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <ActionTile
            icon={Plus}
            title="Ajouter une recette"
            subtitle="Une note libre, l'IA la met en forme"
            gradient={["#2f9e5f", "#14532d"]}
            onClick={() => setMode("add")}
          />
          <ActionTile
            icon={BookOpen}
            title="Consulter mes recettes"
            subtitle={loading ? "…" : `${recipes.length} recette${recipes.length > 1 ? "s" : ""}`}
            gradient={["#3ba55c", "#166534"]}
            onClick={() => setMode("browse")}
          />
        </div>
      </div>
    );
  }

  // ── Écran d'ajout ───────────────────────────────────────────────────────
  if (mode === "add") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-6">
        <BackHeader title="Ajouter une recette" onBack={() => setMode("home")} />
        <div className="animate-fade-in">
          <AiCaptureCard canSave={configured} onSaved={handleSaved} />
        </div>
      </div>
    );
  }

  // ── Écran de consultation ───────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8">
      <BackHeader title="Mes recettes" onBack={() => setMode("home")} />

      {!configured && (
        <div className="mb-5 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-[13px] text-muted-foreground">
          Base de données non configurée : recettes de démonstration.
        </div>
      )}

      {categories.length > 0 && (
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
      )}

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-[14px] text-muted-foreground">Aucune recette pour l&apos;instant.</p>
          <button
            type="button"
            onClick={() => setMode("add")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Ajouter une recette
          </button>
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
        <RecipeDetail
          view={detail}
          gradient={gradientFor(detail.categoryName)}
          canEdit={configured}
          onClose={() => setDetail(null)}
          onToggleFavorite={() => handleToggleFavorite(detail)}
          onDelete={() => handleDelete(detail)}
          onSaveEdit={(draft) => handleSaveEdit(detail, draft)}
        />
      )}
    </div>
  );
}

/** Grande tuile d'action (accueil du carnet). */
function ActionTile({
  icon: Icon,
  title,
  subtitle,
  gradient,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: [string, string];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex animate-fade-in items-center gap-4 rounded-[26px] border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
    >
      <span
        className="grid size-14 shrink-0 place-items-center rounded-[18px] text-white shadow-lg"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        <Icon className="size-7" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold tracking-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** En-tête avec bouton retour (écrans ajout / consultation). */
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground/70 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-[18px]" />
      </button>
      <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
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
        <h3 className="font-display text-[16px] font-semibold tracking-tight">{recipe.title}</h3>
        <div className="mt-2 flex items-center gap-3.5 text-xs text-muted-foreground">
          {recipe.totalMinutes != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatDuration(recipe.totalMinutes)}
            </span>
          )}
          {recipe.rating > 0 && <Stars value={recipe.rating} className="text-xs" />}
        </div>
      </div>
    </article>
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
