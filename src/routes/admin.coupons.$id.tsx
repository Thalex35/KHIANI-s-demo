import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/site/EmptyState";
import { CouponFormComponent, type Coupon } from "@/components/admin/CouponForm";
import { supabase } from "@/integrations/supabase/client";

const couponQuery = (id: string) => ({
  queryKey: ["coupon", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Coupon;
  },
});

export const Route = createFileRoute("/admin/coupons/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Modifier un coupon — Administration` },
      {
        name: "description",
        content: "Modifiez les détails du coupon.",
      },
    ],
  }),
  component: EditCoupon,
});

function EditCoupon() {
  const { id } = Route.useParams();
  const { data: coupon, isLoading } = useQuery(couponQuery(id));

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!coupon) {
    return (
      <div className="p-8">
        <EmptyState
          title="Coupon introuvable"
          text="Le coupon n'existe pas."
        />
      </div>
    );
  }

  return <CouponFormComponent coupon={coupon} />;
}
