import { redirect } from "next/navigation";

/**
 * L'app est désormais un carnet de recettes pur : la racine ouvre directement
 * le carnet (`/recettes`), l'expérience plein écran autonome. Plus de lanceur
 * ni de sections Trading / Sport.
 */
export default function Home() {
  redirect("/recettes");
}
