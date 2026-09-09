import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/catalog";
import { discountPercent, formatPrice, type Product } from "@/lib/shop";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";

export const Route = createFileRoute("/admin/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Activez, ajustez ou désactivez les promotions par pourcentage ou par prix promo.",
      },
      { property: "og:title", content: "Promotions — Administration MAISON NOVA" },
      { property: "og:description", content: "Gestion des remises du catalogue." },
    ],
  }),
  component: AdminPromotions,
});

function AdminPromotions() {
  useCatalogRealtime();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery(productsQuery(true));
  const [search, setSearch] = useState("");
  const [percent, setPercent] = useState<Record<string, string>>({});

  const list = products.filter((p) =>
    `${p.name} ${p.category} ${p.subcategory}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const active = products.filter((p) => p.sale_price != null);

  const save = async (product: Product, salePrice: number | null) => {
    const { error } = await supabase
      .from("products")
      .update({ sale_price: salePrice })
      .eq("id", product.id);
    if (error) {
      toast.error("La mise à jour de la promotion a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success(salePrice ? "Promotion activée" : "Promotion désactivée");
  };

  const applyPercent = (product: Product) => {
    const value = Number(percent[product.id]);
    if (!value || value <= 0 || value >= 100) {
      toast.error("Saisissez un pourcentage entre 1 et 99");
      return;
    }
    const price = Number(product.price);
    void save(product, Math.round(price * (1 - value / 100) * 100) / 100);
  };

  return (
    <AdminLayout
      title="Promotions"
      description={`${active.length} promotion(s) active(s) — visibles immédiatement en boutique.`}
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un produit"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="Aucun produit" text="Aucun produit ne correspond à cette recherche." />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <img src={p.cover_url} alt={p.name} loading="lazy" className="size-14 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Prix normal {formatPrice(p.price)}
                      {p.sale_price != null && (
                        <>
                          {" · "}
                          <span className="text-accent">
                            Promo {formatPrice(p.sale_price)} (-{discountPercent(p)}%)
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {p.sale_price != null && (
                  <Button size="sm" variant="outline" onClick={() => void save(p, null)}>
                    Désactiver
                  </Button>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`pct-${p.id}`}>Remise (%)</Label>
                    <Input
                      id={`pct-${p.id}`}
                      type="number"
                      min="1"
                      max="99"
                      value={percent[p.id] ?? ""}
                      onChange={(e) => setPercent((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <Button size="sm" onClick={() => applyPercent(p)}>
                    Appliquer
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`price-${p.id}`}>Prix promotionnel (€)</Label>
                    <Input
                      id={`price-${p.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={p.sale_price != null ? String(p.sale_price) : ""}
                      onBlur={(e) => {
                        const value = e.target.value ? Number(e.target.value) : null;
                        if (value !== null && (value <= 0 || value >= Number(p.price))) {
                          toast.error("Le prix promo doit être inférieur au prix normal");
                          return;
                        }
                        if (value !== (p.sale_price != null ? Number(p.sale_price) : null)) {
                          void save(p, value);
                        }
                      }}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
