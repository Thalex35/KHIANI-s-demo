import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "@/components/site/AccountLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  ORDER_STATUSES,
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDateTime,
  formatPrice,
  type OrderStatus,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compte/commandes/$id")({
  head: () => ({
    meta: [
      { title: "Détail de la commande — MAISON NOVA" },
      {
        name: "description",
        content: "Détail complet de votre commande : articles, tailles, couleurs, livraison et total.",
      },
      { property: "og:title", content: "Détail de la commande — MAISON NOVA" },
      { property: "og:description", content: "Articles, livraison et suivi de votre commande." },
    ],
  }),
  component: OrderDetailPage,
});

type OrderDetail = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    name: string;
    image_url: string;
    size: string;
    color: string;
    unit_price: number;
    quantity: number;
  }[];
};

const TIMELINE: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== "annulee");

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["commande", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OrderDetail | null;
    },
  });

  if (isLoading) {
    return (
      <AccountLayout title="Détail de la commande">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <AccountLayout title="Détail de la commande">
        <EmptyState
          title="Commande introuvable"
          text="Cette commande n'existe pas ou ne vous appartient pas."
          action={
            <Button asChild>
              <Link to="/compte/commandes">Retour à mes commandes</Link>
            </Button>
          }
        />
      </AccountLayout>
    );
  }

  const stepIndex = TIMELINE.indexOf(order.status);

  return (
    <AccountLayout
      title={`Commande ${order.order_number}`}
      description={`Passée le ${formatDateTime(order.created_at)}`}
    >
      <div className="space-y-6">
        <section className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Suivi</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                STATUS_CLASSES[order.status],
              )}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          {order.status === "annulee" ? (
            <p className="mt-4 text-sm text-muted-foreground">Cette commande a été annulée.</p>
          ) : (
            <ol className="mt-5 grid gap-3 sm:grid-cols-5">
              {TIMELINE.map((step, i) => (
                <li key={step} className="flex items-center gap-2 sm:flex-col sm:text-center">
                  <span
                    className={cn(
                      "size-3 shrink-0 rounded-full",
                      i <= stepIndex ? "bg-accent" : "bg-border",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      i <= stepIndex ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="surface-card p-5">
          <h2 className="text-xl">Articles</h2>
          <ul className="mt-4 space-y-4">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="size-16 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Taille {item.size} · {item.color} · ×{item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(Number(item.unit_price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-accent">
                <dt>Réductions</dt>
                <dd>-{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Livraison</dt>
              <dd>{Number(order.shipping) === 0 ? "Offerte" : formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-xl">Livraison</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {order.full_name}
            <br />
            {order.address}
            <br />
            {order.city}, {order.country}
            <br />
            {order.phone}
          </p>
          {order.notes && <p className="mt-3 text-sm text-muted-foreground">Note : {order.notes}</p>}
        </section>
      </div>
    </AccountLayout>
  );
}
