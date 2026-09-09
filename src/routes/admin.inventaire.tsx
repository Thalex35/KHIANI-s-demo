import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingUp, Package, Zap } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, variantsQuery, stockByProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";

type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  cover_url: string;
};

const inventoryHistoryQuery = () => ({
  queryKey: ["inventory_history"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inventory_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },
});

export const Route = createFileRoute("/admin/inventaire")({
  head: () => ({
    meta: [
      { title: "Inventaire — Administration" },
      {
        name: "description",
        content: "Gérez votre inventaire et le stock de vos produits.",
      },
      { property: "og:title", content: "Inventaire — Administration" },
      { property: "og:description", content: "Gestion de l'inventaire." },
    ],
  }),
  component: AdminInventory,
});

function AdminInventory() {
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const { data: history = [] } = useQuery(inventoryHistoryQuery());

  const stock = stockByProduct(variants);

  // Calculate inventory stats
  const totalVariants = variants.length;
  const inStockVariants = variants.filter((v) => v.stock > 0).length;
  const lowStockVariants = variants.filter((v) => v.stock > 0 && v.stock <= 5).length;
  const outOfStockVariants = variants.filter((v) => v.stock === 0).length;

  // Calculate inventory value
  const totalValue = products.reduce((sum, p) => {
    const productStock = stock.get(p.id) ?? 0;
    return sum + p.price * productStock;
  }, 0);

  const cards = [
    {
      label: "Valeur inventaire",
      value: formatPrice(totalValue),
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Variantes en stock",
      value: String(inStockVariants),
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
      subtext: `sur ${totalVariants}`,
    },
    {
      label: "Stock faible",
      value: String(lowStockVariants),
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Rupture de stock",
      value: String(outOfStockVariants),
      icon: Zap,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <AdminLayout title="Inventaire" description="Gestion de l'inventaire et des stocks.">
      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, subtext }) => (
          <div key={label} className="surface-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
                {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
              </div>
              <div className={cn("rounded-lg p-2", color)}>
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Low Stock Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Stock faible (≤5)</h3>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/produits">Voir tous</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {variants
              .filter((v) => v.stock > 0 && v.stock <= 5)
              .slice(0, 8)
              .map((v) => {
                const product = products.find((p) => p.id === v.product_id);
                if (!product) return null;
                return (
                  <div key={v.id} className="surface-card rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.cover_url}
                        alt={product.name}
                        className="size-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.color} • Taille {v.size}
                        </p>
                      </div>
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        {v.stock}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Rupture de stock</h3>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/produits">Voir tous</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {variants
              .filter((v) => v.stock === 0)
              .slice(0, 8)
              .map((v) => {
                const product = products.find((p) => p.id === v.product_id);
                if (!product) return null;
                return (
                  <div key={v.id} className="surface-card rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.cover_url}
                        alt={product.name}
                        className="size-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.color} • Taille {v.size}
                        </p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        0
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Changements récents</h3>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/inventaire/historique">Voir l'historique complet</Link>
          </Button>
        </div>
        <div className="surface-card overflow-hidden rounded-lg border border-border">
          <div className="divide-y divide-border">
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun changement enregistré
              </div>
            ) : (
              history.slice(0, 10).map((item: any) => {
                const product = products.find((p) => p.id === item.product_id);
                const variant = variants.find((v) => v.id === item.product_variant_id);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    {product && (
                      <img
                        src={product.cover_url}
                        alt={product.name}
                        className="size-8 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {variant?.color} • Taille {variant?.size} • {item.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          item.quantity_change > 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {item.quantity_change > 0 ? "+" : ""}{item.quantity_change}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
