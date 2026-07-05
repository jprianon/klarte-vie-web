"use client";

import { useEffect, useState } from "react";
import { Check, FolderClosed, Loader2, Plus, X } from "lucide-react";

import { toast } from "sonner";
import {
  addRecipeToFolder,
  createFolder,
  fetchRecipeFolderIds,
  removeRecipeFromFolder,
  type FolderSummary,
  type RecipeView,
} from "@/features/recipes/service";

/** Feuille modale : ranger une recette dans un / plusieurs dossiers. */
export function FolderPicker({
  recipe,
  folders,
  onClose,
  onChanged,
}: {
  recipe: RecipeView;
  folders: FolderSummary[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [localFolders, setLocalFolders] = useState<FolderSummary[]>(folders);

  useEffect(() => {
    let active = true;
    if (!recipe.id) {
      setLoading(false);
      return;
    }
    fetchRecipeFolderIds(recipe.id)
      .then((f) => {
        if (active) {
          setIds(new Set(f));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recipe.id]);

  async function toggle(folderId: string) {
    if (!recipe.id) return;
    const has = ids.has(folderId);
    setIds((prev) => {
      const n = new Set(prev);
      if (has) n.delete(folderId);
      else n.add(folderId);
      return n;
    });
    try {
      if (has) await removeRecipeFromFolder(folderId, recipe.id);
      else await addRecipeToFolder(folderId, recipe.id);
      onChanged();
    } catch {
      toast.error("Action impossible.");
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name || !recipe.id) return;
    setBusy(true);
    try {
      const folder = await createFolder(name);
      await addRecipeToFolder(folder.id, recipe.id);
      setLocalFolders((f) => [folder, ...f]);
      setIds((prev) => new Set(prev).add(folder.id));
      setNewName("");
      onChanged();
      toast.success(`Ajoutée à « ${name} ».`);
    } catch {
      toast.error("Création du dossier impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sticky top-0 flex items-center gap-2 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur">
          <h2 className="font-display text-lg font-bold tracking-tight">Ranger dans…</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-auto grid size-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nouveau dossier…"
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || newName.trim().length === 0}
              aria-label="Créer le dossier"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-5" />}
            </button>
          </div>

          {loading ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : localFolders.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              Aucun dossier. Crée-en un ci-dessus.
            </p>
          ) : (
            <ul className="flex flex-col">
              {localFolders.map((f) => {
                const checked = ids.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => toggle(f.id)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <span
                        className={
                          checked
                            ? "grid size-6 shrink-0 place-items-center rounded-md border-2 border-primary bg-primary text-primary-foreground"
                            : "grid size-6 shrink-0 place-items-center rounded-md border-2 border-border"
                        }
                      >
                        {checked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <FolderClosed className="size-4 text-muted-foreground" />
                      <span className="text-[15px]">{f.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
