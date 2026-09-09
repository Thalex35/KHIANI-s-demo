import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/shop";
import { itemKey, type CartItem, useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Mon panier — MAISON NOVA" },
      {
        name: "description",
        content:
          "Vérifiez vos articles, ajustez les quantités et passez commande en toute sécurité.",
      },
      { property: "og:title", content: "Mon panier — MAISON NOVA" },
      { property: "og:description", content: "Vérifiez vos articles et passez commande." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, discount, total, addItem, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const [saved, setSaved] = useState<CartItem[]>([]);
  const shipping = total >= 80 || total === 0 ? 0 : 5.9;

  useEffect(() => {
    try {
      setSaved(
        JSON.parse(localStorage.getItem("maison-nova-panier-sauvegarde") ?? "[]") as CartItem[],
      );
    } catch {
      setSaved([]);
    }
  }, []);

  const saveForLater = (item: CartItem) => {
    const next = [...saved.filter((entry) => itemKey(entry) !== itemKey(item)), item];
    setSaved(next);
    localStorage.setItem("maison-nova-panier-sauvegarde", JSON.stringify(next));
    removeItem(itemKey(item));
  };

  const moveToCart = (item: CartItem) => {
    addItem(item);
    const next = saved.filter((entry) => itemKey(entry) !== itemKey(item));
    setSaved(next);
    localStorage.setItem("maison-nova-panier-sauvegarde", JSON.stringify(next));
  };

  return (
    <SiteLayout>
      <PageHeader eyebrow="Commande" title="Mon panier" />
      <div className="container-page py-10">
        {items.length === 0 ? (
          <EmptyState
            title="Votre panier est vide"
            text="Parcourez la boutique et ajoutez vos coups de cœur."
            action={
              <Button asChild>
                <Link to="/boutique">Découvrir la collection</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-4">
              {items.map((item) => {
                const key = itemKey(item);
                return (
                  <li key={key} className="surface-card flex gap-4 p-3 sm:p-4">
                    <Link to="/produit/$slug" params={{ slug: item.slug }} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="size-24 rounded-md object-cover sm:size-28"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to="/produit/$slug"
                            params={{ slug: item.slug }}
                            className="block truncate font-medium hover:text-accent"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Taille {item.size} · {item.color}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Retirer du panier"
                          onClick={() => removeItem(key)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                        <div className="flex items-center rounded-md border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Diminuer"
                            onClick={() => updateQuantity(key, item.quantity - 1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="w-9 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Augmenter"
                            disabled={item.quantity >= item.maxStock}
                            onClick={() => updateQuantity(key, item.quantity + 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          {item.quantity >= item.maxStock && (
                            <p className="text-xs text-muted-foreground">
                              Stock maximum atteint ({item.maxStock})
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveForLater(item)}
                        className="mt-2 self-start text-xs text-muted-foreground hover:text-accent hover:underline"
                      >
                        Sauvegarder pour plus tard
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {saved.length > 0 && (
              <section className="surface-card p-4">
                <h2 className="text-lg">Sauvegardés pour plus tard</h2>
                <ul className="mt-3 space-y-3">
                  {saved.map((item) => (
                    <li key={itemKey(item)} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-14 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveToCart(item)}
                      >
                        Ajouter au panier
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
              <h2 className="text-xl">Résumé</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sous-total</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent">
                    <dt>Réductions</dt>
                    <dd>-{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Livraison</dt>
                  <dd>{shipping === 0 ? "Offerte" : formatPrice(shipping)}</dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-semibold">{formatPrice(total + shipping)}</span>
              </div>
              <Button asChild size="lg" className="mt-5 w-full">
                <Link to={user ? "/commander" : "/connexion"}>
                  {user ? "Passer la commande" : "Se connecter pour commander"}
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to="/boutique">Continuer mes achats</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
