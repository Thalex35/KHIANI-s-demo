import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductGridSkeleton } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { popularityScore } from "@/lib/shop";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAISON NOVA — Votre style. Votre identité." },
      {
        name: "description",
        content:
          "Découvrez la nouvelle collection MAISON NOVA : vêtements homme, femme, enfant et accessoires, livrés partout.",
      },
      { property: "og:title", content: "MAISON NOVA — Votre style. Votre identité." },
      {
        property: "og:description",
        content: "Nouvelle collection de vêtements homme, femme, enfant et accessoires.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORY_TILES = [
  { label: "Hommes", filter: { category: "Hommes" }, image: "/images/chemise.jpg" },
  { label: "Femmes", filter: { category: "Femmes" }, image: "/images/robe.jpg" },
  { label: "Enfants", filter: { category: "Enfants" }, image: "/images/enfant.jpg" },
  { label: "T-shirts", filter: { type: "T-shirt" }, image: "/images/tshirt-noir.jpg" },
  { label: "Chemises", filter: { type: "Chemise" }, image: "/images/chemise.jpg" },
  { label: "Pantalons", filter: { type: "Pantalon" }, image: "/images/pantalon.jpg" },
  { label: "Robes", filter: { type: "Robe" }, image: "/images/robe-casual.jpg" },
  { label: "Vestes", filter: { type: "Veste" }, image: "/images/veste-denim.jpg" },
  { label: "Sneakers", filter: { type: "Sneakers" }, image: "/images/sneakers.jpg" },
  { label: "Accessoires", filter: { type: "Accessoires" }, image: "/images/sac.jpg" },
];

function HomePage() {
  useCatalogRealtime();
  const { data: products, isLoading } = useQuery(productsQuery());
  const { data: variants } = useQuery(variantsQuery());
  const [email, setEmail] = useState("");
  const stocks = stockByProduct(variants ?? []);

  const nouveautes = (products ?? []).slice(0, 8);
  const populaires = [...(products ?? [])]
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, 4);
  const featured = (products ?? []).filter((p) => p.is_featured).slice(0, 4);
  const promos = (products ?? []).filter((p) => p.sale_price != null).slice(0, 4);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sand">
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow text-accent">Collection Automne / Hiver</p>
            <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Votre style.
              <br />
              Votre identité.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Découvrez notre nouvelle collection de vêtements, façonnée dans des matières nobles et
              pensée pour accompagner tous vos jours.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/boutique">
                  Découvrir la collection <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/categories">Parcourir les catégories</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl shadow-soft">
            <img
              src="/images/hero.jpg"
              alt="Deux mannequins portant la nouvelle collection MAISON NOVA"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="border-y border-border bg-background">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Livraison offerte", text: "Dès 80 € d'achat" },
            { icon: ShieldCheck, title: "Paiement sécurisé", text: "Vos données protégées" },
            { icon: Leaf, title: "Matières responsables", text: "Coton bio et lin européen" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catégories */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Rayons</p>
            <h2 className="mt-1 text-2xl sm:text-3xl">Explorer par catégorie</h2>
          </div>
          <Link to="/categories" className="text-sm text-muted-foreground hover:text-accent">
            Tout voir
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.label}
              to="/boutique"
              search={tile.filter}
              className="group relative overflow-hidden rounded-lg"
            >
              <img
                src={tile.image}
                alt={tile.label}
                loading="lazy"
                width={900}
                height={1100}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-sm font-medium text-background">
                {tile.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Collection en vedette */}
      {featured.length > 0 && (
        <section className="bg-background py-14">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-accent">Sélection MAISON NOVA</p>
                <h2 className="mt-1 text-2xl sm:text-3xl">La collection en vedette</h2>
              </div>
              <Link
                to="/boutique"
                search={{ sort: "featured" }}
                className="text-sm hover:text-accent"
              >
                Tout voir
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} stock={stocks.get(p.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nouveautés */}
      <section className="container-page py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Fraîchement arrivés</p>
            <h2 className="mt-1 text-2xl sm:text-3xl">Nouveautés</h2>
          </div>
          <Link
            to="/boutique"
            search={{ sort: "nouveautes" }}
            className="text-sm hover:text-accent"
          >
            Tout voir
          </Link>
        </div>
        <div className="mt-6">
          {isLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {nouveautes.map((p) => (
                <ProductCard key={p.id} product={p} stock={stocks.get(p.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Populaires */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Les préférés</p>
            <h2 className="mt-1 text-2xl sm:text-3xl">Produits populaires</h2>
          </div>
          <Link
            to="/boutique"
            search={{ sort: "populaires" }}
            className="text-sm hover:text-accent"
          >
            Tout voir
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {populaires.map((p) => (
            <ProductCard key={p.id} product={p} stock={stocks.get(p.id)} />
          ))}
        </div>
      </section>

      {/* Promotions */}
      {promos.length > 0 && (
        <section className="bg-sand/60 py-14">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-accent">Offres limitées</p>
                <h2 className="mt-1 text-2xl sm:text-3xl">Promotions du moment</h2>
              </div>
              <Link to="/boutique" search={{ promo: true }} className="text-sm hover:text-accent">
                Tout voir
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {promos.map((p) => (
                <ProductCard key={p.id} product={p} stock={stocks.get(p.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container-page py-16">
        <div className="surface-card mx-auto max-w-3xl p-8 text-center sm:p-12">
          <h2 className="text-2xl sm:text-3xl">Restez informé</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Recevez nos nouveautés et nos ventes privées. Un e-mail par mois, pas plus.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                toast.error("Veuillez saisir une adresse e-mail valide");
                return;
              }

              try {
                const { error } = await supabase
                  .from("newsletter_subscribers")
                  .upsert({ email, status: "active", subscribed_at: new Date().toISOString() }, {
                    onConflict: "email",
                  });

                if (error) throw error;

                setEmail("");
                toast.success("Merci ! Votre inscription à la newsletter est confirmée.");
              } catch (err) {
                console.error(err);
                toast.error("L'inscription à la newsletter a échoué.");
              }
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              aria-label="Votre adresse e-mail"
              maxLength={255}
            />
            <Button type="submit">S'inscrire</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
