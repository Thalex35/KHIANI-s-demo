import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminFavoritesQuery,
  adminOrdersQuery,
  adminPresenceQuery,
  adminProfilesQuery,
  adminRolesQuery,
  adminUserStatusRealtimeListener,
  daysAgo,
  type AdminProfile,
} from "@/lib/admin";
import { formatDate, formatDateTime, formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Consultez les comptes clients, leur activité et leurs commandes.",
      },
      { property: "og:title", content: "Utilisateurs — Administration MAISON NOVA" },
      { property: "og:description", content: "Comptes clients et activité." },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery(adminProfilesQuery());
  const { data: roles = [] } = useQuery(adminRolesQuery());
  const { data: orders = [] } = useQuery(adminOrdersQuery());
  const { data: favorites = [] } = useQuery(adminFavoritesQuery());
  const { data: statuses = [] } = useQuery(adminPresenceQuery());
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const cleanup = adminUserStatusRealtimeListener(() => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-status"] });
    });

    return cleanup;
  }, [queryClient]);

  const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
  const presenceByUser = new Map(statuses.map((status) => [status.user_id, status]));
  const roleOf = (id: string) => {
    if (roles.find((r) => r.user_id === id && r.role === "admin")) return "Administrateur";
    if (roles.find((r) => r.user_id === id && r.role === "tester")) return "Testeur";
    return "Client";
  };
  const ordersOf = (id: string) => orders.filter((o) => o.user_id === id);
  const favoritesOf = (id: string) => favorites.filter((f) => f.user_id === id).length;
  const isActive = (p: AdminProfile) =>
    new Date(p.last_seen_at).getTime() >= daysAgo(30).getTime();
  const isOnline = (p: AdminProfile) => {
    const status = presenceByUser.get(p.id);
    if (!status || !status.is_online) return false;
    return Date.now() - new Date(status.last_active).getTime() <= ACTIVE_WINDOW_MS;
  };

  const list = profiles.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.email} ${p.city ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <AdminLayout
      title="Utilisateurs"
      description={`${profiles.length} compte(s) — ${profiles.filter(isActive).length} actif(s) sur 30 jours.`}
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un nom, un e-mail ou une ville"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="Aucun utilisateur" text="Aucun compte ne correspond à cette recherche." />
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {list.map((p) => (
              <li key={p.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs",
                      isActive(p) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isActive(p) ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-2.5 w-2.5 rounded-full",
                      isOnline(p) ? "bg-emerald-500" : "bg-slate-400",
                    )}
                    title={isOnline(p) ? "En ligne" : "Hors ligne"}
                  />
                  <span className={cn("text-xs", isOnline(p) ? "text-emerald-600" : "text-slate-500")}>
                    {isOnline(p) ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {roleOf(p.id)} · {ordersOf(p.id).length} commande(s) · {favoritesOf(p.id)} favori(s)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => setSelected(p)}
                >
                  Voir le profil
                </Button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Rôle</th>
                  <th className="p-3 font-medium">Active</th>
                  <th className="p-3 font-medium">Inscrit le</th>
                  <th className="p-3 font-medium">Dernière connexion</th>
                  <th className="p-3 font-medium">Commandes</th>
                  <th className="p-3 font-medium">Favoris</th>
                  <th className="p-3 text-right font-medium">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">
                      <p className="font-medium">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{roleOf(p.id)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-2.5 w-2.5 rounded-full",
                            isOnline(p) ? "bg-emerald-500" : "bg-slate-400",
                          )}
                        />
                        <span className={cn("text-xs font-medium", isOnline(p) ? "text-emerald-600" : "text-slate-500")}>{isOnline(p) ? "Online" : "Offline"}</span>
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(p.last_seen_at)}</td>
                    <td className="p-3">{ordersOf(p.id).length}</td>
                    <td className="p-3">{favoritesOf(p.id)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(p)}>
                        Consulter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.first_name} {selected?.last_name}
            </DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {roleOf(selected.id)} · Inscrit le {formatDate(selected.created_at)} · Dernière
                connexion {formatDateTime(selected.last_seen_at)}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Commandes</p>
                  <p className="mt-1 text-lg font-semibold">{ordersOf(selected.id).length}</p>
                </div>
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Favoris</p>
                  <p className="mt-1 text-lg font-semibold">{favoritesOf(selected.id)}</p>
                </div>
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total dépensé</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatPrice(
                      ordersOf(selected.id).reduce((s, o) => s + Number(o.total), 0),
                    )}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">
                {selected.city ? `${selected.city}, ${selected.country ?? ""}` : "Adresse non renseignée"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
