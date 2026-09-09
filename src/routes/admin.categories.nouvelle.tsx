import { createFileRoute } from "@tanstack/react-router";
import { CategoryFormComponent } from "@/components/admin/CategoryForm";

export const Route = createFileRoute("/admin/categories/nouvelle")({
  head: () => ({
    meta: [
      { title: "Nouvelle catégorie — Administration" },
      {
        name: "description",
        content: "Créer une nouvelle catégorie de produits.",
      },
    ],
  }),
  component: () => <CategoryFormComponent />,
});
