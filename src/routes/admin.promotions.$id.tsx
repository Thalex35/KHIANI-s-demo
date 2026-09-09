import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/site/EmptyState";
import { PromotionFormComponent, type Promotion } from "@/components/admin/PromotionForm";
import { supabase } from "@/integrations/supabase/client";

const promotionQuery = (id: string) => ({
  queryKey: ["promotion", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Promotion;
  },
});

export const Route = createFileRoute("/admin/promotions/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Modifier une promotion — Administration` },
      {
        name: "description",
        content: "Modifiez les détails de la promotion.",
      },
    ],
  }),
  component: EditPromotion,
});

function EditPromotion() {
  const { id } = Route.useParams();
  const { data: promotion, isLoading } = useQuery(promotionQuery(id));

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!promotion) {
    return (
      <div className="p-8">
        <EmptyState
          title="Promotion introuvable"
          text="La promotion n'existe pas."
        />
      </div>
    );
  }

  return <PromotionFormComponent promotion={promotion} />;
}
