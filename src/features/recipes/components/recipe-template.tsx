import { ChefHat, Clock, Users } from "lucide-react";

import { formatDuration } from "@/lib/utils";
import type { RecipeView } from "@/features/recipes/service";
import { Stars } from "./stars";

/**
 * Rendu UNIFORME d'une recette — le template. Utilisé à l'identique pour
 * l'aperçu IA (avant enregistrement) et le détail d'une recette enregistrée :
 * c'est ce composant unique qui garantit que toutes les recettes se ressemblent.
 */
export function RecipeTemplate({ view }: { view: RecipeView }) {
  return (
    <div>
      <h3 className="text-[19px] font-bold tracking-tight">{view.title}</h3>

      <div className="my-3 flex flex-wrap items-center gap-3.5 text-[12.5px] font-medium text-foreground/70">
        <Meta icon={<Clock className="size-3.5 text-muted-foreground" />}>
          {view.timeMinutes != null ? formatDuration(view.timeMinutes) : "—"}
        </Meta>
        <Meta icon={<Users className="size-3.5 text-muted-foreground" />}>
          {view.servings != null ? `${view.servings} pers.` : "—"}
        </Meta>
        {view.difficulty && (
          <Meta icon={<ChefHat className="size-3.5 text-muted-foreground" />}>
            <span className="capitalize">{view.difficulty}</span>
          </Meta>
        )}
        {view.rating > 0 && <Stars value={view.rating} className="text-xs" />}
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1.25fr]">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Ingrédients
          </p>
          {view.ingredients.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/70">Aucun ingrédient.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {view.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13px] text-foreground/70">
                  <span className="min-w-[52px] font-semibold tabular-nums text-foreground">
                    {[ing.qty, ing.unit].filter(Boolean).join(" ")}
                  </span>
                  <span>{ing.item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Préparation
          </p>
          {view.steps.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/70">Aucune étape.</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {view.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[13px] text-foreground/70">
                  <span className="grid size-[21px] shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-bold tabular-nums text-primary">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {view.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-3.5">
          {view.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}
