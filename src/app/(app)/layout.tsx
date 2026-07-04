import { AppShell } from "@/components/layout/app-shell";

/**
 * Layout des pages du dashboard.
 *
 * NOTE (Lot 1) : l'authentification Supabase n'est pas encore branchée ici, pour
 * que `pnpm dev` affiche l'app immédiatement sans configurer les clés. Le garde
 * de session (redirect vers /login) sera ajouté au lot Auth, sur le modèle du
 * mobile klarte-vie (createClient() serveur + supabase.auth.getUser()).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
