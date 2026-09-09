import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_METHODS, formatPrice } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/commander")({
  head: () => ({
    meta: [
      { title: "Finaliser ma commande — MAISON NOVA" },
      {
        name: "description",
        content: "Renseignez vos informations de livraison et validez votre commande MAISON NOVA.",
      },
      { property: "og:title", content: "Finaliser ma commande — MAISON NOVA" },
      { property: "og:description", content: "Livraison et paiement en quelques étapes." },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, { message: "Nom complet requis" }).max(120),
  phone: z.string().trim().min(6, { message: "Téléphone requis" }).max(30),
  address: z.string().trim().min(5, { message: "Adresse requise" }).max(200),
  city: z.string().trim().min(2, { message: "Ville requise" }).max(80),
  country: z.string().trim().min(2, { message: "Pays requis" }).max(80),
  notes: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useAuth();
  const { items, subtotal, discount, total, clear } = useCart();
  const shipping = total >= 80 || total === 0 ? 0 : 5.9;

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    country: "France",
    notes: "",
  });
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]!.id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      full_name: f.full_name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
      phone: f.phone || profile.phone || "",
      address: f.address || profile.address || "",
      city: f.city || profile.city || "",
      country: profile.country || f.country,
    }));
  }, [profile]);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    if (!user || items.length === 0) return;

    setSubmitting(true);
    const orderNumber = `MN-${Date.now().toString().slice(-8)}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "en_attente",
        subtotal,
        discount,
        shipping,
        total: total + shipping,
        payment_method: payment,
        ...parsed.data,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      setError("La commande n'a pas pu être enregistrée. Veuillez réessayer.");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        name: i.name,
        image_url: i.image,
        size: i.size,
        color: i.color,
        unit_price: i.unitPrice,
        quantity: i.quantity,
      })),
    );

    if (itemsError) {
      setSubmitting(false);
      setError("Les articles de la commande n'ont pas pu être enregistrés.");
      return;
    }

    await Promise.all(
      items.map((i) =>
        supabase.rpc("decrement_variant_stock", {
          _product_id: i.productId,
          _size: i.size,
          _color: i.color,
          _qty: i.quantity,
        }),
      ),
    );

    clear();
    await queryClient.invalidateQueries();
    setSubmitting(false);
    toast.success(`Commande ${order.order_number} confirmée !`);
    void navigate({ to: "/compte/commandes" });
  };

  if (items.length === 0) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Commande" title="Finaliser ma commande" />
        <div className="container-page py-12">
          <EmptyState
            title="Aucun article à commander"
            text="Ajoutez des articles à votre panier avant de passer commande."
            action={
              <Button asChild>
                <Link to="/boutique">Aller à la boutique</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Commande"
        title="Finaliser ma commande"
        description="Paiement de démonstration : aucune transaction réelle n'est effectuée."
      />
      <div className="container-page py-10">
        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="surface-card p-5 sm:p-6">
              <h2 className="text-xl">Informations de livraison</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input id="full_name" value={form.full_name} onChange={set("full_name")} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={form.phone} onChange={set("phone")} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" value={form.city} onChange={set("city")} className="mt-1.5" required />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={form.address} onChange={set("address")} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input id="country" value={form.country} onChange={set("country")} className="mt-1.5" required />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Instructions de livraison (facultatif)</Label>
                  <Textarea id="notes" value={form.notes} onChange={set("notes")} className="mt-1.5" rows={3} />
                </div>
              </div>
            </section>

            <section className="surface-card p-5 sm:p-6">
              <h2 className="text-xl">Mode de paiement</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mode démonstration : la commande est enregistrée sans débit réel.
              </p>
              <RadioGroup value={payment} onValueChange={setPayment} className="mt-4 grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => (
                  <Label
                    key={method.id}
                    htmlFor={method.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:border-foreground has-[:checked]:border-accent"
                  >
                    <RadioGroupItem id={method.id} value={method.id} />
                    <span className="text-sm">{method.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <section className="surface-card p-5 sm:p-6">
              <h2 className="text-xl">Récapitulatif des articles</h2>
              <ul className="mt-4 space-y-3">
                {items.map((i) => (
                  <li key={`${i.productId}-${i.size}-${i.color}`} className="flex items-center gap-3">
                    <img src={i.image} alt={i.name} loading="lazy" className="size-14 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.size} · {i.color} · ×{i.quantity}
                      </p>
                    </div>
                    <span className="text-sm">{formatPrice(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
            <h2 className="text-xl">Total</h2>
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
              <span className="font-medium">À payer</span>
              <span className="text-xl font-semibold">{formatPrice(total + shipping)}</span>
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
              {submitting ? "Validation en cours…" : "Confirmer la commande"}
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/panier">Retour au panier</Link>
            </Button>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
