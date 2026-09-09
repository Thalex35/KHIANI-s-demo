import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Package, ShoppingBag } from "lucide-react";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_CLASSES, STATUS_LABELS, formatDate, formatPrice, type OrderStatus } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compte/")({
  head: () => ({
    meta: [
      { title: "Mon compte — MAISON NOVA" },
      {
        name: "description",
        content: "Retrouvez vos commandes, vos favoris et vos informations personnelles.",
      },
      { property: "og:title", content: "Mon compte — MAISON NOVA" },
      { property: "og:description", content: "Votre espace client MAISON NOVA." },
    ],
  }),
  component: AccountHome,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

function AccountHome() {
  const { user, profile } = useAuth();
  const { favorites } = useFavorites();

  const { data: orders = [] } = useQuery({
    queryKey: ["mes-commandes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const spent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const cards = [
    { label: "Commandes", value: String(orders.length), icon: Package },
    { label: "Favoris", value: String(favorites.length), icon: Heart },
    { label: "Total dépensé", value: formatPrice(spent), icon: ShoppingBag },
  ];

  return (
    <AccountLayout
      title={`Bonjour ${profile?.first_name ?? ""}`.trim()}
      description="Voici un aperçu de votre activité sur la boutique."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-card p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-muted-foreground">{label}</p>
              <Icon className="size-4 text-accent" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="surface-card mt-8 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">Dernières commandes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/compte/commandes">Tout voir</Link>
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Vous n'avez pas encore passé de commande.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link
                    to="/compte/commandes/$id"
                    params={{ id: order.id }}
                    className="font-medium hover:text-accent"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_CLASSES[order.status],
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}
