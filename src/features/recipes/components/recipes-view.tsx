"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { MOCK_CATEGORIES, MOCK_RECIPES } from "@/features/recipes/mock";
import { AiCaptureCard } from "./ai-capture-card";
import { RecipeCard } from "./recipe-card";

const ALL = "all";

/** Écran principal du carnet : filtres, capture IA, grille de recettes. */
export function RecipesView() {
  const [selected, setSelected] = useState<string>(ALL);

  const categoryById = useMemo(
    () => new Map(MOCK_CATEGORIES.map((c) => [c.id, c])),
    [],
  );

  const recipes = useMemo(
    () =>
      selected === ALL
        ? MOCK_RECIPES
        : MOCK_RECIPES.filter((r) => r.categoryId === selected),
    [selected],
  );

  const total = MOCK_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="animate-fade-in px-6 py-6 md:px-8">
      {/* Puces de catégories */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        <Chip
          active={selected === ALL}
          onClick={() => setSelected(ALL)}
          label="Toutes"
          count={total}
        />
        {MOCK_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={selected === c.id}
            onClick={() => setSelected(c.id)}
            label={c.name}
            count={c.count}
            dot={c.color}
          />
        ))}
      </div>

      <AiCaptureCard />

      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Récemment ajoutées</h2>
        <span className="text-[13px] text-muted-foreground">
          {recipes.length} recette{recipes.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} category={categoryById.get(r.categoryId)} />
        ))}
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
