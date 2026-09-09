import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  search?: Record<string, unknown>;
};

const NAV: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/boutique", label: "Boutique", icon: Store },
  { to: "/categories", label: "Catégories", icon: Layers },
  { to: "/boutique", label: "Nouveautés", icon: Sparkles, search: { sort: "nouveautes" } },
  { to: "/boutique", label: "Meilleures ventes", icon: TrendingUp, search: { sort: "best_selling" } },
  { to: "/boutique", label: "Promotions", icon: Tag, search: { promo: true } },
  { to: "/a-propos", label: "À propos", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, isTester, canAccessAdmin, profile, signOut } = useAuth();
  const { count } = useCart();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    void navigate({ to: "/boutique", search: { q: term.trim() || undefined } });
  };

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[#f8f4ee]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(30,20,10,0.04)]">
      <div className="border-b border-border/60 bg-[#f8f4ee]">
        <div className="container-page flex h-16 items-center gap-4">
          <div className="flex min-w-45 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-full border border-border/70" aria-label="Ouvrir le menu">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
                  <span className="font-display text-2xl tracking-[0.2em] text-foreground">MAISON NOVA</span>
                  <div className="h-px w-12 bg-accent" />
                  <form onSubmit={submitSearch} className="flex gap-2">
                    <Input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Rechercher un vêtement…"
                      aria-label="Rechercher"
                      className="h-11"
                    />
                    <Button type="submit" size="icon" className="h-11 w-11 rounded-full" aria-label="Lancer la recherche">
                      <Search className="size-4" />
                    </Button>
                  </form>
                  <nav className="flex flex-col">
                    {NAV.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          search={item.search}
                          onClick={() => setOpen(false)}
                          className="dual-layer-nav-link mobile-nav-link flex items-center gap-3 border-b border-border py-3 text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                          activeProps={{ className: "dual-layer-nav-link dual-layer-nav-active text-accent font-semibold" }}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="flex flex-col gap-2">
                    {user ? (
                      <>
                        <Button asChild variant="secondary" onClick={() => setOpen(false)}>
                          <Link to="/compte">Mon compte</Link>
                        </Button>
                        <Button asChild variant="outline" onClick={() => setOpen(false)}>
                          <Link to="/compte/favoris">Mes favoris</Link>
                        </Button>
                        {canAccessAdmin && (
                          <Button asChild variant="outline" onClick={() => setOpen(false)}>
                            <Link to="/admin">{isTester ? "Espace testeur" : "Espace administrateur"}</Link>
                          </Button>
                        )}
                        <Button variant="ghost" onClick={handleSignOut}>
                          Se déconnecter
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild onClick={() => setOpen(false)}>
                          <Link to="/connexion">Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" onClick={() => setOpen(false)}>
                          <Link to="/inscription">Créer un compte</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="group flex items-center gap-2" aria-label="Maison Nova">
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-card/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 group-hover:border-accent group-hover:text-accent">
                <svg viewBox="0 0 40 40" className="size-8" fill="none" aria-hidden="true">
                  <path d="M20 5C29.4 5 36 11.6 36 20C36 28.4 29.4 35 20 35C10.6 35 4 28.4 4 20C4 11.6 10.6 5 20 5Z" className="stroke-current text-foreground" strokeWidth="1.2" />
                  <path d="M12 28L17.5 14L20 20L22.5 14L28 28" className="stroke-current text-foreground" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.5 14L11 28" className="stroke-current text-accent" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M22.5 14L29 28" className="stroke-current text-accent" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="flex flex-1 justify-center">
            <form onSubmit={submitSearch} className="hidden w-full max-w-md items-center md:flex">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Rechercher…"
                  aria-label="Rechercher un produit"
                  className="h-9 w-full rounded-full border-border/70 bg-card pl-9 text-sm"
                />
              </div>
            </form>
          </div>

          <div className="flex min-w-45 items-center justify-end gap-1">
            <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="Mes favoris">
              <Link to={user ? "/compte/favoris" : "/connexion"}>
                <Heart className="size-5" />
              </Link>
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Mon compte">
                    <User className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {profile?.first_name ? `Bonjour ${profile.first_name}` : "Bonjour"}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/compte">Mon compte</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/commandes">Mes commandes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/favoris">Mes favoris</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/profil">Mes informations</Link>
                  </DropdownMenuItem>
                  {canAccessAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <LayoutDashboard className="mr-2 size-4" /> {isTester ? "Administration testeur" : "Administration"}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="Se connecter">
                <Link to="/connexion">
                  <User className="size-5" />
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" className="relative rounded-full" aria-label="Mon panier">
              <Link to="/panier">
                <ShoppingBag className="size-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-[#f8f4ee]">
        <div className="container-page flex h-12 items-center justify-center">
          <nav className="hidden items-center justify-center gap-7 lg:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  search={item.search}
                  className="dual-layer-nav-link flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-all duration-300 hover:text-foreground"
                  activeProps={{ className: "dual-layer-nav-link dual-layer-nav-active text-foreground font-semibold" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  <Icon className="size-4" />
                  <span className="block transition-all duration-300 hover:-translate-y-0.5">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
