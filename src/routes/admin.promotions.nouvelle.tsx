import { createFileRoute } from "@tanstack/react-router";
import { PromotionFormComponent } from "@/components/admin/PromotionForm";

export const Route = createFileRoute("/admin/promotions/nouvelle")({
  head: () => ({
    meta: [
      { title: "Ajouter une promotion — Administration" },
      {
        name: "description",
        content: "Créez une nouvelle promotion.",
      },
      { property: "og:title", content: "Ajouter une promotion — Administration" },
    ],
  }),
  component: CreatePromotion,
});

function CreatePromotion() {
  return <PromotionFormComponent />;
}
