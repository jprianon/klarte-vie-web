"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { toast } from "sonner";
import type { RecipeDraft } from "@/types";
import {
  addShopping,
  deleteRecipe,
  fetchRecipes,
  recipeToView,
  toggleFavorite,
  updateRecipe,
  type RecipeView,
} from "@/features/recipes/service";
import { MOCK_CATEGORIES, MOCK_RECIPES } from "@/features/recipes/mock";
import { gradientFor } from "@/features/recipes/gradient";
import { AiCaptureCard } from "./ai-capture-card";
import { BottomNav, type RecipeTab } from "./bottom-nav";
import { ThemesView } from "./themes-view";
import { PlanningView } from "./planning-view";
import { RecipeDetail } from "./recipe-detail";
import { RecipeRow } from "./recipe-row";
import { ShoppingView } from "./shopping-view";

/** Recettes mock (démo) mappées en vues quand la base n'est pas configurée. */
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
    hasImage: false,
  }));
}

/**
 * Carnet de recettes : navigation basse (Recettes / Thèmes / Courses),
 * bouton + central pour ajouter et écran détail.
 */
export function RecipesView() {
  const [configured, setConfigured] = useState(false);
  const [tab, setTab] = useState<RecipeTab>("recettes");
  const [adding, setAdding] = useState(false);
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RecipeView | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const bump = useCallback(() => setReloadKey((k) => k + 1), []);

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

  async function handleToggleFavorite(view: RecipeView) {
    if (!configured || !view.id) return;
    const next = !view.isFavorite;
    setRecipes((rs) => rs.map((r) => (r.id === view.id ? { ...r, isFavorite: next } : r)));
    setDetail((d) => (d && d.id === view.id ? { ...d, isFavorite: next } : d));
    try {
      await toggleFavorite(view.id, next);
      bump();
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
      bump();
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  async function handleSaveEdit(view: RecipeView, draft: RecipeDraft) {
    if (!view.id) return;
    const updated = await updateRecipe(view.id, draft);
    const newView = { ...recipeToView(updated), hasImage: view.hasImage };
    setRecipes((rs) => rs.map((r) => (r.id === newView.id ? newView : r)));
    setDetail(newView);
    bump();
    toast.success("Recette modifiée.");
  }

  function handleImageChanged(view: RecipeView, hasImage: boolean) {
    setRecipes((rs) => rs.map((r) => (r.id === view.id ? { ...r, hasImage } : r)));
    setDetail((d) => (d && d.id === view.id ? { ...d, hasImage } : d));
    bump();
  }

  async function handleAddToShopping(labels: string[]) {
    const clean = labels.map((l) => l.trim()).filter(Boolean);
    if (clean.length === 0) return;
    try {
      await addShopping(clean);
      bump();
      toast.success(`${clean.length} article${clean.length > 1 ? "s" : ""} ajouté${clean.length > 1 ? "s" : ""} aux courses.`);
    } catch {
      toast.error("Ajout aux courses impossible.");
    }
  }

  function handleSaved() {
    void refresh();
    bump();
    setAdding(false);
    setTab("recettes");
  }

  // ── Écran d'ajout (plein écran) ─────────────────────────────────────────
  if (adding) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div
          className="flex items-center gap-3 border-b border-border px-5 pb-4"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={() => setAdding(false)}
            aria-label="Retour"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
          <h1 className="font-display text-xl font-bold tracking-tight">Ajouter une recette</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5">
          <div className="mx-auto w-full max-w-2xl">
            <AiCaptureCard canSave={configured} onSaved={handleSaved} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="mx-auto w-full max-w-2xl px-5 pb-28 pt-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {tab === "recettes" && (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight">Mes recettes</h1>
            <p className="mt-0.5 text-[14px] text-muted-foreground">
              Retrouvez vos recettes sauvegardées.
            </p>

            {!configured && (
              <div className="mt-4 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-[13px] text-muted-foreground">
                Base de données non configurée : recettes de démonstration.
              </div>
            )}

            {loading ? (
              <div className="grid place-items-center py-16 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="text-[14px] text-muted-foreground">Aucune recette pour l&apos;instant.</p>
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm active:scale-[0.98]"
                >
                  <Plus className="size-4" />
                  Ajouter une recette
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {recipes.map((r) => (
                  <RecipeRow
                    key={r.id}
                    recipe={r}
                    canEdit={configured}
                    onOpen={() => setDetail(r)}
                    onToggleFavorite={() => handleToggleFavorite(r)}
                    onDelete={() => handleDelete(r)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "themes" && (
          <ThemesView
            recipes={recipes}
            canEdit={configured}
            onOpenRecipe={(v) => setDetail(v)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteRecipe={handleDelete}
          />
        )}

        {tab === "courses" && <ShoppingView reloadKey={reloadKey} />}

        {tab === "planning" && (
          <PlanningView
            canEdit={configured}
            reloadKey={reloadKey}
            recipes={recipes}
            onOpenRecipe={(v) => setDetail(v)}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={setTab} onAdd={() => setAdding(true)} />

      {detail && (
        <RecipeDetail
          key={detail.id}
          view={detail}
          gradient={gradientFor(detail.categoryName)}
          canEdit={configured}
          onClose={() => setDetail(null)}
          onToggleFavorite={() => handleToggleFavorite(detail)}
          onDelete={() => handleDelete(detail)}
          onSaveEdit={(draft) => handleSaveEdit(detail, draft)}
          onImageChanged={(hasImage) => handleImageChanged(detail, hasImage)}
          onAddToShopping={handleAddToShopping}
        />
      )}
    </>
  );
}
