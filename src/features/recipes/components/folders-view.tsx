"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, FolderClosed, Loader2, Plus, Trash2 } from "lucide-react";

import { toast } from "sonner";
import {
  createFolder,
  deleteFolder,
  fetchFolderRecipes,
  fetchFolders,
  recipeToView,
  type FolderSummary,
  type RecipeView,
} from "@/features/recipes/service";
import { RecipeRow } from "./recipe-row";

/** Onglet Dossiers : lister/créer/supprimer des dossiers et voir leur contenu. */
export function FoldersView({
  canEdit,
  reloadKey,
  onOpenRecipe,
  onToggleFavorite,
  onDeleteRecipe,
  onAddToFolder,
}: {
  canEdit: boolean;
  reloadKey: number;
  onOpenRecipe: (v: RecipeView) => void;
  onToggleFavorite: (v: RecipeView) => void;
  onDeleteRecipe: (v: RecipeView) => void;
  onAddToFolder: (v: RecipeView) => void;
}) {
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState<FolderSummary | null>(null);
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { folders } = await fetchFolders();
      setFolders(folders);
    } catch {
      toast.error("Chargement des dossiers impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, reloadKey]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingRecipes(true);
    fetchFolderRecipes(open.id)
      .then((rows) => {
        if (active) {
          setRecipes(rows.map(recipeToView));
          setLoadingRecipes(false);
        }
      })
      .catch(() => {
        if (active) {
          setRecipes([]);
          setLoadingRecipes(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open, reloadKey]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createFolder(name);
      setNewName("");
      void refresh();
    } catch {
      toast.error("Création du dossier impossible.");
    }
  }

  async function handleDeleteFolder(f: FolderSummary) {
    if (!window.confirm(`Supprimer le dossier « ${f.name} » ? (les recettes ne sont pas supprimées)`)) return;
    try {
      await deleteFolder(f.id);
      if (open?.id === f.id) setOpen(null);
      void refresh();
      toast.success("Dossier supprimé.");
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  // ── Contenu d'un dossier ────────────────────────────────────────────────
  if (open) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Retour"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
          <h1 className="font-display text-xl font-bold tracking-tight">{open.name}</h1>
          {canEdit && (
            <button
              type="button"
              onClick={() => handleDeleteFolder(open)}
              aria-label="Supprimer le dossier"
              className="ml-auto grid size-9 place-items-center rounded-full text-foreground/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-[18px]" />
            </button>
          )}
        </div>

        {loadingRecipes ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-[14px] text-muted-foreground">
            Dossier vide. Range des recettes ici via l&apos;icône dossier.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {recipes.map((r) => (
              <RecipeRow
                key={r.id}
                recipe={r}
                canEdit={canEdit}
                onOpen={() => onOpenRecipe(r)}
                onToggleFavorite={() => onToggleFavorite(r)}
                onDelete={() => onDeleteRecipe(r)}
                onAddToFolder={() => onAddToFolder(r)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Liste des dossiers ──────────────────────────────────────────────────
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold tracking-tight">Dossiers</h1>

      {canEdit && (
        <div className="mb-5 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nouveau dossier…"
            className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={newName.trim().length === 0}
            aria-label="Créer"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : folders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-[14px] text-muted-foreground">
          Aucun dossier pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOpen(f)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                <FolderClosed className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px] font-semibold tracking-tight">{f.name}</span>
                <span className="text-[12.5px] text-muted-foreground">
                  {f.count} recette{f.count > 1 ? "s" : ""}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
