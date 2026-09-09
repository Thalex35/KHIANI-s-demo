import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { productsQuery, variantsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/admin/produits/$id")({
  head: () => ({
    meta: [
      { title: "Modifier un produit — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Modifiez la fiche produit : prix, promotion, images, variantes et stocks.",
      },
      { property: "og:title", content: "Modifier un produit — Administration MAISON NOVA" },
      { property: "og:description", content: "Édition complète de la fiche produit." },
    ],
  }),
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { data: products, isLoading } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const product = (products ?? []).find((p) => p.id === id);

  if (isLoading) {
    return (
      <AdminLayout title="Modifier un produit">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Modifier un produit">
        <EmptyState
          title="Produit introuvable"
          text="Ce produit a peut-être été supprimé du catalogue."
          action={
            <Button asChild>
              <Link to="/admin/produits">Retour aux produits</Link>
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Modifier « ${product.name} »`} description={`Référence ${product.sku ?? "—"}`}>
      <ProductForm
        product={product}
        variants={variants.filter((v) => v.product_id === product.id)}
      />
    </AdminLayout>
  );
}
