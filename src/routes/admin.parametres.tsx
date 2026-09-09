import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Separator } from "@/components/ui/separator";
import { productsQuery } from "@/lib/catalog";
import { adminOrdersQuery, adminProfilesQuery } from "@/lib/admin";
import { PAYMENT_METHODS } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Informations de la boutique, moyens de paiement et règles de livraison.",
      },
      { property: "og:title", content: "Paramètres — Administration MAISON NOVA" },
      { property: "og:description", content: "Boutique, paiement et livraison." },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { profile } = useAuth();
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: orders = [] } = useQuery(adminOrdersQuery());
  const { data: profiles = [] } = useQuery(adminProfilesQuery());

  return (
    <AdminLayout title="Paramètres" description="Configuration de la boutique de démonstration.">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-lg">Boutique</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Nom", "MAISON NOVA"],
              ["Devise", "Euro (€)"],
              ["Langue", "Français"],
              ["E-mail de contact", "bonjour@maisonnova.fr"],
              ["Téléphone", "+33 1 23 45 67 89"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">Livraison</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Frais de livraison", "5,90 €"],
              ["Livraison offerte à partir de", "80 €"],
              ["Délai d'expédition", "48 heures ouvrées"],
              ["Retours", "30 jours, gratuits"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">Moyens de paiement</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {PAYMENT_METHODS.map((method) => (
              <li key={method.id} className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <span>{method.label}</span>
                <span className="text-xs text-muted-foreground">{method.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            L'architecture est prête pour ces moyens de paiement ; seule la validation de
            démonstration est active.
          </p>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">État de la boutique</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Produits au catalogue</dt>
              <dd>{products.length}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Commandes enregistrées</dt>
              <dd>{orders.length}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Comptes clients</dt>
              <dd>{profiles.length}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            Connecté en tant qu'administrateur : {profile?.email}
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
