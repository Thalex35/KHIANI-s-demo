import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User } from "lucide-react";
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

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/boutique", label: "Boutique" },
  { to: "/categories", label: "Catégories" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, profile, signOut } = useAuth();
  const { count } = useCart();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setOpen(false);
    void navigate({ to: "/boutique", search: { q: term.trim() || undefined } });
  };

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2 md:h-20">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
              <span className="font-display text-2xl tracking-[0.2em]">MAISON NOVA</span>
              <form onSubmit={submitSearch} className="flex gap-2">
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Rechercher un vêtement…"
                  aria-label="Rechercher"
                />
                <Button type="submit" size="icon" aria-label="Lancer la recherche">
                  <Search className="size-4" />
                </Button>
              </form>
              <nav className="flex flex-col">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="border-b border-border py-3 text-base"
                    activeProps={{ className: "text-accent font-semibold" }}
                  >
                    {item.label}
                  </Link>
                ))}
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
                    {isAdmin && (
                      <Button asChild variant="outline" onClick={() => setOpen(false)}>
                        <Link to="/admin">Espace administrateur</Link>
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

        <Link to="/" className="font-display text-lg tracking-[0.24em] sm:text-xl">
          MAISON NOVA
        </Link>

        <nav className="ml-8 hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form onSubmit={submitSearch} className="hidden items-center xl:flex">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher un produit"
              className="h-9 w-48"
            />
          </form>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label="Rechercher"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="size-5" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Mes favoris">
            <Link to={user ? "/compte/favoris" : "/connexion"}>
              <Heart className="size-5" />
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Mon compte">
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
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <LayoutDashboard className="mr-2 size-4" /> Administration
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
            <Button asChild variant="ghost" size="icon" aria-label="Se connecter">
              <Link to="/connexion">
                <User className="size-5" />
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Mon panier">
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

      {searchOpen && (
        <div className="border-t border-border bg-background p-3 xl:hidden">
          <form onSubmit={submitSearch} className="container-page flex gap-2">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="T-shirt, jean, robe noire…"
              aria-label="Rechercher un produit"
            />
            <Button type="submit">Rechercher</Button>
          </form>
        </div>
      )}
    </header>
  );
}
