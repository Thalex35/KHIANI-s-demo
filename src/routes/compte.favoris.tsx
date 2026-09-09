import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "@/components/site/AccountLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { useFavorites } from "@/hooks/useFavorites";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";

export const Route = createFileRoute("/compte/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris — MAISON NOVA" },
      {
        name: "description",
        content: "Retrouvez tous les vêtements que vous avez enregistrés dans vos favoris.",
      },
      { property: "og:title", content: "Mes favoris — MAISON NOVA" },
      { property: "og:description", content: "Vos coups de cœur enregistrés." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  useCatalogRealtime();
  const { favorites, isLoading } = useFavorites();
  const { data: products } = useQuery(productsQuery());
  const { data: variants } = useQuery(variantsQuery());
  const stock = stockByProduct(variants ?? []);
  const list = (products ?? []).filter((p) => favorites.includes(p.id));

  return (
    <AccountLayout title="Mes favoris" description="Vos coups de cœur, enregistrés sur votre compte.">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Aucun favori pour le moment"
          text="Touchez le cœur sur un produit pour le retrouver ici, même après déconnexion."
          action={
            <Button asChild>
              <Link to="/boutique">Parcourir la boutique</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} stock={stock.get(p.id)} />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
