import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { productsQuery } from "@/lib/catalog";
import { CATEGORIES, TYPES } from "@/lib/shop";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Nos catégories — MAISON NOVA" },
      {
        name: "description",
        content:
          "Explorez les catégories MAISON NOVA : hommes, femmes, enfants, t-shirts, chemises, pantalons, robes, vestes, sneakers et accessoires.",
      },
      { property: "og:title", content: "Nos catégories — MAISON NOVA" },
      {
        property: "og:description",
        content: "Toutes les familles de vêtements et accessoires de la maison.",
      },
    ],
  }),
  component: CategoriesPage,
});

const COVERS: Record<string, string> = {
  Hommes: "/images/chemise.jpg",
  Femmes: "/images/robe.jpg",
  Enfants: "/images/enfant.jpg",
  Accessoires: "/images/sac.jpg",
  "T-shirts": "/images/tshirt-noir.jpg",
  Chemises: "/images/chemise.jpg",
  Pantalons: "/images/pantalon.jpg",
  Robes: "/images/robe-casual.jpg",
  Vestes: "/images/veste-denim.jpg",
  Sneakers: "/images/sneakers.jpg",
  Jupes: "/images/jupe.jpg",
  Sweats: "/images/hoodie.jpg",
  Pulls: "/images/pull.jpg",
  Shorts: "/images/short.jpg",
};

function CategoriesPage() {
  const { data: products } = useQuery(productsQuery());

  const countBy = (predicate: (category: string, type: string) => boolean) =>
    (products ?? []).filter((p) => predicate(p.category, p.subcategory)).length;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Collection"
        title="Nos catégories"
        description="Parcourez la garde-robe MAISON NOVA par univers ou par type de vêtement."
      />
      <div className="container-page space-y-14 py-10 sm:py-14">
        <section>
          <h2 className="text-2xl">Univers</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to="/boutique"
                search={{ category }}
                className="group relative overflow-hidden rounded-lg"
              >
                <img
                  src={COVERS[category] ?? "/images/hero.jpg"}
                  alt={category}
                  loading="lazy"
                  width={600}
                  height={750}
                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-lg font-medium text-sand">{category}</p>
                  <p className="text-xs text-sand/80">
                    {countBy((c) => c === category)} article(s)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Types de vêtements</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TYPES.map((type) => (
              <Link
                key={type}
                to="/boutique"
                search={{ type }}
                className="group overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={COVERS[type] ?? "/images/tshirt-blanc.jpg"}
                  alt={type}
                  loading="lazy"
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="p-3">
                  <p className="text-sm font-medium">{type}</p>
                  <p className="text-xs text-muted-foreground">
                    {countBy((_, t) => t === type)} article(s)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
