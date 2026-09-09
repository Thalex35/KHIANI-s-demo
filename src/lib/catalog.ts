import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Variant } from "@/lib/shop";

export async function fetchProducts(includeInactive = false) {
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchVariants() {
  const { data, error } = await supabase.from("product_variants").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as Variant[];
}

export const productsQuery = (includeInactive = false) =>
  queryOptions({
    queryKey: ["products", includeInactive],
    queryFn: () => fetchProducts(includeInactive),
    staleTime: 10_000,
  });

export const variantsQuery = () =>
  queryOptions({
    queryKey: ["variants"],
    queryFn: fetchVariants,
    staleTime: 10_000,
  });

export function stockByProduct(variants: Variant[]) {
  const map = new Map<string, number>();
  for (const v of variants) map.set(v.product_id, (map.get(v.product_id) ?? 0) + v.stock);
  return map;
}
