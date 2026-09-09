import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Trash2, CheckCircle, XCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runTesterSafeWrite } from "@/lib/testerSandbox";
import { formatDate } from "@/lib/shop";

type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_approved: boolean;
  is_hidden: boolean;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  product?: { name: string; slug: string };
};

const reviewsQuery = () => ({
  queryKey: ["admin-reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*, product:products(name,slug)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data as ProductReview[]) || [];
  },
});

export const Route = createFileRoute("/admin/reviews/")({
  head: () => ({
    meta: [
      { title: "Avis produits — Administration" },
      {
        name: "description",
        content: "Gérez les avis clients.",
      },
      { property: "og:title", content: "Avis produits — Administration" },
    ],
  }),
  component: AdminReviews,
});

function AdminReviews() {
  const queryClient = useQueryClient();
  const { isTester } = useAuth();
  const { data: reviews = [], isLoading } = useQuery(reviewsQuery());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [toDelete, setToDelete] = useState<ProductReview | null>(null);

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved && !r.is_hidden;
    if (filter === "approved") return r.is_approved && !r.is_hidden;
    if (filter === "hidden") return r.is_hidden;
    return true;
  });

  const list = filtered.filter((r) =>
    `${r.product?.name || ""} ${r.content}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const approve = async (review: ProductReview) => {
    const payload = { id: review.id, is_approved: true, is_hidden: false };
    const result = await runTesterSafeWrite(
      isTester,
      "product_reviews",
      "update",
      payload,
      `Approbation de l'avis ${review.id}`,
      async () => {
        const { error } = await supabase.from("product_reviews").update({ is_approved: true, is_hidden: false }).eq("id", review.id);
        if (error) throw error;
        return true;
      },
    );

    if (result === undefined && isTester) {
      toast.success("Avis approuvé (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    toast.success("Avis approuvé");
  };

  const hide = async (review: ProductReview) => {
    const payload = { id: review.id, is_hidden: true };
    const result = await runTesterSafeWrite(
      isTester,
      "product_reviews",
      "update",
      payload,
      `Masquage de l'avis ${review.id}`,
      async () => {
        const { error } = await supabase.from("product_reviews").update({ is_hidden: true }).eq("id", review.id);
        if (error) throw error;
        return true;
      },
    );

    if (result === undefined && isTester) {
      toast.success("Avis masqué (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    toast.success("Avis masqué");
  };

  const unhide = async (review: ProductReview) => {
    const payload = { id: review.id, is_hidden: false };
    const result = await runTesterSafeWrite(
      isTester,
      "product_reviews",
      "update",
      payload,
      `Démasquage de l'avis ${review.id}`,
      async () => {
        const { error } = await supabase.from("product_reviews").update({ is_hidden: false }).eq("id", review.id);
        if (error) throw error;
        return true;
      },
    );

    if (result === undefined && isTester) {
      toast.success("Avis démasqué (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    toast.success("Avis démasqué");
  };

  const remove = async () => {
    if (!toDelete) return;
    const payload = { id: toDelete.id };
    const result = await runTesterSafeWrite(
      isTester,
      "product_reviews",
      "delete",
      payload,
      `Suppression de l'avis ${toDelete.id}`,
      async () => {
        const { error } = await supabase.from("product_reviews").delete().eq("id", toDelete.id);
        if (error) throw error;
        return true;
      },
    );

    setToDelete(null);
    if (result === undefined && isTester) {
      toast.success("Avis supprimé (simulation TEST MODE)");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    toast.success("Avis supprimé");
  };

  return (
    <AdminLayout
      title="Avis produits"
      description={`${reviews.length} avis total.`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un avis"
          className="max-w-md"
        />
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="hidden">Masqués</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Aucun avis trouvé"
          text="Modifiez votre recherche ou filtre."
        />
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <div key={review.id} className="surface-card rounded-lg border border-border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star
                          key={i}
                          className={`size-3 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{review.rating}/5</span>
                  </div>
                  <h3 className="font-semibold truncate">
                    {review.title || "Sans titre"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {review.product?.name || "Produit inconnu"}
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">{review.content}</p>
                </div>
                <div className="shrink-0 flex flex-col gap-1">
                  {review.is_hidden && (
                    <Badge variant="outline" className="text-xs">Masqué</Badge>
                  )}
                  {!review.is_approved && !review.is_hidden && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                      En attente
                    </Badge>
                  )}
                  {review.is_approved && !review.is_hidden && (
                    <Badge className="bg-green-100 text-green-700 text-xs">Approuvé</Badge>
                  )}
                </div>
              </div>

              <div className="mb-3 text-xs text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <span>
                    {review.user?.email || "Utilisateur inconnu"}
                  </span>
                  <span>{formatDate(review.created_at)}</span>
                </div>
                <div className="mt-1 flex gap-4 text-xs">
                  <span>👍 {review.helpful_count}</span>
                  <span>👎 {review.unhelpful_count}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!review.is_approved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => approve(review)}
                    className="gap-1"
                  >
                    <CheckCircle className="size-3" />
                    Approuver
                  </Button>
                )}
                {!review.is_hidden && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => hide(review)}
                    className="gap-1"
                  >
                    <EyeOff className="size-3" />
                    Masquer
                  </Button>
                )}
                {review.is_hidden && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unhide(review)}
                    className="gap-1"
                  >
                    <Eye className="size-3" />
                    Afficher
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setToDelete(review)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'avis ?</AlertDialogTitle>
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
