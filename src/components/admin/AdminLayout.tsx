import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Ticket,
  Users,
  MessageCircle,
  FolderOpen,
  Warehouse,
  ArrowLeft,
  Mail,
  Newspaper,
} from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/categories", label: "Catégories", icon: FolderOpen },
  { to: "/admin/inventaire", label: "Inventaire", icon: Warehouse },
  { to: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { to: "/admin/promotions", label: "Promotions", icon: Tag },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/reviews", label: "Avis", icon: MessageCircle },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AdminLayout({
  title,
  description,
  actions,
  backTo,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  backTo?: string;
  children: ReactNode;
}) {
  const { user, canAccessAdmin, isTester, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) void navigate({ to: "/connexion" });
    else if (!canAccessAdmin) void navigate({ to: "/" });
  }, [loading, user, canAccessAdmin, navigate]);

  if (loading || !user || !canAccessAdmin) {
    return (
      <SiteLayout>
        <div className="container-page py-20">
          <div className="mx-auto h-6 w-48 animate-pulse rounded bg-muted" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {backTo ? (
        <div className="border-b border-border">
          <div className="container-page py-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to={backTo}>
                <ArrowLeft className="size-4" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
      <PageHeader eyebrow={isTester ? "Administration — TEST MODE" : "Administration"} title={title} description={description} />
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/admin" }}
              activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
              className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition hover:border-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          {actions && <div className="mb-5 flex flex-wrap gap-2">{actions}</div>}
          {children}
        </div>
      </div>
    </SiteLayout>
  );
}
