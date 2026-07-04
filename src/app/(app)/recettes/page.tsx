import { PageHeader } from "@/components/layout/page-header";
import { RecipesView } from "@/features/recipes/components/recipes-view";

export default function RecettesPage() {
  return (
    <>
      <PageHeader
        title="Mon carnet de recettes"
        subtitle="Écris une note, l'IA la range dans le même template pour toutes tes recettes."
      />
      <RecipesView />
    </>
  );
}
