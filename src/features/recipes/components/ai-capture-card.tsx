import { ArrowRight, ChefHat, Clock, Sparkles, Users } from "lucide-react";

import { DEMO_DRAFT, DEMO_RAW_NOTE } from "@/features/recipes/mock";
import { Stars } from "./stars";

/**
 * Carte « note libre → recette formatée » — le geste signature du carnet.
 * Ici en aperçu statique (données mock) ; le Lot 3 branchera l'appel IA réel
 * qui remplira le panneau droit à partir de la note saisie à gauche.
 */
export function AiCaptureCard() {
  return (
    <section className="mb-7 rounded-[22px] border border-border bg-card bg-[radial-gradient(120%_140%_at_100%_0%,rgba(94,92,230,0.07),transparent_55%),radial-gradient(120%_140%_at_0%_100%,rgba(10,132,255,0.06),transparent_50%)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-klarte-indigo px-3 py-1.5 text-xs font-semibold text-white shadow-[0_6px_16px_-8px_rgba(94,92,230,0.8)]">
          <Sparkles className="size-3.5" />
          IA
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight">
            Note libre → recette formatée
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Écris comme ça te vient. L&apos;IA range dans le bon template et la bonne catégorie.
          </p>
        </div>
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_44px_1fr]">
        {/* Panneau gauche : la note brute */}
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
          <PaneHead label="Ta note" />
          <p className="whitespace-pre-wrap p-4 text-[13.5px] leading-relaxed text-foreground/70">
            {DEMO_RAW_NOTE}
          </p>
        </div>

        {/* Flèche IA */}
        <div className="grid place-items-center py-2 md:py-0">
          <span className="grid size-9 rotate-90 place-items-center rounded-full bg-gradient-to-br from-primary to-klarte-indigo text-white shadow-lg md:rotate-0">
            <ArrowRight className="size-4" />
          </span>
        </div>

        {/* Panneau droit : la recette structurée */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <PaneHead label="Recette structurée" done />
          <div className="p-4">
            <h3 className="text-[17px] font-bold tracking-tight">{DEMO_DRAFT.title}</h3>
            <div className="my-3 flex flex-wrap items-center gap-3.5 text-[12.5px] font-medium text-foreground/70">
              <Meta icon={<Clock className="size-3.5 text-muted-foreground" />}>
                {DEMO_DRAFT.timeMinutes} min
              </Meta>
              <Meta icon={<Users className="size-3.5 text-muted-foreground" />}>
                {DEMO_DRAFT.servings} pers.
              </Meta>
              <Meta icon={<ChefHat className="size-3.5 text-muted-foreground" />}>
                <span className="capitalize">{DEMO_DRAFT.difficulty}</span>
              </Meta>
              <Stars value={DEMO_DRAFT.rating} className="text-xs" />
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_1.25fr]">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Ingrédients
                </p>
                <ul className="flex flex-col gap-1.5">
                  {DEMO_DRAFT.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-[13px] text-foreground/70">
                      <span className="min-w-[52px] font-semibold tabular-nums text-foreground">
                        {[ing.qty, ing.unit].filter(Boolean).join(" ")}
                      </span>
                      <span>{ing.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Préparation
                </p>
                <ol className="flex flex-col gap-2.5">
                  {DEMO_DRAFT.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-[13px] text-foreground/70">
                      <span className="grid size-[21px] shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-bold tabular-nums text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-3.5">
              {DEMO_DRAFT.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaneHead({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span
        className={
          done
            ? "size-[7px] rounded-full bg-klarte-green shadow-[0_0_0_3px_rgba(48,209,88,0.18)]"
            : "size-[7px] rounded-full bg-muted-foreground/50"
        }
      />
      <span className={done ? "text-klarte-indigo" : undefined}>{label}</span>
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
