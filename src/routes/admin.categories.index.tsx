import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const categoriesQuery = () => ({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data as Category[]) || [];
  },
});

export const Route = createFileRoute("/admin/categories/")({
  head: () => ({
    meta: [
      { title: "Catégories — Administration" },
      {
        name: "description",
        content: "Gérez les catégories de produits et l'organisation du catalogue.",
      },
      { property: "og:title", content: "Catégories — Administration" },
      { property: "og:description", content: "Gestion des catégories." },
    ],
  }),
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useQuery(categoriesQuery());
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const mainCategories = categories.filter((c) => !c.parent_id);
  const list = mainCategories.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const toggleActive = async (category: Category, value: boolean) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: value })
      .eq("id", category.id);
    if (error) {
      toast.error("La mise à jour a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success(value ? "Catégorie publiée" : "Catégorie masquée");
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("categories").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast.error("La suppression a échoué");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Catégorie supprimée");
  };

  return (
    <AdminLayout
      title="Catégories"
      description={`${categories.length} catégorie(s) au catalogue.`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/categories/nouvelle">
            <Plus className="mr-1.5 size-4" /> Ajouter une catégorie
          </Link>
        </Button>
      }
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une catégorie"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Aucune catégorie trouvée"
          text="Modifiez votre recherche ou ajoutez une catégorie."
        />
      ) : (
        <div className="space-y-3">
          {list.map((category) => (
            <div
              key={category.id}
              className="surface-card flex items-center justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    loading="lazy"
                    className="size-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{category.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {category.description || "Pas de description"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={category.is_active}
                  onCheckedChange={(v) => void toggleActive(category, v)}
                  aria-label="Publier la catégorie"
                />
                <Button asChild size="icon" variant="ghost" aria-label="Modifier">
                  <Link to="/admin/categories/$id" params={{ id: category.id }}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Supprimer"
                  onClick={() => setToDelete(category)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
