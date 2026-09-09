import { createFileRoute } from "@tanstack/react-router";
import { CouponFormComponent } from "@/components/admin/CouponForm";

export const Route = createFileRoute("/admin/coupons/nouveau")({
  head: () => ({
    meta: [
      { title: "Ajouter un coupon — Administration" },
      {
        name: "description",
        content: "Créez un nouveau code de réduction.",
      },
      { property: "og:title", content: "Ajouter un coupon — Administration" },
    ],
  }),
  component: CreateCoupon,
});

function CreateCoupon() {
  return <CouponFormComponent />;
}
