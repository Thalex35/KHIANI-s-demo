import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { formatPrice, formatDate } from "@/lib/shop";

type Coupon = {
  id: string;
  code: string;
  coupon_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_value: number | null;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
};

const couponsQuery = () => ({
  queryKey: ["coupons"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Coupon[]) || [];
  },
});

export const Route = createFileRoute("/admin/coupons/")({
  head: () => ({
    meta: [
      { title: "Codes de réduction — Administration" },
      {
        name: "description",
        content: "Gérez les codes de réduction.",
      },
      { property: "og:title", content: "Codes de réduction — Administration" },
      { property: "og:description", content: "Gestion des coupons." },
    ],
  }),
  component: AdminCoupons,
});

function AdminCoupons() {
  const queryClient = useQueryClient();
  const { data: coupons = [], isLoading } = useQuery(couponsQuery());
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  const list = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const toggleActive = async (coupon: Coupon, value: boolean) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: value })
      .eq("id", coupon.id);
    if (error) {
      toast.error("La mise à jour a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["coupons"] });
    toast.success(value ? "Coupon activé" : "Coupon désactivé");
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" copié`);
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast.error("La suppression a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["coupons"] });
    toast.success("Coupon supprimé");
  };

  return (
    <AdminLayout
      title="Codes de réduction"
      description={`${coupons.length} coupon(s).`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/coupons/nouveau">
            <Plus className="mr-1.5 size-4" /> Ajouter un coupon
          </Link>
        </Button>
      }
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un code"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Aucun coupon trouvé"
          text="Modifiez votre recherche ou créez un coupon."
        />
      ) : (
        <div className="hidden md:block space-y-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Réduction</th>
                <th className="px-4 py-3 text-left font-semibold">Utilisation</th>
                <th className="px-4 py-3 text-left font-semibold">Expiration</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((coupon) => {
                const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                const usageRemaining =
                  coupon.usage_limit !== null ? coupon.usage_limit - coupon.usage_count : null;

                return (
                  <tr key={coupon.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.coupon_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.usage_count}
                      {usageRemaining !== null && ` / ${usageRemaining}`}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.expiration_date
                        ? formatDate(coupon.expiration_date)
                        : "Aucune"}
                    </td>
                    <td className="px-4 py-3">
                      {isExpired && <Badge variant="outline">Expiré</Badge>}
                      {!isExpired && coupon.is_active && (
                        <Badge className="bg-green-100 text-green-700">Actif</Badge>
                      )}
                      {!isExpired && !coupon.is_active && (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Copier le code"
                          onClick={() => copyCouponCode(coupon.code)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button asChild size="icon" variant="ghost" aria-label="Modifier">
                          <Link to="/admin/coupons/$id" params={{ id: coupon.id }}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer"
                          onClick={() => setToDelete(coupon)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile view */}
      {!isLoading && list.length > 0 && (
        <div className="md:hidden space-y-3">
          {list.map((coupon) => {
            const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
            const usageRemaining =
              coupon.usage_limit !== null ? coupon.usage_limit - coupon.usage_count : null;

            return (
              <div key={coupon.id} className="surface-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-bold truncate">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.coupon_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </p>
                  </div>
                  {isExpired && <Badge variant="outline" className="shrink-0">Expiré</Badge>}
                  {!isExpired && coupon.is_active && (
                    <Badge className="bg-green-100 text-green-700 shrink-0">Actif</Badge>
                  )}
                  {!isExpired && !coupon.is_active && (
                    <Badge variant="outline" className="shrink-0">Inactif</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-3 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Utilisation</span>
                    <span className="font-semibold">
                      {coupon.usage_count}
                      {usageRemaining !== null && ` / ${usageRemaining}`}
                    </span>
                  </div>
                  {coupon.expiration_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>{formatDate(coupon.expiration_date)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => copyCouponCode(coupon.code)}
                  >
                    <Copy className="mr-1 size-3" /> Copier
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/coupons/$id" params={{ id: coupon.id }}>
                      <Pencil className="size-3" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setToDelete(coupon)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le coupon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
