import { Clock, Heart } from "lucide-react";

import { formatDuration } from "@/lib/utils";
import type { MockCategory, MockRecipe } from "@/features/recipes/mock";
import { Stars } from "./stars";

/** Carte d'une recette dans la grille du carnet. */
export function RecipeCard({
  recipe,
  category,
}: {
  recipe: MockRecipe;
  category: MockCategory | undefined;
}) {
  return (
    <article className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <div
        className="relative flex h-[122px] items-end p-3"
        style={{
          backgroundImage: `linear-gradient(135deg, ${recipe.gradient[0]}, ${recipe.gradient[1]})`,
        }}
      >
        {recipe.isFavorite && (
          <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-white/85 backdrop-blur-sm">
            <Heart className="size-[15px] fill-klarte-pink text-klarte-pink" />
          </span>
        )}
        {category && (
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {category.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-semibold tracking-tight">{recipe.title}</h3>
        <div className="mt-2 flex items-center gap-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatDuration(recipe.timeMinutes)}
          </span>
          <Stars value={recipe.rating} className="text-xs" />
        </div>
      </div>
    </article>
  );
}
