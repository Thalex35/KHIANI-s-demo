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

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "resolved";
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  status: "active" | "inactive";
  subscribed_at: string;
  created_at: string;
  updated_at: string;
};

export type StoreSetting = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type ActiveAdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "tester" | "user";
  last_seen_at: string;
  online: boolean;
};

export type UserStatusRow = {
  user_id: string;
  is_online: boolean;
  last_active: string;
  session_id: string | null;
  updated_at: string;
};

export const adminUserStatusRealtimeListener = (onUserStatusChanged: () => void) => {
  const channel = supabase.channel("admin-user-status-realtime");

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "user_status",
    },
    () => {
      onUserStatusChanged();
    },
  );

  void channel.subscribe();

  return () => {
    void channel.unsubscribe();
    supabase.removeChannel(channel);
  };
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
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminProfile[];
    },
  });

export const adminPresenceQuery = () =>
  queryOptions({
    queryKey: ["admin", "user-status"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_status" as any).select("*");
      if (error) throw error;
      return (data ?? []) as UserStatusRow[];
    },
  });

export const adminActiveUsersQuery = () =>
  queryOptions({
    queryKey: ["admin", "active-users"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const now = Date.now();
      const idleMs = 5 * 60 * 1000;

      const [{ data: profiles, error: profilesError }, { data: statuses, error: statusesError }, { data: roles, error: rolesError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, email, last_seen_at")
            .order("last_seen_at", { ascending: false }),
          supabase.from("user_status" as any).select("user_id, is_online, last_active, session_id, updated_at"),
          supabase.from("user_roles").select("user_id, role"),
        ]);

      if (profilesError) throw profilesError;
      if (statusesError) throw statusesError;
      if (rolesError) throw rolesError;

      const roleRows = (roles ?? []) as Array<{ user_id: string; role: "admin" | "tester" | "user" }>;
      const rolePriority: Record<"admin" | "tester" | "user", number> = {
        admin: 3,
        tester: 2,
        user: 1,
      };
      const roleByUser = new Map<string, "admin" | "tester" | "user">();
      for (const row of roleRows) {
        const current = roleByUser.get(row.user_id);
        if (!current || rolePriority[row.role] > rolePriority[current]) {
          roleByUser.set(row.user_id, row.role);
        }
      }

      type ProfileLookup = {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        last_seen_at: string;
      };

      const profileById = new Map<string, ProfileLookup>();
      for (const profile of profiles ?? []) {
        profileById.set(profile.id, profile as ProfileLookup);
      }

      const active = (statuses ?? [])
        .filter((status: UserStatusRow) => status.is_online && now - new Date(status.last_active).getTime() <= idleMs)
        .map((status: UserStatusRow) => {
          const profile = profileById.get(status.user_id);
          if (!profile) return null;

          return {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            role: roleByUser.get(profile.id) ?? "user",
            last_seen_at: status.last_active,
            online: status.is_online,
          } as ActiveAdminUser;
        })
        .filter((item): item is ActiveAdminUser => Boolean(item));

      return active;
    },
  });

export const adminRolesQuery = () =>
  queryOptions({
    queryKey: ["admin", "roles"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as unknown as { user_id: string; role: "admin" | "tester" | "user" }[];
    },
  });

export const adminContactMessagesQuery = () =>
  queryOptions({
    queryKey: ["admin", "contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ContactMessage[];
    },
  });

export const adminNewsletterSubscribersQuery = () =>
  queryOptions({
    queryKey: ["admin", "newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NewsletterSubscriber[];
    },
  });

export const storeSettingsQuery = () =>
  queryOptions({
    queryKey: ["store", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as StoreSetting[];
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
