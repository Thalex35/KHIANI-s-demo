import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/lib/shop";

export type AdminOrder = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment_method: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  created_at: string;
  order_items: {
    id: string;
    product_id: string;
    name: string;
    image_url: string;
    size: string;
    color: string;
    unit_price: number;
    quantity: number;
  }[];
};

export type AdminProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  last_seen_at: string;
};

export const adminOrdersQuery = () =>
  queryOptions({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminOrder[];
    },
  });

export const adminProfilesQuery = () =>
  queryOptions({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminProfile[];
    },
  });

export const adminRolesQuery = () =>
  queryOptions({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as unknown as { user_id: string; role: "admin" | "user" }[];
    },
  });

export const adminFavoritesQuery = () =>
  queryOptions({
    queryKey: ["admin", "favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("user_id, product_id");
      if (error) throw error;
      return (data ?? []) as unknown as { user_id: string; product_id: string }[];
    },
  });

export const isSameDay = (value: string, ref = new Date()) => {
  const d = new Date(value);
  return (
    d.getDate() === ref.getDate() &&
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
};

export const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};
