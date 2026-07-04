import type { NextConfig } from "next";

/** Configuration Next.js 15 (App Router) — version web du dashboard Klarte Vie. */
const nextConfig: NextConfig = {
  // Sortie autonome : Next assemble un dossier `.next/standalone` (serveur + deps
  // minimales) copié tel quel dans l'image Docker — pas besoin d'embarquer tout node_modules.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Photos de recettes / avatars stockés sur Supabase Storage (plus tard).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
