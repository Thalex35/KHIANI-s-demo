import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, MapPin, PackageCheck, Truck } from "lucide-react";
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
import { storeSettingsQuery } from "@/lib/admin";
import { PAYMENT_METHODS, formatPrice } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { DeliveryMapPicker } from "@/components/shop/DeliveryMapPicker";

export const Route = createFileRoute("/commander")({
  head: () => ({
    meta: [
      { title: "Finaliser ma commande — MAISON NOVA" },
      { name: "description", content: "Finalisez votre commande en quatre étapes." },
    ],
  }),
  component: CheckoutPage,
});

const customerSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Nom complet requis" }).max(120),
  phone: z.string().trim().min(6, { message: "Téléphone requis" }).max(30),
});

const deliverySchema = z.object({
  address: z.string().trim().min(5, { message: "Adresse requise" }).max(200),
  city: z.string().trim().min(2, { message: "Ville requise" }).max(80),
  country: z.string().trim().min(2, { message: "Pays requis" }).max(80),
  notes: z.string().trim().max(500),
});

type CheckoutForm = {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
};

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Livraison standard", detail: "2 à 5 jours ouvrés", fee: 5.9 },
  { id: "express", label: "Livraison express", detail: "1 à 2 jours ouvrés", fee: 12.9 },
  { id: "pickup", label: "Retrait en boutique", detail: "Disponible sous 24 h", fee: 0 },
] as const;

const STEP_LABELS = ["Coordonnées", "Livraison", "Paiement", "Vérification"];

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useAuth();
  const { items, subtotal, discount, total, clear } = useCart();
  const { data: storeSettings = [] } = useQuery(storeSettingsQuery());
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    country: "France",
    notes: "",
    delivery_latitude: 48.8566,
    delivery_longitude: 2.3522,
  });
  const [payment, setPayment] = useState("demo");
  const [delivery, setDelivery] = useState("standard");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDelivery =
    DELIVERY_OPTIONS.find((option) => option.id === delivery) ?? DELIVERY_OPTIONS[0];
  const settingsMap = new Map((storeSettings ?? []).map((row) => [row.key, row.value]));
  const configuredDeliveryFee = Number.parseFloat(String(settingsMap.get("delivery_fee") ?? "5.90"));
  const configuredFreeThreshold = Number.parseFloat(String(settingsMap.get("free_shipping_at") ?? "80"));
  const shipping = total >= configuredFreeThreshold && delivery === "standard" ? 0 : selectedDelivery.id === "standard" ? configuredDeliveryFee : selectedDelivery.fee;
  const totalWithCoupon = total + couponDiscount;
  const grandTotal = totalWithCoupon + shipping;

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setForm((current) => ({
      ...current,
      full_name:
        current.full_name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
      phone: current.phone || profile.phone || "",
      address: current.address || profile.address || "",
      city: current.city || profile.city || "",
      country: profile.country || current.country,
    }));
  }, [profile]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Veuillez entrer un code");
      return;
    }

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .single();

      if (error || !coupon) {
        setCouponError("Code de réduction invalide");
        setValidatingCoupon(false);
        return;
      }

      // Check if coupon is active and not expired
      if (!coupon.is_active) {
        setCouponError("Ce code de réduction n'est pas actif");
        setValidatingCoupon(false);
        return;
      }

      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
        setCouponError("Ce code de réduction a expiré");
        setValidatingCoupon(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        setCouponError("Ce code de réduction a atteint sa limite d'utilisation");
        setValidatingCoupon(false);
        return;
      }

      // Check minimum order value
      if (coupon.minimum_order_value && total < coupon.minimum_order_value) {
        setCouponError(
          `Montant minimum requis : ${formatPrice(coupon.minimum_order_value)}`
        );
        setValidatingCoupon(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.coupon_type === "percentage") {
        discountAmount = -(total * coupon.discount_value) / 100;
        if (coupon.maximum_discount && Math.abs(discountAmount) > coupon.maximum_discount) {
          discountAmount = -coupon.maximum_discount;
        }
      } else {
        discountAmount = -coupon.discount_value;
      }

      setCouponDiscount(discountAmount);
      setCouponApplied(true);
      setCouponError(null);
      toast.success("Code appliqué !");
    } catch (err) {
      setCouponError("Une erreur est survenue");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError(null);
  };

  const set =
    (key: keyof CheckoutForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const validateStep = () => {
    const result = step === 1 ? customerSchema.safeParse(form) : deliverySchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Veuillez vérifier les informations");
      return false;
    }
    setError(null);
    return true;
  };

  const reverseGeocodeCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as {
        address?: {
          house_number?: string;
          road?: string;
          pedestrian?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          county?: string;
          country?: string;
          country_code?: string;
        };
        display_name?: string;
      };

      const addressParts = payload.address ?? {};
      const streetPart = [addressParts.house_number, addressParts.road ?? addressParts.pedestrian]
        .filter(Boolean)
        .join(" ");
      const cityPart = addressParts.city ?? addressParts.town ?? addressParts.village ?? addressParts.municipality ?? addressParts.county ?? "";
      const countryPart = addressParts.country ?? "";

      setForm((current) => ({
        ...current,
        address: streetPart || current.address,
        city: cityPart || current.city,
        country: countryPart || current.country,
      }));
    } catch {
      // Reverse geocoding is optional; if the service fails, the address fields stay editable.
    }
  };

  const next = () => {
    if (step <= 2 && !validateStep()) return;
    setStep((current) => Math.min(4, current + 1));
  };

  const previous = () => {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || items.length === 0) return;
    if (!validateStep()) return;

    setSubmitting(true);
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 700));

    if (simulateFailure) {
      setSubmitting(false);
      setError("Le paiement de démonstration a échoué. Désactivez le test d'échec puis réessayez.");
      return;
    }

    const { data: orderRows, error: secureOrderError } = await supabase.rpc(
      "create_order_secure",
      {
        p_user_id: user.id,
        p_full_name: form.full_name,
        p_phone: form.phone,
        p_address: form.address,
        p_city: form.city,
        p_country: form.country,
        p_notes: form.notes,
        p_delivery_option: delivery,
        p_payment_method: payment,
        p_discount: discount + Math.abs(couponDiscount),
        p_shipping: shipping,
        p_subtotal: subtotal,
        p_total: grandTotal,
        p_delivery_latitude: form.delivery_latitude ?? null,
        p_delivery_longitude: form.delivery_longitude ?? null,
        p_items: items.map((item) => ({
          product_id: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      },
    );

    if (secureOrderError || !orderRows || !Array.isArray(orderRows) || orderRows.length === 0) {
      setSubmitting(false);
      setError("La commande n'a pas pu être enregistrée. Veuillez réessayer.");
      return;
    }

    const order = orderRows[0] as { id: string; order_number: string };

    // Increment coupon usage count if coupon was applied
    if (couponApplied && couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("usage_count")
        .eq("code", couponCode.toUpperCase())
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ usage_count: coupon.usage_count + 1 })
          .eq("code", couponCode.toUpperCase())
          .catch(() => {
            // Fail silently - order was already created
          });
      }
    }

    clear();
    await queryClient.invalidateQueries();
    setSubmitting(false);
    toast.success("Paiement de démonstration réussi");
    void navigate({ to: "/commande-confirmee/$id", params: { id: order.id } });
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
        <div className="mb-8 grid grid-cols-4 gap-2">
          {STEP_LABELS.map((label, index) => {
            const number = index + 1;
            return (
              <div
                key={label}
                className={`border-t-2 pt-2 text-xs ${number <= step ? "border-accent text-foreground" : "border-border text-muted-foreground"}`}
              >
                <span className="font-semibold">0{number}</span> {label}
              </div>
            );
          })}
        </div>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {step === 1 && (
              <section className="surface-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-accent" />
                  <h2 className="text-xl">Vos coordonnées</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ces informations seront associées à la commande.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={set("full_name")}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" value={user?.email ?? ""} className="mt-1.5" disabled />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={set("phone")}
                      className="mt-1.5"
                      required
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="surface-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Truck className="size-5 text-accent" />
                  <h2 className="text-xl">Livraison</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={set("address")}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={set("city")}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={set("country")}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <DeliveryMapPicker
                      latitude={form.delivery_latitude ?? 48.8566}
                      longitude={form.delivery_longitude ?? 2.3522}
                      onChange={(coordinates) =>
                        setForm((current) => ({
                          ...current,
                          delivery_latitude: coordinates.latitude,
                          delivery_longitude: coordinates.longitude,
                        }))
                      }
                      onConfirm={(coordinates) => reverseGeocodeCoordinates(coordinates.latitude, coordinates.longitude)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Instructions de livraison</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={set("notes")}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                </div>
                <RadioGroup value={delivery} onValueChange={setDelivery} className="mt-6 space-y-3">
                  {DELIVERY_OPTIONS.map((option) => (
                    <Label
                      key={option.id}
                      htmlFor={`delivery-${option.id}`}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border p-3 has-checked:border-accent"
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem id={`delivery-${option.id}`} value={option.id} />
                        <span>
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.detail}</span>
                        </span>
                      </span>
                      <span className="text-sm">
                        {option.fee === 0 || (option.id === "standard" && total >= 80)
                          ? "Offerte"
                          : formatPrice(option.fee)}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </section>
            )}

            {step === 3 && (
              <section className="surface-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-accent" />
                  <h2 className="text-xl">Paiement</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Simulation uniquement : aucun débit réel ne sera effectué.
                </p>

                {/* Coupon section */}
                <div className="mt-5 rounded-lg border border-border p-4">
                  <Label htmlFor="coupon" className="mb-2 block text-sm font-medium">
                    Code de réduction (optionnel)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Entrez votre code"
                      className="font-mono"
                      disabled={couponApplied}
                    />
                    {!couponApplied ? (
                      <Button
                        type="button"
                        onClick={applyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        size="sm"
                      >
                        {validatingCoupon ? "..." : "Appliquer"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={removeCoupon}
                        size="sm"
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                  {couponError && (
                    <p className="mt-2 text-sm text-destructive">{couponError}</p>
                  )}
                  {couponApplied && (
                    <p className="mt-2 text-sm text-green-600">✓ Code appliqué</p>
                  )}
                </div>

                <RadioGroup
                  value={payment}
                  onValueChange={setPayment}
                  className="mt-5 grid gap-3 sm:grid-cols-2"
                >
                  {[
                    ...PAYMENT_METHODS,
                    { id: "cash", label: "Paiement à la livraison", hint: "Simulation" },
                  ].map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={`payment-${method.id}`}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 has-checked:border-accent"
                    >
                      <RadioGroupItem id={`payment-${method.id}`} value={method.id} />
                      <span>
                        <span className="block text-sm">{method.label}</span>
                        <span className="text-xs text-muted-foreground">{method.hint}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
                <label className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(event) => setSimulateFailure(event.target.checked)}
                    className="size-4 accent-(--color-accent)"
                  />{" "}
                  Simuler un échec de paiement
                </label>
              </section>
            )}

            {step === 4 && (
              <section className="surface-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <PackageCheck className="size-5 text-accent" />
                  <h2 className="text-xl">Vérifier la commande</h2>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Client</dt>
                    <dd>{form.full_name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Livraison</dt>
                    <dd className="text-right">
                      {selectedDelivery.label}
                      <br />
                      {form.city}, {form.country}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paiement</dt>
                    <dd>
                      {
                        [...PAYMENT_METHODS, { id: "cash", label: "Paiement à la livraison" }].find(
                          (method) => method.id === payment,
                        )?.label
                      }
                    </dd>
                  </div>
                </dl>
                <Separator className="my-5" />
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex items-center gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-14 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {item.name} · {item.size} / {item.color} × {item.quantity}
                      </span>
                      <span className="text-sm">{formatPrice(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="outline" onClick={previous} disabled={step === 1}>
                Retour
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={next}>
                  Continuer
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  <Check className="mr-2 size-4" />
                  {submitting ? "Paiement en cours…" : "Payer et confirmer"}
                </Button>
              )}
            </div>
          </div>

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
              {couponDiscount < 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Coupon</dt>
                  <dd>-{formatPrice(Math.abs(couponDiscount))}</dd>
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
              <span className="text-xl font-semibold">{formatPrice(grandTotal)}</span>
            </div>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
