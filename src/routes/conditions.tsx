import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions générales de vente — MAISON NOVA" },
      {
        name: "description",
        content:
          "Conditions générales de vente MAISON NOVA : commandes, prix, livraison, retours et garanties.",
      },
      { property: "og:title", content: "Conditions générales de vente — MAISON NOVA" },
      { property: "og:description", content: "Commandes, livraison, retours et garanties." },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  {
    title: "1. Objet",
    text: "Les présentes conditions régissent les ventes réalisées sur la boutique en ligne MAISON NOVA. Toute commande implique leur acceptation sans réserve.",
  },
  {
    title: "2. Produits et disponibilité",
    text: "Nos vêtements sont proposés dans la limite des stocks disponibles, taille et couleur par taille et couleur. En cas d'indisponibilité après commande, vous êtes informé et remboursé.",
  },
  {
    title: "3. Prix",
    text: "Les prix sont indiqués en euros toutes taxes comprises, hors frais de livraison. Les prix promotionnels s'appliquent pendant la durée annoncée de l'opération.",
  },
  {
    title: "4. Commande et paiement",
    text: "La commande est validée après confirmation du paiement. Les moyens de paiement prévus sont la carte bancaire, MonCash, NatCash et PayPal. Cette boutique est une démonstration : aucun paiement réel n'est encaissé.",
  },
  {
    title: "5. Livraison",
    text: "Les commandes sont expédiées sous 48 heures ouvrées. La livraison est offerte à partir de 80 € d'achat. Les délais indicatifs sont de 2 à 5 jours ouvrés.",
  },
  {
    title: "6. Retours et remboursements",
    text: "Vous disposez de 30 jours à compter de la réception pour retourner un article non porté, dans son emballage d'origine. Le remboursement intervient sous 14 jours après réception du retour.",
  },
  {
    title: "7. Service client",
    text: "Pour toute question, notre équipe est joignable par e-mail à bonjour@maisonnova.fr et répond sous 24 heures ouvrées.",
  },
];

function TermsPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Informations légales"
        title="Conditions générales de vente"
        description="Dernière mise à jour : janvier 2026."
      />
      <div className="container-page max-w-3xl space-y-8 py-12">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.text}</p>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}
