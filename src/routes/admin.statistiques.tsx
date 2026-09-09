import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { adminFavoritesQuery, adminOrdersQuery } from "@/lib/admin";
import { formatPrice, popularityScore } from "@/lib/shop";

export const Route = createFileRoute("/admin/statistiques")({
  head: () => ({
    meta: [
      { title: "Statistiques — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Analyse des ventes sur 14 jours, produits les plus populaires et niveaux de stock.",
      },
      { property: "og:title", content: "Statistiques — Administration MAISON NOVA" },
      { property: "og:description", content: "Ventes, popularité et stocks." },
    ],
  }),
  component: AdminStats,
});

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(d);

function AdminStats() {
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const { data: orders = [] } = useQuery(adminOrdersQuery());
  const { data: favorites = [] } = useQuery(adminFavoritesQuery());

  const paid = orders.filter((o) => o.status !== "annulee");

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = paid.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    return {
      jour: dayLabel(d),
      ventes: dayOrders.reduce((s, o) => s + Number(o.total), 0),
      commandes: dayOrders.length,
    };
  });

  const favoritesByProduct = favorites.reduce<Record<string, number>>((acc, f) => {
    acc[f.product_id] = (acc[f.product_id] ?? 0) + 1;
    return acc;
  }, {});

  const popular = [...products]
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, 8)
    .map((p) => ({
      nom: p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name,
      score: popularityScore(p),
      favoris: favoritesByProduct[p.id] ?? 0,
    }));

  const stock = stockByProduct(variants);
  const lowStock = [...products]
    .map((p) => ({ ...p, total: stock.get(p.id) ?? 0 }))
    .sort((a, b) => a.total - b.total)
    .slice(0, 8);

  const tooltipStyle = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <AdminLayout title="Statistiques" description="Performance des ventes et du catalogue.">
      <div className="grid gap-4">
        <section className="surface-card p-4">
          <h2 className="text-lg">Ventes des 14 derniers jours</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="jour" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatPrice(value)}
                />
                <Area
                  type="monotone"
                  dataKey="ventes"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface-card p-4">
            <h2 className="text-lg">Produits les plus populaires</h2>
            <p className="text-xs text-muted-foreground">
              Score calculé à partir des vues, ajouts au panier, favoris et achats.
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nom"
                    fontSize={11}
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="score" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="surface-card p-4">
            <h2 className="text-lg">Stocks les plus faibles</h2>
            <ul className="mt-4 divide-y divide-border">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={p.cover_url} alt={p.name} loading="lazy" className="size-10 rounded object-cover" />
                    <p className="truncate text-sm">{p.name}</p>
                  </div>
                  <span
                    className={
                      p.total > 0 ? "text-sm text-muted-foreground" : "text-sm text-destructive"
                    }
                  >
                    {p.total} en stock
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="surface-card p-4">
          <h2 className="text-lg">Commandes par jour</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="jour" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="commandes" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
