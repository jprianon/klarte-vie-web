"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Heart,
  NotebookText,
  TimerReset,
  TrendingUp,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  /** Ouvre dans un nouvel onglet (app externe, ex. Klartè Trade). */
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * URL de l'app Klartè Trade (conteneur séparé). Inlinée au build via la variable
 * publique `NEXT_PUBLIC_TRADE_URL` ; en local, retombe sur le port du dev server.
 */
const TRADE_URL = process.env.NEXT_PUBLIC_TRADE_URL ?? "http://localhost:3002";

const GROUPS: NavGroup[] = [
  {
    label: "Tableau de bord",
    items: [
      { href: "/today", label: "Aujourd'hui", icon: CalendarCheck },
      { href: "/recettes", label: "Recettes", icon: NotebookText, count: 42 },
      { href: TRADE_URL, label: "Trading", icon: TrendingUp, external: true },
      { href: "/sport", label: "Sport", icon: Dumbbell },
    ],
  },
  {
    label: "Personnel",
    items: [
      { href: "/bien-etre", label: "Bien-être", icon: Heart },
      { href: "/habitudes", label: "Habitudes", icon: TimerReset },
    ],
  },
];

/**
 * Rail de navigation latéral (web). Fixe sur grand écran, masqué sous `lg`
 * où la navigation passe en barre horizontale (voir MobileNav).
 */
export function Rail() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col gap-7 border-r border-border bg-gradient-to-b from-background to-secondary/60 px-4 py-5 lg:flex">
      <Brand />

      <nav className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                !item.external &&
                (pathname === item.href || pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <ItemLink
                  key={item.href}
                  item={item}
                  active={active}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-card text-primary shadow-sm ring-1 ring-border"
                      : "text-foreground/70 hover:bg-primary/[0.06] hover:text-foreground",
                  )}
                >
                  <Icon className="size-[19px]" strokeWidth={active ? 2.3 : 1.9} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {item.count}
                    </span>
                  )}
                </ItemLink>
              );
            })}
          </div>
        ))}
      </nav>

      <ProfileCard className="mt-auto" />
    </aside>
  );
}

/** Barre de navigation horizontale affichée sous `lg` (tablette / mobile). */
export function MobileNav() {
  const pathname = usePathname();
  const items = GROUPS.flatMap((g) => g.items);

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Brand compact />
      <nav className="ml-2 flex items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const active =
            !item.external &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <ItemLink
              key={item.href}
              item={item}
              active={active}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={active ? 2.3 : 1.9} />
              {item.label}
            </ItemLink>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Rend un élément de nav : `Link` Next pour les routes internes, ancre
 * `target="_blank"` pour les apps externes (ex. Klartè Trade dans un nouvel onglet).
 */
function ItemLink({
  item,
  active,
  className,
  children,
}: {
  item: NavItem;
  active: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/today" className="flex items-center gap-2.5 px-2">
      <span className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-br from-[#4aa3ff] via-primary to-klarte-indigo shadow-[0_6px_16px_-6px_rgba(10,132,255,0.6)]">
        <LeafMark />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">Klarte</span>
          <span className="block text-[11px] text-muted-foreground">Pilotage de vie</span>
        </span>
      )}
    </Link>
  );
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden="true">
      <path
        d="M4 12c4 0 4-7 8-7s4 7 8 7-4 7-8 7-4-7-8-7z"
        fill="#fff"
        opacity="0.95"
      />
    </svg>
  );
}

function ProfileCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2",
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ffb35e] to-klarte-pink text-[13px] font-semibold text-white">
        JP
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold">Jérémy</span>
        <span className="block text-[11px] text-muted-foreground">Plan perso</span>
      </span>
    </div>
  );
}
