"use client";

import { useState } from "react";
import { Clock, Flame, FolderPlus, Heart, Trash2, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { recipeImageUrl, type RecipeView } from "@/features/recipes/service";
import { gradientFor } from "@/features/recipes/gradient";

/** Carte de recette en ligne (liste) : vignette + titre + pills + actions. */
export function RecipeRow({
  recipe,
  canEdit,
  onOpen,
  onToggleFavorite,
  onDelete,
  onAddToFolder,
}: {
  recipe: RecipeView;
  canEdit: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onAddToFolder?: () => void;
}) {
  const gradient = gradientFor(recipe.categoryName);
  const [imgError, setImgError] = useState(false);
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="relative size-[92px] shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        {recipe.hasImage && !imgError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipeImageUrl(recipe.id)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 font-display text-[15.5px] font-semibold leading-tight tracking-tight">
          {recipe.title}
        </h3>
        {recipe.categoryName && (
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{recipe.categoryName}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {recipe.totalMinutes != null && <MiniPill icon={Clock}>{recipe.totalMinutes}min</MiniPill>}
          {recipe.servings != null && <MiniPill icon={Users}>{recipe.servings}x</MiniPill>}
          {recipe.kcal != null && <MiniPill icon={Flame}>{recipe.kcal}</MiniPill>}
        </div>
      </div>

      {canEdit && (
        <div className="flex flex-col items-center justify-center gap-1">
          {onAddToFolder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToFolder();
              }}
              aria-label="Ranger dans un dossier"
              className="grid size-9 place-items-center rounded-full text-foreground/40 hover:bg-secondary hover:text-foreground"
            >
              <FolderPlus className="size-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={recipe.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="grid size-9 place-items-center rounded-full text-foreground/40 hover:bg-secondary"
          >
            <Heart
              className={cn("size-[18px]", recipe.isFavorite && "fill-klarte-pink text-klarte-pink")}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Supprimer cette recette ?")) onDelete();
            }}
            aria-label="Supprimer"
            className="grid size-9 place-items-center rounded-full text-foreground/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      )}
    </article>
  );
}

function MiniPill({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-foreground/80">
      <Icon className="size-3 text-primary" />
      {children}
    </span>
  );
}
