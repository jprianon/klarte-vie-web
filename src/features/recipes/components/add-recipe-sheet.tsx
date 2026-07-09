"use client";

import { useEffect } from "react";
import { Camera, ChevronRight, Link2, Pencil, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Menu « Ajouter une recette » — feuille du bas avec les 4 points d'entrée :
 * photo (OCR), générateur IA, import d'une URL, saisie manuelle.
 */
export function AddRecipeSheet({
  open,
  onClose,
  onPhoto,
  onGenerate,
  onUrl,
  onManual,
}: {
  open: boolean;
  onClose: () => void;
  onPhoto: () => void;
  onGenerate: () => void;
  onUrl: () => void;
  onManual: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Ajouter une recette">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-in fade-in"
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-card pt-3 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mt-4 text-center font-display text-[22px] font-bold tracking-tight">
          Ajouter une recette
        </h2>

        <div className="mt-3 flex flex-col px-4 pb-1">
          <Option
            icon={Camera}
            tint="bg-honey/15 text-honey"
            title="Prendre une photo"
            subtitle="Photographiez une recette"
            onClick={() => {
              onClose();
              onPhoto();
            }}
          />
          <Option
            icon={Sparkles}
            tint="bg-primary/12 text-primary"
            title="Générateur de recette"
            subtitle="Laisse l'IA te générer ta recette"
            onClick={() => {
              onClose();
              onGenerate();
            }}
          />
          <Option
            icon={Link2}
            tint="bg-klarte-blue/12 text-klarte-blue"
            title="Coller une URL"
            subtitle="Importez depuis un lien"
            onClick={() => {
              onClose();
              onUrl();
            }}
          />
          <Option
            icon={Pencil}
            tint="bg-klarte-violet/12 text-klarte-violet"
            title="Créer manuellement"
            subtitle="Rédigez votre propre recette"
            onClick={() => {
              onClose();
              onManual();
            }}
            last
          />
        </div>
      </div>
    </div>
  );
}

function Option({
  icon: Icon,
  tint,
  title,
  subtitle,
  onClick,
  last = false,
}: {
  icon: LucideIcon;
  tint: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 py-4 text-left active:bg-secondary/40",
        !last && "border-b border-border/70",
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tint)}>
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold tracking-tight">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
    </button>
  );
}
