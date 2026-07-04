import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { RecipesView } from "@/features/recipes/components/recipes-view";

export default function RecettesPage() {
  return (
    <>
      <PageHeader
        title="Mon carnet de recettes"
        subtitle="42 recettes · 5 catégories · dernière ajoutée il y a 2 jours"
        showSearch
        actions={
          <Button>
            <Plus className="size-4" />
            Nouvelle recette
          </Button>
        }
      />
      <RecipesView />
    </>
  );
}
