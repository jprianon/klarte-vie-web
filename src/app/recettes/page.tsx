import type { Metadata } from "next";

import { RecipesView } from "@/features/recipes/components/recipes-view";

/**
 * Le carnet de recettes est une expérience « plein écran » à part entière :
 * placé hors du groupe (app), il n'hérite pas de la coque du dashboard (rail /
 * nav du haut). La navigation se fait par sa barre basse + un bouton Accueil.
 */

// Métadonnées propres à cette page : si on l'ajoute à l'écran d'accueil iOS
// (Safari → « Sur l'écran d'accueil »), le raccourci est libellé « Recettes »
// et ouvre directement le carnet.
export const metadata: Metadata = {
  title: "Recettes",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Recettes" },
};

export default function RecettesPage() {
  return <RecipesView />;
}
