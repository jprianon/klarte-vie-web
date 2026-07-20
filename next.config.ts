import type { NextConfig } from "next";

/** Configuration Next.js 15 (App Router) — version web du dashboard Klarte Vie. */
const nextConfig: NextConfig = {
  // Sortie autonome : Next assemble un dossier `.next/standalone` (serveur + deps
  // minimales) copié tel quel dans l'image Docker — pas besoin d'embarquer tout node_modules.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Le driver Postgres reste externe au bundle serveur (copié tel quel dans le
  // standalone) — pratique standard pour les drivers de base de données.
  serverExternalPackages: ["pg", "sharp"],
  images: {
    remotePatterns: [
      // Photos de recettes / avatars stockés sur Supabase Storage (plus tard).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Le programme de reprise futsal est une page statique posée dans `public/`.
  // Next ne résout pas les index de dossier dans `public/`, d'où la réécriture
  // explicite pour offrir une URL propre : /futsal
  async rewrites() {
    return [{ source: "/futsal", destination: "/klarte-futsall/index.html" }];
  },
};

export default nextConfig;
