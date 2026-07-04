import Link from "next/link";
import {
  ChevronRight,
  Dumbbell,
  NotebookText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * Écran d'accueil (lanceur). Pensé pour l'iPhone (PWA installée) : trois grandes
 * tuiles tapables — Trading, Recettes, Sport — qui mènent chacune dans sa section.
 * Pas de rail ici : c'est le hub d'entrée, plein écran. On revient dessus via le
 * logo « Klarte » présent dans la navigation des sections.
 */

/** URL de l'app Klartè Trade (conteneur séparé), inlinée au build. Cf. rail.tsx. */
const TRADE_URL = process.env.NEXT_PUBLIC_TRADE_URL ?? "http://localhost:3002";

interface Tile {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: [string, string];
  /** Ouvre dans un nouvel onglet (app externe : Klartè Trade). */
  external?: boolean;
}

const TILES: Tile[] = [
  {
    href: TRADE_URL,
    label: "Trading",
    description: "Journal de trades et performance du portefeuille",
    icon: TrendingUp,
    gradient: ["#30d158", "#0a84ff"],
    external: true,
  },
  {
    href: "/recettes",
    label: "Recettes",
    description: "Ton carnet de recettes, reformaté par l'IA",
    icon: NotebookText,
    gradient: ["#0a84ff", "#5e5ce6"],
  },
  {
    href: "/sport",
    label: "Sport",
    description: "Tes séances et ta régularité, semaine après semaine",
    icon: Dumbbell,
    gradient: ["#ff9f0a", "#ff2d55"],
  },
];

export default function Home() {
  return (
    <main
      className="flex min-h-dvh w-full flex-col bg-gradient-to-b from-background to-secondary/50"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <header className="animate-fade-in pb-8 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-br from-[#4aa3ff] via-primary to-klarte-indigo shadow-[0_6px_16px_-6px_rgba(10,132,255,0.6)]">
              <LeafMark />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Klarte</span>
          </div>
          <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight">
            Bonjour, Jérémy
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Où veux-tu aller ?</p>
        </header>

        <div className="flex flex-col gap-3.5">
          {TILES.map((tile, i) => (
            <TileLink
              key={tile.label}
              tile={tile}
              className="group flex animate-fade-in items-center gap-4 rounded-[26px] border border-border bg-card p-4 shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-border active:translate-y-0 active:scale-[0.99]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className="grid size-14 shrink-0 place-items-center rounded-[18px] text-white shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${tile.gradient[0]}, ${tile.gradient[1]})`,
                }}
              >
                <tile.icon className="size-7" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold tracking-tight">{tile.label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                  {tile.description}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
            </TileLink>
          ))}
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          Klarte Vie · pilotage de vie
        </p>
      </div>
    </main>
  );
}

/**
 * Rend une tuile : `Link` Next pour une route interne, ancre `target="_blank"`
 * pour l'app externe (Klartè Trade dans un nouvel onglet).
 */
function TileLink({
  tile,
  className,
  style,
  children,
}: {
  tile: Tile;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (tile.external) {
    return (
      <a
        href={tile.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={tile.href} className={className} style={style}>
      {children}
    </Link>
  );
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden="true">
      <path d="M4 12c4 0 4-7 8-7s4 7 8 7-4 7-8 7-4-7-8-7z" fill="#fff" opacity="0.95" />
    </svg>
  );
}
