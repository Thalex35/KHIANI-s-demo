import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — MAISON NOVA" },
      {
        name: "description",
        content:
          "Comment MAISON NOVA collecte, utilise et protège vos données personnelles, et comment exercer vos droits.",
      },
      { property: "og:title", content: "Politique de confidentialité — MAISON NOVA" },
      { property: "og:description", content: "Vos données, leur usage et vos droits." },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "Données collectées",
    text: "Nous collectons uniquement les données nécessaires au fonctionnement de la boutique : prénom, nom, adresse e-mail, téléphone et adresse de livraison, ainsi que l'historique de vos commandes et favoris.",
  },
  {
    title: "Utilisation des données",
    text: "Vos données servent à traiter vos commandes, vous informer de leur avancement, gérer votre compte client et, si vous y consentez, vous envoyer notre lettre d'information.",
  },
  {
    title: "Conservation",
    text: "Les données de compte sont conservées tant que votre compte est actif. Les données de commande sont conservées pour la durée légale applicable en matière comptable.",
  },
  {
    title: "Partage",
    text: "Vos données ne sont ni vendues ni louées. Elles sont partagées uniquement avec nos prestataires de livraison et de paiement, dans la stricte mesure nécessaire.",
  },
  {
    title: "Sécurité",
    text: "L'accès aux données est protégé par authentification et par des règles d'autorisation strictes : chaque client n'accède qu'à ses propres commandes, favoris et informations.",
  },
  {
    title: "Vos droits",
    text: "Vous pouvez consulter, modifier ou supprimer vos informations depuis votre espace client, ou nous écrire à bonjour@maisonnova.fr pour exercer vos droits d'accès, de rectification et d'effacement.",
  },
];

function PrivacyPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Informations légales"
        title="Politique de confidentialité"
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
