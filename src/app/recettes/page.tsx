import { RecipesView } from "@/features/recipes/components/recipes-view";

/**
 * Le carnet de recettes est une expérience « plein écran » à part entière :
 * placé hors du groupe (app), il n'hérite pas de la coque du dashboard (rail /
 * nav du haut). La navigation se fait par sa barre basse + un bouton Accueil.
 */
export default function RecettesPage() {
  return <RecipesView />;
}
