import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((f: { product_id: string }) => f.product_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("non-connecte");
      if (favorites.includes(productId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
        return "retire" as const;
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "ajoute" as const;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(result === "ajoute" ? "Ajouté à vos favoris" : "Retiré de vos favoris");
    },
    onError: () => toast.error("Impossible de mettre à jour vos favoris"),
  });

  return {
    favorites,
    isLoading,
    isFavorite: (id: string) => favorites.includes(id),
    toggleFavorite: (id: string) => toggle.mutate(id),
    isPending: toggle.isPending,
  };
}
