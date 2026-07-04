import { redirect } from "next/navigation";

/** Racine : on entre directement sur le carnet de recettes (écran principal du Lot 1). */
export default function Home() {
  redirect("/recettes");
}
