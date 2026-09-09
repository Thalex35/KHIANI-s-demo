import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, MapPin, Package, User as UserIcon, LayoutDashboard } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { to: "/compte", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/compte/commandes", label: "Mes commandes", icon: Package },
  { to: "/compte/favoris", label: "Mes favoris", icon: Heart },
  { to: "/compte/adresses", label: "Mes adresses", icon: MapPin },
  { to: "/compte/profil", label: "Mes informations", icon: UserIcon },
] as const;

export function AccountLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <SiteLayout>
        <div className="container-page py-20">
          <div className="mx-auto h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Mon compte" title={title} description={description} />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/compte" }}
              activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
              className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition hover:border-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="justify-start gap-2 lg:mt-2"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" /> Se déconnecter
          </Button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </SiteLayout>
  );
}
