"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  addShopping,
  clearShopping,
  deleteShopping,
  fetchShopping,
  setShoppingChecked,
  type ShoppingItem,
} from "@/features/recipes/service";

/** Onglet Courses : liste de courses (ajout manuel + depuis les recettes). */
export function ShoppingView({ reloadKey }: { reloadKey: number }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await fetchShopping();
      setItems(items);
    } catch {
      toast.error("Chargement de la liste impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, reloadKey]);

  async function add() {
    const l = label.trim();
    if (!l) return;
    setLabel("");
    try {
      await addShopping([l]);
      void refresh();
    } catch {
      toast.error("Ajout impossible.");
    }
  }

  async function toggle(it: ShoppingItem) {
    const next = !it.checked;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, checked: next } : x)));
    try {
      await setShoppingChecked(it.id, next);
    } catch {
      toast.error("Action impossible.");
      void refresh();
    }
  }

  async function remove(it: ShoppingItem) {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    try {
      await deleteShopping(it.id);
    } catch {
      void refresh();
    }
  }

  async function clear(onlyChecked: boolean) {
    try {
      await clearShopping(onlyChecked);
      void refresh();
    } catch {
      toast.error("Action impossible.");
    }
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold tracking-tight">Courses</h1>

      <div className="mb-5 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ajouter un article…"
          className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={add}
          disabled={label.trim().length === 0}
          aria-label="Ajouter"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-[14px] text-muted-foreground">
          <ShoppingCart className="mx-auto mb-2 size-6 opacity-60" />
          Liste vide. Ajoute un article, ou « Ajouter aux courses » depuis une recette.
        </div>
      ) : (
        <>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggle(it)}
                  aria-label={it.checked ? "Décocher" : "Cocher"}
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    it.checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {it.checked && <Check className="size-3.5" strokeWidth={3} />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-[15px]",
                    it.checked && "text-muted-foreground line-through",
                  )}
                >
                  {it.label}
                </span>
                <button
                  type="button"
                  onClick={() => remove(it)}
                  aria-label="Retirer"
                  className="grid size-8 place-items-center rounded-full text-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={() => clear(true)}
                className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground/70 hover:text-foreground"
              >
                Retirer les {checkedCount} cochés
              </button>
            )}
            <button
              type="button"
              onClick={() => window.confirm("Vider toute la liste ?") && clear(false)}
              className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground/70 hover:text-destructive"
            >
              Tout vider
            </button>
          </div>
        </>
      )}
    </div>
  );
}
