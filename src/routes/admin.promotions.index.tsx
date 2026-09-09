import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Calendar } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Promotion = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const promotionsQuery = () => ({
  queryKey: ["promotions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Promotion[]) || [];
  },
});

export const Route = createFileRoute("/admin/promotions/")({
  head: () => ({
    meta: [
      { title: "Promotions — Administration" },
      {
        name: "description",
        content: "Gérez les promotions et les réductions.",
      },
      { property: "og:title", content: "Promotions — Administration" },
      { property: "og:description", content: "Gestion des promotions." },
    ],
  }),
  component: AdminPromotions,
});

function AdminPromotions() {
  const queryClient = useQueryClient();
  const { data: promotions = [], isLoading } = useQuery(promotionsQuery());
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Promotion | null>(null);

  const list = promotions.filter((p) =>
    `${p.name} ${p.description || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const toggleActive = async (promotion: Promotion, value: boolean) => {
    const { error } = await supabase
      .from("promotions")
      .update({ is_active: value })
      .eq("id", promotion.id);
    if (error) {
      toast.error("La mise à jour a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["promotions"] });
    toast.success(value ? "Promotion activée" : "Promotion désactivée");
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast.error("La suppression a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["promotions"] });
    toast.success("Promotion supprimée");
  };

  return (
    <AdminLayout
      title="Promotions"
      description={`${promotions.length} promotion(s) active(s).`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/promotions/nouvelle">
            <Plus className="mr-1.5 size-4" /> Ajouter une promotion
          </Link>
        </Button>
      }
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une promotion"
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
          title="Aucune promotion trouvée"
          text="Modifiez votre recherche ou créez une promotion."
        />
      ) : (
        <div className="space-y-3">
          {list.map((promo) => {
            const now = new Date();
            const startDate = new Date(promo.start_date);
            const endDate = new Date(promo.end_date);
            const isExpired = now > endDate;
            const hasStarted = now >= startDate;
            const isOngoing = hasStarted && !isExpired;

            return (
              <div
                key={promo.id}
                className="surface-card rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{promo.name}</h3>
                      {isOngoing && promo.is_active && (
                        <Badge className="bg-green-100 text-green-700 shrink-0">
                          En cours
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge className="bg-gray-100 text-gray-700 shrink-0">
                          Expirée
                        </Badge>
                      )}
                      {!hasStarted && (
                        <Badge className="bg-blue-100 text-blue-700 shrink-0">
                          À venir
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {promo.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold">
                      {promo.discount_type === "percentage"
                        ? `${promo.discount_value}%`
                        : formatPrice(promo.discount_value)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {promo.discount_type === "percentage"
                        ? "Réduction"
                        : "Montant"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  <span>
                    {formatDate(promo.start_date)} → {formatDate(promo.end_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Switch
                    checked={promo.is_active}
                    onCheckedChange={(v) => void toggleActive(promo, v)}
                    aria-label="Activer la promotion"
                  />
                  <div className="flex gap-2">
                    <Button asChild size="icon" variant="ghost" aria-label="Modifier">
                      <Link to="/admin/promotions/$id" params={{ id: promo.id }}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Supprimer"
                      onClick={() => setToDelete(promo)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la promotion ?</AlertDialogTitle>
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
