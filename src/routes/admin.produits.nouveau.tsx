import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/produits/nouveau")({
  head: () => ({
    meta: [
      { title: "Ajouter un produit — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Créez une nouvelle fiche produit : informations, images, variantes et stocks.",
      },
      { property: "og:title", content: "Ajouter un produit — Administration MAISON NOVA" },
      { property: "og:description", content: "Nouvelle fiche produit et gestion des stocks." },
    ],
  }),
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <AdminLayout
      title="Ajouter un produit"
      description="La fiche sera visible immédiatement en boutique si elle est publiée."
    >
      <ProductForm />
    </AdminLayout>
  );
}
