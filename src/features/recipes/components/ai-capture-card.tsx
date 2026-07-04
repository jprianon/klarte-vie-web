"use client";

import { useState } from "react";
import { Loader2, PenLine, Save, Sparkles, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RecipeDraft, RecipeIngredient } from "@/types";
import { SUGGESTED_CATEGORIES } from "@/features/recipes/format";
import { createRecipe, draftToView } from "@/features/recipes/service";
import { RecipeTemplate } from "./recipe-template";

/**
 * Carte « note libre → recette formatée » — le geste signature du carnet.
 * - Mode IA : la note part vers /api/recipes/format (Claude) et revient rangée
 *   dans le template. - Mode manuel (repli sans clé IA) : saisie directe des
 *   mêmes champs. Dans les deux cas on obtient un `RecipeDraft`, prévisualisé
 *   par le MÊME template, puis enregistré.
 */
export function AiCaptureCard({
  canSave,
  onSaved,
}: {
  canSave: boolean;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [rawNote, setRawNote] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "manual">("ai");

  async function handleFormat() {
    if (note.trim().length < 3) {
      toast.error("Écris quelques mots de recette d'abord.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recipes/format", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          toast.info("IA non configurée — passe en saisie manuelle.");
          setMode("manual");
          return;
        }
        toast.error(data?.message ?? "Le reformatage a échoué.");
        return;
      }
      setDraft(data.draft as RecipeDraft);
      setRawNote(note);
      setSource("ai");
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(d: RecipeDraft) {
    setDraft(d);
    setRawNote(null);
    setSource("manual");
  }

  async function handleSave() {
    if (!draft) return;
    if (!canSave) {
      toast.error("Supabase non configuré : impossible d'enregistrer.");
      return;
    }
    setSaving(true);
    try {
      await createRecipe(draft, rawNote, source);
      toast.success(`« ${draft.title} » ajoutée au carnet.`);
      setDraft(null);
      setNote("");
      onSaved();
    } catch {
      toast.error("L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-7 rounded-[22px] border border-border bg-card bg-[radial-gradient(120%_140%_at_100%_0%,rgba(94,92,230,0.07),transparent_55%),radial-gradient(120%_140%_at_0%_100%,rgba(10,132,255,0.06),transparent_50%)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-klarte-indigo px-3 py-1.5 text-xs font-semibold text-white shadow-[0_6px_16px_-8px_rgba(94,92,230,0.8)]">
          <Sparkles className="size-3.5" />
          IA
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight">
            Note libre → recette formatée
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Écris comme ça te vient. L&apos;IA range dans le bon template et la bonne catégorie.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "ai" ? "manual" : "ai"))}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground"
        >
          <PenLine className="size-3.5" />
          {mode === "ai" ? "Saisie manuelle" : "Mode IA"}
        </button>
      </div>

      {draft ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide">
            <span className="size-[7px] rounded-full bg-klarte-green shadow-[0_0_0_3px_rgba(48,209,88,0.18)]" />
            <span className="text-klarte-indigo">Aperçu</span>
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10.5px] text-muted-foreground">
              {draft.categoryName}
            </span>
          </div>
          <div className="p-4">
            <RecipeTemplate view={draftToView(draft)} />
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button onClick={handleSave} disabled={saving || !canSave}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Enregistrer
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                <X className="size-4" />
                Rejeter
              </Button>
              {!canSave && (
                <span className="text-xs text-muted-foreground">
                  Supabase non configuré — enregistrement indisponible.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : mode === "ai" ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder={
              "poulet curry coco pour 4\n2 blancs de poulet, une boîte de lait coco, oignon, ail, 2 cs de pâte de curry rouge…\nfaire revenir oignon ail, ajouter poulet, déglacer au lait coco, mijoter 20 min. riz à côté.\nenv 30 min, on adore"
            }
            className="w-full resize-y rounded-2xl border border-border bg-secondary/40 p-4 text-[13.5px] leading-relaxed text-foreground/80 placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div>
            <Button onClick={handleFormat} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {loading ? "Reformatage…" : "Reformater avec l'IA"}
            </Button>
          </div>
        </div>
      ) : (
        <ManualForm onSubmit={handleManualSubmit} />
      )}
    </section>
  );
}

/** Découpe une ligne d'ingrédient en {qty, unit, item} (best-effort). */
function parseIngredientLine(line: string): RecipeIngredient {
  const m = line.trim().match(/^([\d.,/]+)\s*([^\s\d][^\s]*)?\s+(.+)$/);
  if (m) {
    return { qty: m[1] ?? null, unit: m[2] ?? null, item: (m[3] ?? line).trim() };
  }
  return { qty: null, unit: null, item: line.trim() };
}

function ManualForm({ onSubmit }: { onSubmit: (d: RecipeDraft) => void }) {
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [servings, setServings] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [difficulty, setDifficulty] = useState<RecipeDraft["difficulty"]>("facile");
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  function submit() {
    if (title.trim().length < 1) {
      toast.error("Donne au moins un titre.");
      return;
    }
    const draft: RecipeDraft = {
      title: title.trim(),
      categoryName: categoryName.trim() || "Plats",
      servings: servings ? Number(servings) : null,
      timeMinutes: timeMinutes ? Number(timeMinutes) : null,
      difficulty,
      ingredients: ingredientsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map(parseIngredientLine),
      steps: stepsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    onSubmit(draft);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Titre">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Catégorie">
          <input
            className={inputCls}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            list="cat-suggestions"
            placeholder="Plats"
          />
          <datalist id="cat-suggestions">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Portions">
          <input
            type="number"
            min={1}
            className={inputCls}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </Field>
        <Field label="Temps (min)">
          <input
            type="number"
            min={1}
            className={inputCls}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Difficulté">
        <select
          className={inputCls}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as RecipeDraft["difficulty"])}
        >
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>
      </Field>
      <Field label="Ingrédients (un par ligne)">
        <textarea
          rows={4}
          className={inputCls}
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder={"2 blancs de poulet\n400 ml lait de coco\n1 oignon"}
        />
      </Field>
      <Field label="Préparation (une étape par ligne)">
        <textarea
          rows={4}
          className={inputCls}
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
        />
      </Field>
      <Field label="Tags (séparés par des virgules)">
        <input
          className={inputCls}
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="Plats, Asiatique, À refaire"
        />
      </Field>
      <div>
        <Button onClick={submit}>
          <PenLine className="size-4" />
          Prévisualiser
        </Button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[13.5px] text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
