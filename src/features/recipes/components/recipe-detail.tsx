"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Clock,
  Flame,
  Heart,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RecipeDraft } from "@/types";
import {
  deleteRecipeImage,
  recipeImageUrl,
  uploadRecipeImage,
  viewToDraft,
  type RecipeView,
} from "@/features/recipes/service";
import { RecipeForm } from "./recipe-form";

/**
 * Écran « Recette détaillée » — plein écran, image en héro, carte arrondie,
 * ingrédients à cocher avec portions réglables, étapes numérotées, nutrition.
 */
export function RecipeDetail({
  view,
  gradient,
  canEdit,
  onClose,
  onToggleFavorite,
  onDelete,
  onSaveEdit,
  onImageChanged,
  onAddToShopping,
}: {
  view: RecipeView;
  gradient: [string, string];
  canEdit: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onSaveEdit: (draft: RecipeDraft) => Promise<void>;
  onImageChanged: (hasImage: boolean) => void;
  onAddToShopping: (labels: string[]) => void;
}) {
  const base = view.servings;
  const [servings, setServings] = useState(base ?? 4);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasImage, setHasImage] = useState(view.hasImage);
  const [imgV, setImgV] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleEditSubmit(draft: RecipeDraft) {
    setSaving(true);
    try {
      await onSaveEdit(draft);
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !view.id) return;
    setUploading(true);
    try {
      const blob = await resizeImage(file).catch(() => file);
      await uploadRecipeImage(view.id, blob);
      setHasImage(true);
      setImgError(false);
      setImgV((v) => v + 1);
      onImageChanged(true);
      toast.success("Photo ajoutée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi de la photo impossible.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!view.id) return;
    try {
      await deleteRecipeImage(view.id);
      setHasImage(false);
      onImageChanged(false);
      toast.success("Photo supprimée.");
    } catch {
      toast.error("Suppression de la photo impossible.");
    }
  }

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div
          className="flex items-center gap-3 border-b border-border px-5 pb-4"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Annuler"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
          <h1 className="font-display text-xl font-bold tracking-tight">Modifier la recette</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5">
          <div className="mx-auto w-full max-w-2xl">
            <RecipeForm
              initial={viewToDraft(view)}
              submitLabel="Enregistrer"
              submitting={saving}
              onSubmit={handleEditSubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  const factor = base && base > 0 ? servings / base : 1;

  const times = [
    { label: "Prépa", value: view.prepMinutes },
    { label: "Repos", value: view.restMinutes },
    { label: "Cuisson", value: view.cookMinutes },
  ].filter((t) => t.value != null);

  const hasNutrition =
    view.kcal != null || view.carbsG != null || view.proteinG != null || view.fatG != null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Héro */}
      <div
        className="relative h-52 shrink-0 overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        {hasImage && !imgError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipeImageUrl(view.id, imgV)}
            alt={view.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-4"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Retour"
            className="grid size-11 place-items-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
          {view.categoryName && (
            <span className="rounded-full bg-black/25 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
              {view.categoryName}
            </span>
          )}
        </div>
        {canEdit && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {hasImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Supprimer la photo"
                className="grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur active:scale-95"
              >
                <Trash2 className="size-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label={hasImage ? "Remplacer la photo" : "Ajouter une photo"}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2.5 text-[13px] font-semibold text-foreground shadow-sm backdrop-blur active:scale-95 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {hasImage ? "Remplacer" : "Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePickImage}
            />
          </div>
        )}
      </div>

      {/* Carte de contenu qui chevauche l'image */}
      <div className="-mt-7 flex-1 overflow-y-auto rounded-t-[28px] bg-card px-5 pb-24 pt-9">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-start gap-3">
            <h1 className="flex-1 font-display text-[26px] font-bold leading-[1.15] tracking-tight">
              {view.title}
            </h1>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Modifier"
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-foreground active:scale-95"
                >
                  <Pencil className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-label={view.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95"
                >
                  <Heart className={cn("size-6", view.isFavorite && "fill-current")} />
                </button>
              </>
            )}
          </div>

          {/* Pills temps + difficulté */}
          <div className="mt-4 flex flex-wrap gap-2.5">
            {times.length > 0
              ? times.map((t) => (
                  <Pill key={t.label} icon={<Clock className="size-4" />}>
                    {t.label} {t.value} min
                  </Pill>
                ))
              : view.totalMinutes != null && (
                  <Pill icon={<Clock className="size-4" />}>{view.totalMinutes} min</Pill>
                )}
            {view.difficulty && (
              <Pill icon={<Zap className="size-4" />}>
                <span className="capitalize">{view.difficulty}</span>
              </Pill>
            )}
          </div>

          {/* Ingrédients */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-6">
            <h2 className="font-display text-[20px] font-semibold tracking-tight">Ingrédients</h2>
            <div className="flex items-center gap-2">
              {view.ingredients.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onAddToShopping(
                      view.ingredients.map((ing) =>
                        [scaleQty(ing.qty, factor), ing.unit, ing.item].filter(Boolean).join(" "),
                      ),
                    )
                  }
                  aria-label="Ajouter aux courses"
                  className="grid size-9 place-items-center rounded-full bg-secondary text-foreground/70 hover:text-foreground"
                >
                  <ShoppingCart className="size-[18px]" />
                </button>
              )}
              {base != null && (
                <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  aria-label="Moins de portions"
                  className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-background"
                >
                  <Minus className="size-4" />
                </button>
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold tabular-nums">
                  <Users className="size-4 text-muted-foreground" />
                  {servings}
                </span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  aria-label="Plus de portions"
                  className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-background"
                >
                  <Plus className="size-4" />
                </button>
                </div>
              )}
            </div>
          </div>

          {view.ingredients.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted-foreground/70">Aucun ingrédient.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {view.ingredients.map((ing, i) => {
                const isChecked = checked.has(i);
                const qty = scaleQty(ing.qty, factor);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        setChecked((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        })
                      }
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                          isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {isChecked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={cn("text-[15px]", isChecked && "text-muted-foreground line-through")}>
                        {(qty || ing.unit) && (
                          <span className="font-semibold">
                            {[qty, ing.unit].filter(Boolean).join(" ")}{" "}
                          </span>
                        )}
                        {ing.item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Instructions */}
          <h2 className="mt-7 border-t border-border pt-6 font-display text-[20px] font-semibold tracking-tight">
            Instructions
          </h2>
          {view.steps.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted-foreground/70">Aucune étape.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-4">
              {view.steps.map((step, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-[15px] leading-relaxed text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Nutrition */}
          {hasNutrition && (
            <div className="mt-7 rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Flame className="size-3.5" />
                Nutrition (recette entière)
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Macro label="Énergie" value={view.kcal} unit="kcal" />
                <Macro label="Glucides" value={view.carbsG} unit="g" />
                <Macro label="Protéines" value={view.proteinG} unit="g" />
                <Macro label="Lipides" value={view.fatG} unit="g" />
              </div>
            </div>
          )}

          {/* Tags */}
          {view.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {view.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-primary/[0.08] px-2.5 py-1 text-[12px] font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Supprimer la recette
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Réduit une image (max ~1280px, JPEG) côté navigateur avant l'envoi. */
async function resizeImage(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", quality),
  );
}

/** Multiplie une quantité numérique par le facteur de portions (best-effort). */
function scaleQty(qty: string | null, factor: number): string | null {
  if (!qty || factor === 1) return qty;
  const m = qty.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return qty;
  const n = parseFloat(m[1]!.replace(",", ".")) * factor;
  const rounded = Math.round(n * 100) / 100;
  const num = (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "")).replace(
    ".",
    ",",
  );
  return `${num}${m[2]}`;
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground">
      {icon}
      {children}
    </span>
  );
}

function Macro({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div>
      <div className="text-[16px] font-bold tabular-nums tracking-tight">
        {value != null ? value : "—"}
        {value != null && (
          <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
