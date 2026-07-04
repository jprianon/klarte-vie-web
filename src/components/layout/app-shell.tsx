import { MobileNav, Rail } from "./rail";

/**
 * Enveloppe des pages du dashboard : rail latéral (desktop) + navigation
 * horizontale (mobile), et zone de contenu scrollable pleine hauteur.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
