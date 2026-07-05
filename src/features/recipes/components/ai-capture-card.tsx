"use client";

import { useState } from "react";
import { Loader2, PenLine, Save, Sparkles, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RecipeDraft } from "@/types";
import { createRecipe, draftToView } from "@/features/recipes/service";
import { RecipeForm } from "./recipe-form";
import { RecipeTemplate } from "./recipe-template";

/**
 * Carte « note libre → recette formatée » — le geste signature du carnet.
 * - Mode IA : la note part vers /api/recipes/format et revient dans le template.
 * - Mode manuel : le formulaire réutilisable (RecipeForm) produit le même draft.
 * Dans les deux cas : aperçu par le MÊME template, puis enregistrement.
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
      toast.error("Base non configurée : impossible d'enregistrer.");
      return;
    }
    setSaving(true);
    try {
      await createRecipe(draft, rawNote, source);
      toast.success(`« ${draft.title} » ajoutée au carnet.`);
      setDraft(null);
      setNote("");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <Sparkles className="size-3.5" />
          IA
        </span>
        <p className="hidden text-[13px] text-muted-foreground sm:block">Écris comme ça te vient.</p>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "ai" ? "manual" : "ai"))}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground"
        >
          <PenLine className="size-3.5" />
          {mode === "ai" ? "Manuel" : "IA"}
        </button>
      </div>

      {draft ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide">
            <span className="size-[7px] rounded-full bg-primary" />
            <span className="text-primary">Aperçu</span>
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
                  Base non configurée — enregistrement indisponible.
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
        <RecipeForm submitLabel="Prévisualiser" onSubmit={handleManualSubmit} />
      )}
    </section>
  );
}
