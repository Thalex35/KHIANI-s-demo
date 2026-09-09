import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPrice } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/commande-confirmee/$id")({
  head: () => ({
    meta: [
      { title: "Commande confirmée — MAISON NOVA" },
      { name: "description", content: "Votre commande de démonstration a bien été enregistrée." },
    ],
  }),
  component: ConfirmationPage,
});

type Confirmation = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  full_name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  estimated_delivery: string | null;
  created_at: string;
  order_items: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    size: string;
    color: string;
  }[];
};

function ConfirmationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: order, isLoading } = useQuery({
    queryKey: ["commande-confirmee", id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Confirmation | null;
    },
  });

  if (loading || isLoading) {
    return (
      <AccountLayout title="Commande confirmée">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </AccountLayout>
    );
  }

  if (!user) {
    void navigate({ to: "/connexion" });
    return null;
  }

  if (!order) {
    return (
      <AccountLayout title="Commande introuvable">
        <EmptyState
          title="Commande introuvable"
          text="Cette confirmation n'est plus disponible."
          action={
            <Button asChild>
              <Link to="/boutique">Retour à la boutique</Link>
            </Button>
          }
        />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="Commande confirmée" description={`Commande ${order.order_number}`}>
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="surface-card p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h2 className="mt-4 text-3xl">Merci pour votre commande</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre paiement de démonstration a été accepté et votre commande est enregistrée.
          </p>
          <p className="mt-4 font-medium">{order.order_number}</p>
          <p className="text-xs text-muted-foreground">Passée le {formatDate(order.created_at)}</p>
        </section>
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-accent" />
            <h2 className="text-xl">Livraison</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {order.full_name}
            <br />
            {order.address}
            <br />
            {order.city}, {order.country}
          </p>
          <p className="mt-3 text-sm">
            Livraison estimée : <strong>{order.estimated_delivery ?? "2 à 5 jours ouvrés"}</strong>
          </p>
        </section>
        <section className="surface-card p-5">
          <h2 className="text-xl">Résumé de la commande</h2>
          <ul className="mt-4 space-y-3">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.name} · {item.size} / {item.color} × {item.quantity}
                </span>
                <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/compte/commandes/$id" params={{ id: order.id }}>
              Voir ma commande
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/boutique">
              <ShoppingBag className="mr-2 size-4" />
              Continuer mes achats
            </Link>
          </Button>
        </div>
      </div>
    </AccountLayout>
  );
}
