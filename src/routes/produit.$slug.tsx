import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, Ruler, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { colorHex, discountPercent, effectivePrice, formatPrice } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export const Route = createFileRoute("/produit/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Fiche produit — MAISON NOVA` },
      {
        name: "description",
        content: `Découvrez ce vêtement de la collection MAISON NOVA : tailles, couleurs, matières et disponibilité (${params.slug}).`,
      },
      { property: "og:title", content: "Fiche produit — MAISON NOVA" },
      {
        property: "og:description",
        content: "Tailles, couleurs, matières et disponibilité en temps réel.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  useCatalogRealtime();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: products, isLoading } = useQuery(productsQuery());
  const { data: variants } = useQuery(variantsQuery());

  const product = (products ?? []).find((p) => p.slug === slug);
  const productVariants = (variants ?? []).filter((v) => v.product_id === product?.id);

  const productId = product?.id;
  const recentlyViewedIds = useRecentlyViewed(productId);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (productId) {
      void supabase.rpc("increment_product_metric", { _product_id: productId, _metric: "views" });
    }
  }, [productId]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container-page grid gap-8 py-10 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="container-page py-16">
          <EmptyState
            title="Produit introuvable"
            text="Ce produit n'existe pas ou n'est plus disponible."
            action={
              <Button asChild>
                <Link to="/boutique">Retour à la boutique</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  const price = effectivePrice(product);
  const promo = discountPercent(product);
  const images = product.images.length ? product.images : [product.cover_url];
  const totalStock = productVariants.reduce((n, v) => n + v.stock, 0);
  const lowStock = totalStock > 0 && totalStock <= 3;
  const selected = productVariants.find((v) => v.size === size && v.color === color);
  const stockFor = (s: string, c: string) =>
    productVariants.find((v) => v.size === s && v.color === c)?.stock ?? 0;
  const sizeAvailable = (s: string) =>
    color ? stockFor(s, color) > 0 : productVariants.some((v) => v.size === s && v.stock > 0);
  const colorAvailable = (c: string) =>
    size ? stockFor(size, c) > 0 : productVariants.some((v) => v.color === c && v.stock > 0);

  const similar = (products ?? [])
    .filter((p) => p.id !== product.id && p.subcategory === product.subcategory)
    .slice(0, 4);
  const recentlyViewed = recentlyViewedIds
    .map((id) => (products ?? []).find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const handleAdd = () => {
    if (!size || !color) {
      toast.error("Veuillez sélectionner une taille et une couleur");
      return;
    }
    if (!selected || selected.stock <= 0) {
      toast.error("Cette variante est épuisée");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.cover_url,
      unitPrice: price,
      oldPrice: product.sale_price != null ? Number(product.price) : null,
      size,
      color,
      quantity: Math.min(quantity, selected.stock),
      maxStock: selected.stock,
    });
    void supabase.rpc("increment_product_metric", {
      _product_id: product.id,
      _metric: "cart_adds",
    });
    toast.success("Produit ajouté au panier", {
      action: { label: "Voir le panier", onClick: () => void navigate({ to: "/panier" }) },
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    if (selected && size && color) {
      void navigate({ to: user ? "/commander" : "/connexion" });
    }
  };

  const handleShare = async () => {
    const shareData = { title: product.name, text: product.description, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
    toast.success("Lien du produit copié");
  };

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
    <SiteLayout>
      <div className="container-page py-6 sm:py-10">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Accueil
          </Link>
          <span className="px-1.5">/</span>
          <Link to="/boutique" className="hover:text-accent">
            Boutique
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          <div>
            <div className="overflow-hidden rounded-lg bg-sand/50">
              <img
                src={images[activeImage] ?? product.cover_url}
                alt={product.name}
                width={900}
                height={1100}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "size-20 shrink-0 overflow-hidden rounded-md border-2",
                      i === activeImage ? "border-accent" : "border-transparent",
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} — vue ${i + 1}`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow text-accent">
              {product.category} · {product.subcategory}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatPrice(price)}</span>
              {promo > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    -{promo}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-sm">
              {totalStock > 0 ? (
                <span className={lowStock ? "text-accent" : "text-success"}>
                  {lowStock
                    ? `Plus que ${totalStock} pièce(s) disponibles`
                    : `En stock (${totalStock} pièces)`}
                </span>
              ) : (
                <span className="text-destructive">Rupture de stock</span>
              )}
            </p>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Couleurs */}
            <div className="mt-7">
              <p className="eyebrow text-muted-foreground">
                Couleur {color && <span className="text-foreground">— {color}</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const dispo = colorAvailable(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      title={dispo ? c : `${c} — épuisé`}
                      className={cn(
                        "relative size-10 rounded-full border-2 transition",
                        color === c ? "border-accent" : "border-border",
                        !dispo && "opacity-40",
                      )}
                      style={{ backgroundColor: colorHex(c) }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tailles */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-muted-foreground">
                  Taille {size && <span className="text-foreground">— {size}</span>}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-auto px-0 text-xs">
                      <Ruler className="mr-1.5 size-3.5" /> Guide des tailles
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Guide des tailles</DialogTitle>
                      <DialogDescription>
                        Mesurez votre tour de poitrine et comparez-le au tableau. Si vous êtes entre
                        deux tailles, choisissez la plus grande.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="p-2 font-medium">Taille</th>
                            <th className="p-2 font-medium">Poitrine</th>
                            <th className="p-2 font-medium">Taille</th>
                            <th className="p-2 font-medium">Hanches</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["XS", "80–84 cm", "64–68 cm", "88–92 cm"],
                            ["S", "85–89 cm", "69–73 cm", "93–97 cm"],
                            ["M", "90–94 cm", "74–78 cm", "98–102 cm"],
                            ["L", "95–100 cm", "79–84 cm", "103–108 cm"],
                            ["XL", "101–106 cm", "85–90 cm", "109–114 cm"],
                            ["XXL", "107–112 cm", "91–96 cm", "115–120 cm"],
                          ].map(([label, chest, waist, hips]) => (
                            <tr key={label} className="border-b border-border last:border-0">
                              <td className="p-2 font-medium">{label}</td>
                              <td className="p-2 text-muted-foreground">{chest}</td>
                              <td className="p-2 text-muted-foreground">{waist}</td>
                              <td className="p-2 text-muted-foreground">{hips}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const dispo = sizeAvailable(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      disabled={!dispo}
                      className={cn(
                        "min-w-12 rounded-md border px-3 py-2.5 text-sm transition",
                        size === s
                          ? "border-foreground bg-primary text-primary-foreground"
                          : "border-border hover:border-foreground",
                        !dispo &&
                          "cursor-not-allowed text-muted-foreground line-through opacity-50",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {size && color && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selected && selected.stock > 0
                    ? `${selected.stock} pièce(s) disponibles en ${color} / ${size}`
                    : `Variante ${color} / ${size} épuisée`}
                </p>
              )}
            </div>

            {/* Quantité + actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Diminuer la quantité"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Augmenter la quantité"
                  onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 10, q + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <Button className="flex-1 min-w-45" size="lg" onClick={handleAdd}>
                <ShoppingBag className="mr-2 size-4" /> Ajouter au panier
              </Button>
              <Button variant="secondary" size="lg" onClick={handleBuyNow}>
                Acheter maintenant
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onFavorite}
                aria-label="Ajouter aux favoris"
              >
                <Heart
                  className={cn("size-4", isFavorite(product.id) && "fill-accent text-accent")}
                />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 px-0"
              onClick={() => void handleShare()}
            >
              <Share2 className="mr-1.5 size-4" /> Partager ce produit
            </Button>

            <Accordion type="single" collapsible className="mt-8" defaultValue="infos">
              <AccordionItem value="infos">
                <AccordionTrigger>Informations produit</AccordionTrigger>
                <AccordionContent>
                  <dl className="grid gap-2 text-sm">
                    {[
                      ["Matière", product.material],
                      ["Composition", product.composition],
                      ["Coupe", product.fit],
                      ["Entretien", product.care],
                      ["Pays de fabrication", product.origin],
                      ["Référence", product.sku],
                    ].map(([label, value]) =>
                      value ? (
                        <div
                          key={label}
                          className="flex justify-between gap-4 border-b border-border pb-2"
                        >
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="text-right">{value}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="livraison">
                <AccordionTrigger>Livraison et retours</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Livraison offerte dès 80 € d'achat, expédition sous 48 h. Retours gratuits sous 30
                  jours.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl">Produits similaires</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {similar.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  stock={stockByProduct(variants ?? []).get(p.id)}
                />
              ))}
            </div>
          </section>
        )}

        {recentlyViewed.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl">Récemment consultés</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {recentlyViewed.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  stock={stockByProduct(variants ?? []).get(p.id)}
                />
              ))}
            </div>
          </section>
        )}

        <ProductReviews productId={product.id} />
      </div>
    </SiteLayout>
  );
}
