import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import {
  adminActiveUsersQuery,
  adminFavoritesQuery,
  adminOrdersQuery,
  adminProfilesQuery,
  adminUserStatusRealtimeListener,
  daysAgo,
  isSameDay,
} from "@/lib/admin";
import { STATUS_CLASSES, STATUS_LABELS, formatDate, formatDateTime, formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Vue d'ensemble des ventes, du stock, des commandes et de l'activité clients.",
      },
      { property: "og:title", content: "Tableau de bord — Administration MAISON NOVA" },
      { property: "og:description", content: "Ventes, stock, commandes et activité clients." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: variants = [] } = useQuery(variantsQuery());
  const { data: orders = [] } = useQuery(adminOrdersQuery());
  const { data: profiles = [] } = useQuery(adminProfilesQuery());
  const { data: favorites = [] } = useQuery(adminFavoritesQuery());
  const { data: activeUsers = [] } = useQuery(
    isAdmin ? adminActiveUsersQuery() : { queryKey: ["admin", "active-users", "blocked"], queryFn: async () => [] },
  );

  useEffect(() => {
    if (!isAdmin) return;

    const cleanup = adminUserStatusRealtimeListener(() => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "active-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-status"] });
    });

    return cleanup;
  }, [isAdmin, queryClient]);

  const stock = stockByProduct(variants);
  const inStock = products.filter((p) => (stock.get(p.id) ?? 0) > 0).length;
  const outOfStock = products.length - inStock;

  const paid = orders.filter((o) => o.status !== "annulee");
  const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);
  const sold = paid.reduce(
    (sum, o) => sum + o.order_items.reduce((n, i) => n + i.quantity, 0),
    0,
  );

  const activeUserIds = new Set(
    profiles
      .filter((p) => new Date(p.last_seen_at).getTime() >= daysAgo(30).getTime())
      .map((p) => p.id),
  );

  const sum = (from: Date) =>
    paid
      .filter((o) => new Date(o.created_at).getTime() >= from.getTime())
      .reduce((s, o) => s + Number(o.total), 0);

  const cards = [
    { label: "Chiffre d'affaires", value: formatPrice(revenue) },
    { label: "Commandes", value: String(orders.length) },
    { label: "Produits vendus", value: String(sold) },
    { label: "Clients inscrits", value: String(profiles.length) },
    { label: "Clients actifs (30 j)", value: String(activeUserIds.size) },
    { label: "Clients inactifs", value: String(profiles.length - activeUserIds.size) },
    { label: "Produits en stock", value: String(inStock) },
    { label: "Produits en rupture", value: String(outOfStock) },
  ];

  const sales = [
    { label: "Aujourd'hui", value: paid.filter((o) => isSameDay(o.created_at)).reduce((s, o) => s + Number(o.total), 0) },
    { label: "7 derniers jours", value: sum(daysAgo(7)) },
    { label: "30 derniers jours", value: sum(daysAgo(30)) },
    { label: "Total", value: revenue },
  ];

  const engagement = [
    { name: "Vues", value: products.reduce((n, p) => n + (p.views ?? 0), 0) },
    { name: "Ajouts panier", value: products.reduce((n, p) => n + (p.cart_adds ?? 0), 0) },
    { name: "Favoris", value: favorites.length },
    { name: "Achats", value: sold },
  ];

  const statusData = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([status, value]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status,
    value,
  }));

  const PIE_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "var(--color-muted-foreground)",
  ];

  return (
    <AdminLayout
      title="Tableau de bord"
      description="Suivi en temps réel de la boutique."
      actions={
        <>
          <Button asChild size="sm">
            <Link to="/admin/produits/nouveau">Ajouter un produit</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/commandes">Gérer les commandes</Link>
          </Button>
        </>
      }
    >
      {isAdmin && (
        <section className="surface-card mt-6 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Active Users</h2>
              <p className="text-xs text-muted-foreground">{activeUsers.length} utilisateur(s) connecté(s)</p>
            </div>
            <Badge variant="outline" className="text-xs">Admin only</Badge>
          </div>
          {activeUsers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aucun utilisateur actif pour le moment.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeUsers.map((user) => (
                <div key={user.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-700">online</span>
                      <p className="mt-1 text-[11px] text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Dernière activité : {formatDateTime(user.last_seen_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="surface-card p-4">
            <p className="eyebrow text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-xl font-semibold sm:text-2xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sales.map((s) => (
          <div key={s.label} className="surface-card p-4">
            <p className="eyebrow text-accent">Ventes · {s.label}</p>
            <p className="mt-2 text-lg font-semibold">{formatPrice(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-4">
          <h2 className="text-lg">Engagement produits</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-4">
          <h2 className="text-lg">Commandes par statut</h2>
          <div className="mt-4 h-64">
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande enregistrée.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card mt-6 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg">Dernières commandes</h2>
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/commandes">Tout voir</Link>
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.full_name} · {formatDate(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_CLASSES[o.status],
                    )}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                  <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
