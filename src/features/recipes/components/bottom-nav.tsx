"use client";

import {
  Bookmark,
  CalendarDays,
  Plus,
  ShoppingCart,
  Tags,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type RecipeTab = "recettes" | "themes" | "courses" | "planning";

/** Barre de navigation basse du carnet (Recettes / Thèmes / + / Courses). */
export function BottomNav({
  tab,
  onTab,
  onAdd,
}: {
  tab: RecipeTab;
  onTab: (t: RecipeTab) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-md items-stretch px-2 pt-1.5"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        <TabBtn icon={Bookmark} label="Recettes" active={tab === "recettes"} onClick={() => onTab("recettes")} />
        <TabBtn icon={Tags} label="Catégories" active={tab === "themes"} onClick={() => onTab("themes")} />
        <div className="flex w-16 shrink-0 justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Ajouter une recette"
            className="-mt-6 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background active:scale-95"
          >
            <Plus className="size-7" />
          </button>
        </div>
        <TabBtn icon={ShoppingCart} label="Courses" active={tab === "courses"} onClick={() => onTab("courses")} />
        <TabBtn icon={CalendarDays} label="Planning" active={tab === "planning"} onClick={() => onTab("planning")} />
      </div>
    </nav>
  );
}

function TabBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-0.5 py-1"
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn("size-6", active ? "text-primary" : "text-muted-foreground")}
        strokeWidth={active ? 2.4 : 1.9}
      />
      <span className={cn("text-[11px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
