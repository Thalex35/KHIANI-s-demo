import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { discountPercent, effectivePrice, formatPrice, type Product } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

export function ProductCard({ product, stock }: { product: Product; stock?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const price = effectivePrice(product);
  const promo = discountPercent(product);
  const outOfStock = stock !== undefined && stock <= 0;

  const onFavorite = () => {
    if (!user) {
      toast("Connectez-vous pour enregistrer vos favoris", {
        action: { label: "Se connecter", onClick: () => void navigate({ to: "/connexion" }) },
      });
      return;
    }
    toggleFavorite(product.id);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-lg bg-sand/50">
        <Link
          to="/produit/$slug"
          params={{ slug: product.slug }}
          aria-label={`Voir ${product.name}`}
        >
          <img
            src={product.cover_url}
            alt={product.name}
            loading="lazy"
            width={900}
            height={1100}
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
          {product.is_new && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Nouveau
            </span>
          )}
          {promo > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              -{promo}%
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Épuisé
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onFavorite}
          aria-label={
            isFavorite(product.id) ? "Retirer de mes favoris" : "Ajouter à mes favoris"
          }
          className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-background/85 text-foreground shadow-soft transition hover:bg-background"
        >
          <Heart
            className={cn("size-4", isFavorite(product.id) && "fill-accent text-accent")}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="eyebrow text-muted-foreground">{product.subcategory}</p>
        <h3 className="mt-1 text-base leading-snug">
          <Link to="/produit/$slug" params={{ slug: product.slug }} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatPrice(price)}</span>
          {promo > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {outOfStock ? "Rupture de stock" : "En stock"}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link to="/produit/$slug" params={{ slug: product.slug }}>
            Voir le produit
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] w-full rounded-lg bg-muted" />
          <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
          <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
