import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Rafraîchit le catalogue dès qu'un produit ou un stock change côté administration. */
export function useCatalogRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("catalogue")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["products"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["variants"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
