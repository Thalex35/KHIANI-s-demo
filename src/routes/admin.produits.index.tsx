import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runTesterSafeWrite } from "@/lib/testerSandbox";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { discountPercent, effectivePrice, formatPrice, type Product } from "@/lib/shop";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/produits/")({
  head: () => ({
    meta: [
      { title: "Produits — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Gérez le catalogue : ajout, modification, activation et suivi des stocks.",
      },
      { property: "og:title", content: "Produits — Administration MAISON NOVA" },
      { property: "og:description", content: "Catalogue, stocks et disponibilité." },
    ],
  }),
  component: AdminProducts,
});

function AdminProducts() {
  useCatalogRealtime();
  const queryClient = useQueryClient();
  const { isTester } = useAuth();
  const { data: products = [], isLoading } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const stock = stockByProduct(variants);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const list = products.filter((p) =>
    `${p.name} ${p.brand} ${p.category} ${p.subcategory} ${p.sku}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const toggleActive = async (product: Product, value: boolean) => {
    const payload = { is_active: value, id: product.id };
    const result = await runTesterSafeWrite(
      isTester,
      "products",
      "update",
      payload,
      `${value ? "Activation" : "Masquage"} du produit ${product.name}`,
      async () => {
        const { error } = await supabase.from("products").update({ is_active: value }).eq("id", product.id);
        if (error) throw error;
        return true;
      },
    );

    if (result === undefined && isTester) {
      toast.success(value ? "Produit publié (simulation TEST MODE)" : "Produit masqué (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success(value ? "Produit publié" : "Produit masqué de la boutique");
  };

  const remove = async () => {
    if (!toDelete) return;
    const payload = { id: toDelete.id };
    const result = await runTesterSafeWrite(
      isTester,
      "products",
      "delete",
      payload,
      `Suppression du produit ${toDelete.name}`,
      async () => {
        const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
        if (error) throw error;
        return true;
      },
    );

    setToDelete(null);
    if (result === undefined && isTester) {
      toast.success("Produit supprimé (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Produit supprimé");
  };

  return (
    <AdminLayout
      title="Produits"
      description={`${products.length} produit(s) au catalogue.`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/produits/nouveau">
            <Plus className="mr-1.5 size-4" /> Ajouter un produit
          </Link>
        </Button>
      }
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par nom, marque, catégorie ou référence"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="Aucun produit trouvé" text="Modifiez votre recherche ou ajoutez un produit." />
      ) : (
        <>
          {/* Mobile : cartes */}
          <ul className="space-y-3 lg:hidden">
            {list.map((p) => (
              <li key={p.id} className="surface-card p-3">
                <div className="flex gap-3">
                  <img src={p.cover_url} alt={p.name} loading="lazy" className="size-16 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category} · {p.subcategory} · {p.sku}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatPrice(effectivePrice(p))}
                      {discountPercent(p) > 0 && (
                        <span className="ml-2 text-xs text-accent">-{discountPercent(p)}%</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs",
                      (stock.get(p.id) ?? 0) > 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    Stock : {stock.get(p.id) ?? 0}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) => void toggleActive(p, v)}
                      aria-label="Publier le produit"
                    />
                    <Button asChild size="icon" variant="ghost" aria-label="Modifier">
                      <Link to="/admin/produits/$id" params={{ id: p.id }}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => setToDelete(p)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop : tableau */}
          <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Produit</th>
                  <th className="p-3 font-medium">Catégorie</th>
                  <th className="p-3 font-medium">Prix</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Publié</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.cover_url} alt={p.name} loading="lazy" className="size-11 rounded object-cover" />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.category} · {p.subcategory}
                    </td>
                    <td className="p-3">
                      {formatPrice(effectivePrice(p))}
                      {discountPercent(p) > 0 && (
                        <span className="ml-2 text-xs text-accent">-{discountPercent(p)}%</span>
                      )}
                    </td>
                    <td className={cn("p-3", (stock.get(p.id) ?? 0) > 0 ? "text-success" : "text-destructive")}>
                      {stock.get(p.id) ?? 0}
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) => void toggleActive(p, v)}
                        aria-label="Publier le produit"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" aria-label="Modifier">
                          <Link to="/admin/produits/$id" params={{ id: p.id }}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => setToDelete(p)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » et ses variantes seront définitivement supprimés du catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
