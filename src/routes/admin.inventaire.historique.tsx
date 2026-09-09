import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, variantsQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { useState } from "react";

const inventoryHistoryQuery = () => ({
  queryKey: ["inventory_history_full"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inventory_history")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
});

export const Route = createFileRoute("/admin/inventaire/historique")({
  head: () => ({
    meta: [
      { title: "Historique d'inventaire — Administration" },
      {
        name: "description",
        content: "Consultez l'historique complet des changements de stock.",
      },
    ],
  }),
  component: InventoryHistory,
});

function InventoryHistory() {
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const { data: history = [], isLoading } = useQuery(inventoryHistoryQuery());
  const [search, setSearch] = useState("");

  const filtered = history.filter((item: any) => {
    const product = products.find((p) => p.id === item.product_id);
    return (
      (product?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.reason ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <AdminLayout title="Historique d'inventaire" backTo="/admin/inventaire">
      <div className="space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par produit ou raison"
          className="max-w-md"
        />

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Aucun changement trouvé</p>
          </div>
        ) : (
          <div className="surface-card overflow-hidden rounded-lg border border-border">
            <div className="hidden divide-y divide-border lg:block">
              {/* Desktop: Table */}
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Produit</th>
                    <th className="p-3 text-left font-medium">Variante</th>
                    <th className="p-3 text-left font-medium">Raison</th>
                    <th className="p-3 text-right font-medium">Stock avant</th>
                    <th className="p-3 text-right font-medium">Changement</th>
                    <th className="p-3 text-right font-medium">Stock après</th>
                    <th className="p-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((item: any) => {
                    const product = products.find((p) => p.id === item.product_id);
                    const variant = variants.find((v) => v.id === item.product_variant_id);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {product && (
                              <img
                                src={product.cover_url}
                                alt={product.name}
                                className="size-8 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{product?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {variant?.color} • Taille {variant?.size}
                        </td>
                        <td className="p-3">{item.reason}</td>
                        <td className="p-3 text-right">{item.previous_stock}</td>
                        <td className="p-3 text-right">
                          <span
                            className={cn(
                              "font-medium",
                              item.quantity_change > 0 ? "text-green-600" : "text-red-600",
                            )}
                          >
                            {item.quantity_change > 0 ? "+" : ""}{item.quantity_change}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">{item.new_stock}</td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(item.created_at), "PPp", { locale: fr })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: Cards */}
            <div className="divide-y divide-border lg:hidden">
              {filtered.map((item: any) => {
                const product = products.find((p) => p.id === item.product_id);
                const variant = variants.find((v) => v.id === item.product_variant_id);
                return (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {product && (
                        <img
                          src={product.cover_url}
                          alt={product.name}
                          className="size-8 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {variant?.color} • Taille {variant?.size}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Avant</p>
                        <p className="font-medium">{item.previous_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Changement</p>
                        <p
                          className={cn(
                            "font-medium",
                            item.quantity_change > 0 ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {item.quantity_change > 0 ? "+" : ""}{item.quantity_change}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Après</p>
                        <p className="font-medium">{item.new_stock}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {item.reason} • {format(new Date(item.created_at), "PPp", { locale: fr })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
