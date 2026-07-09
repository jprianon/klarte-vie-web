"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";

import { toast } from "sonner";
import {
  addPlan,
  deletePlan,
  fetchPlan,
  recipeImageUrl,
  type PlanMeal,
  type RecipeView,
} from "@/features/recipes/service";
import { gradientFor } from "@/features/recipes/gradient";

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // 0 = lundi
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayLabel(d: Date): string {
  const weekday = d.toLocaleDateString("fr-FR", { weekday: "long" });
  const dm = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${weekday}, ${dm}`;
}

/** Onglet Planning : planifier des recettes par jour, semaine par semaine. */
export function PlanningView({
  canEdit,
  reloadKey,
  recipes,
  onOpenRecipe,
}: {
  canEdit: boolean;
  reloadKey: number;
  recipes: RecipeView[];
  onOpenRecipe: (v: RecipeView) => void;
}) {
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [meals, setMeals] = useState<PlanMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReload, setLocalReload] = useState(0);
  const [pickerDate, setPickerDate] = useState<string | null>(null);

  useEffect(() => {
    setWeekStart(startOfWeek(new Date()));
  }, []);

  useEffect(() => {
    if (!weekStart) return;
    let active = true;
    setLoading(true);
    fetchPlan(ymd(weekStart), ymd(addDays(weekStart, 6)))
      .then((m) => {
        if (active) {
          setMeals(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setMeals([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [weekStart, reloadKey, localReload]);

  const recipesById = useMemo(() => {
    const m = new Map<string, RecipeView>();
    for (const r of recipes) if (r.id) m.set(r.id, r);
    return m;
  }, [recipes]);

  const days = useMemo(
    () => (weekStart ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : []),
    [weekStart],
  );

  const mealsByDate = useMemo(() => {
    const m = new Map<string, PlanMeal[]>();
    for (const meal of meals) {
      const list = m.get(meal.date) ?? [];
      list.push(meal);
      m.set(meal.date, list);
    }
    return m;
  }, [meals]);

  async function handleAdd(recipeId: string) {
    if (!pickerDate) return;
    try {
      await addPlan(pickerDate, recipeId);
      setPickerDate(null);
      setLocalReload((k) => k + 1);
      toast.success("Repas planifié.");
    } catch {
      toast.error("Ajout au planning impossible.");
    }
  }

  async function handleRemove(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    try {
      await deletePlan(id);
    } catch {
      toast.error("Suppression impossible.");
      setLocalReload((k) => k + 1);
    }
  }

  if (!weekStart) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const weekEnd = addDays(weekStart, 6);
  const weekTitle = `${String(weekStart.getDate()).padStart(2, "0")} - ${String(weekEnd.getDate()).padStart(2, "0")} ${weekEnd.toLocaleDateString("fr-FR", { month: "short" })}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setWeekStart((w) => (w ? addDays(w, -7) : w))}
          aria-label="Semaine précédente"
          className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="min-w-[120px] font-display text-lg font-bold tracking-tight"
        >
          {weekTitle}
        </button>
        <button
          type="button"
          onClick={() => setWeekStart((w) => (w ? addDays(w, 7) : w))}
          aria-label="Semaine suivante"
          className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:text-foreground"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {!canEdit && (
        <div className="mb-4 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-[13px] text-muted-foreground">
          Base non configurée : le planning n&apos;est pas enregistré.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {days.map((day) => {
            const key = ymd(day);
            const dayMeals = mealsByDate.get(key) ?? [];
            return (
              <div key={key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <h3 className="flex-1 font-display text-[16px] font-semibold capitalize tracking-tight">
                    {dayLabel(day)}
                  </h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setPickerDate(key)}
                      aria-label="Ajouter un repas"
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary active:scale-95"
                    >
                      <Plus className="size-5" />
                    </button>
                  )}
                </div>

                {dayMeals.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-muted-foreground">Aucun repas planifié</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {dayMeals.map((meal) => {
                      const recipe = recipesById.get(meal.recipeId);
                      const gradient = gradientFor(recipe?.categoryName ?? null);
                      return (
                        <li
                          key={meal.id}
                          className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2"
                        >
                          <button
                            type="button"
                            onClick={() => recipe && onOpenRecipe(recipe)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span
                              className="relative size-10 shrink-0 overflow-hidden rounded-lg"
                              style={{
                                backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                              }}
                            >
                              {meal.hasImage && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={recipeImageUrl(meal.recipeId, 0, 96)}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                              )}
                            </span>
                            <span className="truncate text-[14px] font-medium">{meal.title}</span>
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleRemove(meal.id)}
                              aria-label="Retirer du planning"
                              className="grid size-8 shrink-0 place-items-center rounded-full text-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="size-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pickerDate && (
        <RecipePickerModal
          recipes={recipes}
          onPick={handleAdd}
          onClose={() => setPickerDate(null)}
        />
      )}
    </div>
  );
}

function RecipePickerModal({
  recipes,
  onPick,
  onClose,
}: {
  recipes: RecipeView[];
  onPick: (recipeId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sticky top-0 flex items-center gap-2 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur">
          <h2 className="font-display text-lg font-bold tracking-tight">Choisir une recette</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-auto grid size-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="p-3">
          {recipes.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              Aucune recette à planifier.
            </p>
          ) : (
            <ul className="flex flex-col">
              {recipes.map((r) => {
                const gradient = gradientFor(r.categoryName);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => r.id && onPick(r.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary"
                    >
                      <span
                        className="relative size-11 shrink-0 overflow-hidden rounded-lg"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                        }}
                      >
                        {r.hasImage && r.id && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={recipeImageUrl(r.id, 0, 96)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium">{r.title}</span>
                        {r.categoryName && (
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {r.categoryName}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
