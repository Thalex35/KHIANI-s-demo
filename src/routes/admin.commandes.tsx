import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminOrdersQuery } from "@/lib/admin";
import {
  ORDER_STATUSES,
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDateTime,
  formatPrice,
  type OrderStatus,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/commandes")({
  head: () => ({
    meta: [
      { title: "Commandes — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Consultez les commandes et mettez à jour leur statut de préparation et livraison.",
      },
      { property: "og:title", content: "Commandes — Administration MAISON NOVA" },
      { property: "og:description", content: "Suivi et mise à jour des statuts de commande." },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("tous");

  const list = orders.filter((o) => {
    const matchSearch = `${o.order_number} ${o.full_name} ${o.city}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchStatus = status === "tous" || o.status === status;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, value: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status: value }).eq("id", id);
    if (error) {
      toast.error("La mise à jour du statut a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    toast.success(`Statut mis à jour : ${STATUS_LABELS[value]}`);
  };

  return (
    <AdminLayout title="Commandes" description={`${orders.length} commande(s) enregistrée(s).`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un numéro, un client ou une ville"
          className="sm:max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="Aucune commande" text="Aucune commande ne correspond à ces critères." />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.full_name} · {o.city}, {o.country} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    STATUS_CLASSES[o.status],
                  )}
                >
                  {STATUS_LABELS[o.status]}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.order_items.map((item) => (
                  <li key={item.id} className="truncate">
                    {item.name} — {item.size} / {item.color} × {item.quantity} ·{" "}
                    {formatPrice(Number(item.unit_price) * item.quantity)}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-lg font-semibold">{formatPrice(o.total)}</span>
                <Select
                  value={o.status}
                  onValueChange={(v) => void updateStatus(o.id, v as OrderStatus)}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
