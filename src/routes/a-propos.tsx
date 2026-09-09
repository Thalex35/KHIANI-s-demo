import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — MAISON NOVA" },
      {
        name: "description",
        content:
          "MAISON NOVA crée des vêtements durables et intemporels, pensés en France et fabriqués en petites séries.",
      },
      { property: "og:title", content: "À propos — MAISON NOVA" },
      {
        property: "og:description",
        content: "Notre histoire, nos matières et nos engagements.",
      },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    title: "Matières responsables",
    text: "Coton biologique certifié, lin européen et laine traçable, sélectionnés chez des filateurs partenaires.",
  },
  {
    title: "Petites séries",
    text: "Nous produisons en quantités limitées pour éviter la surproduction et garantir la qualité de chaque pièce.",
  },
  {
    title: "Juste prix",
    text: "Une chaîne courte, sans intermédiaire superflu, pour des vêtements durables à un prix cohérent.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="La maison"
        title="Une garde-robe pensée pour durer"
        description="MAISON NOVA dessine des vêtements simples, bien coupés et fabriqués avec soin."
      />
      <div className="container-page space-y-16 py-12 sm:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <img
            src="/images/hero.jpg"
            alt="Atelier MAISON NOVA"
            loading="lazy"
            width={900}
            height={700}
            className="aspect-4/3 w-full rounded-lg object-cover"
          />
          <div>
            <p className="eyebrow text-accent">Notre histoire</p>
            <h2 className="mt-2 text-3xl">Née d'une envie de simplicité</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Fondée en 2018, MAISON NOVA est partie d'un constat simple : trouver des vêtements
              bien coupés, confortables et fabriqués correctement relevait du parcours du
              combattant. Nous avons commencé par une chemise blanche, puis un t-shirt en coton
              épais, puis une collection entière.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Aujourd'hui, nous habillons femmes, hommes et enfants avec la même exigence : des
              matières nobles, des coupes justes et des pièces qui traversent les saisons sans se
              démoder.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Nos engagements</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="surface-card p-5">
                <h3 className="text-lg">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <h2 className="text-2xl">Découvrez la collection</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Plus de trente pièces, disponibles de la taille XS au XXL, en huit coloris.
          </p>
          <Button asChild size="lg">
            <Link to="/boutique">Voir la boutique</Link>
          </Button>
        </section>
      </div>
    </SiteLayout>
  );
}
