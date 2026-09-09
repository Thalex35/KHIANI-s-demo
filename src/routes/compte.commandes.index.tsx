import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "@/components/site/AccountLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_CLASSES, STATUS_LABELS, formatDate, formatPrice, type OrderStatus } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compte/commandes/")({
  head: () => ({
    meta: [
      { title: "Mes commandes — MAISON NOVA" },
      {
        name: "description",
        content: "Suivez l'état de vos commandes MAISON NOVA : préparation, expédition et livraison.",
      },
      { property: "og:title", content: "Mes commandes — MAISON NOVA" },
      { property: "og:description", content: "Historique et suivi de vos commandes." },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: { id: string; name: string; size: string; color: string; quantity: number }[];
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["mes-commandes-detail", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, order_items(id, name, size, color, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  return (
    <AccountLayout title="Mes commandes" description="Historique complet et suivi de vos achats.">
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Aucune commande"
          text="Vos futures commandes apparaîtront ici avec leur statut de livraison."
          action={
            <Button asChild>
              <Link to="/boutique">Découvrir la collection</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="surface-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    STATUS_CLASSES[order.status],
                  )}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {order.order_items.slice(0, 3).map((item) => (
                  <li key={item.id} className="truncate">
                    {item.name} — {item.size} / {item.color} × {item.quantity}
                  </li>
                ))}
                {order.order_items.length > 3 && (
                  <li>+ {order.order_items.length - 3} autre(s) article(s)</li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/compte/commandes/$id" params={{ id: order.id }}>
                    Voir le détail
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
