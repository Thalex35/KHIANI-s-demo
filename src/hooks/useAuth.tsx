import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  last_seen_at: string;
};

export type AppRole = "user" | "tester" | "admin";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isTester: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTester, setIsTester] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      setIsAdmin(false);
      setIsTester(false);
      return;
    }
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const detectedRole = roles?.find((r: { role: string }) => r.role === "admin")
      ? "admin"
      : roles?.find((r: { role: string }) => r.role === "tester")
        ? "tester"
        : roles?.find((r: { role: string }) => r.role === "user")
          ? "user"
          : null;

    setProfile((prof as Profile | null) ?? null);
    setRole(detectedRole);
    setIsAdmin(detectedRole === "admin");
    setIsTester(detectedRole === "tester");
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadUserData(data.session?.user.id).finally(() => setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void loadUserData(next?.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    void supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.user.id);
  }, [session?.user.id]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    profile,
    role,
    isAdmin,
    isTester,
    canAccessAdmin: isAdmin || isTester,
    loading,
    refreshProfile: () => loadUserData(session?.user.id),
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setRole(null);
      setIsAdmin(false);
      setIsTester(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
