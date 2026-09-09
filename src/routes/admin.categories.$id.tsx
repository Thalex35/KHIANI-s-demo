import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { CategoryFormComponent, type Category } from "@/components/admin/CategoryForm";

const categoryQuery = (id: string) => ({
  queryKey: ["category", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Category;
  },
});

export const Route = createFileRoute("/admin/categories/$id")({
  head: () => ({
    meta: [
      { title: "Modifier une catégorie — Administration" },
      {
        name: "description",
        content: "Modifier les détails d'une catégorie.",
      },
    ],
  }),
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { id } = Route.useParams();
  const { data: category, isLoading } = useQuery(categoryQuery(id));

  if (isLoading) {
    return <AdminLayout title="Chargement..." backTo="/admin/categories" />;
  }

  if (!category) {
    return (
      <AdminLayout title="Catégorie non trouvée" backTo="/admin/categories">
        <EmptyState title="Catégorie non trouvée" text="Cette catégorie n'existe pas ou a été supprimée." />
      </AdminLayout>
    );
  }

  return <CategoryFormComponent category={category} />;
}
