import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsQuery } from "@/lib/catalog";
import { adminOrdersQuery, adminProfilesQuery, storeSettingsQuery } from "@/lib/admin";
import { CURRENCY_OPTIONS, PAYMENT_METHODS, formatCurrencyAmount } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Administration MAISON NOVA" },
      {
        name: "description",
        content: "Informations de la boutique, moyens de paiement et règles de livraison.",
      },
      { property: "og:title", content: "Paramètres — Administration MAISON NOVA" },
      { property: "og:description", content: "Boutique, paiement et livraison." },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: orders = [] } = useQuery(adminOrdersQuery());
  const { data: profiles = [] } = useQuery(adminProfilesQuery());
  const { data: settings = [] } = useQuery(storeSettingsQuery());

  const settingMap = new Map((settings ?? []).map((row) => [row.key, row.value]));
  const parseNumberFromSetting = (value: string) =>
    Number.parseFloat(String(value ?? "0").replace(/\s|€/g, "").replace(",", "."));

  const baseDelivery = parseNumberFromSetting(settingMap.get("delivery_fee") ?? "5.90");
  const baseThreshold = parseNumberFromSetting(settingMap.get("free_shipping_at") ?? "80");
  const selectedCurrency = settingMap.get("shop_currency") ?? "EUR";

  const [draft, setDraft] = useState<Record<string, string>>({
    shop_name: settingMap.get("shop_name") ?? "MAISON NOVA",
    shop_currency: selectedCurrency,
    shop_email: settingMap.get("shop_email") ?? "bonjour@maisonnova.fr",
    shop_phone: settingMap.get("shop_phone") ?? "+33 1 23 45 67 89",
    delivery_fee: formatCurrencyAmount(baseDelivery, selectedCurrency),
    free_shipping_at: formatCurrencyAmount(baseThreshold, selectedCurrency),
    delivery_delay: settingMap.get("delivery_delay") ?? "48 heures ouvrées",
    returns: settingMap.get("returns") ?? "30 jours, gratuits",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currency = settingMap.get("shop_currency") ?? "EUR";
    setDraft({
      shop_name: settingMap.get("shop_name") ?? "MAISON NOVA",
      shop_currency: currency,
      shop_email: settingMap.get("shop_email") ?? "bonjour@maisonnova.fr",
      shop_phone: settingMap.get("shop_phone") ?? "+33 1 23 45 67 89",
      delivery_fee: formatCurrencyAmount(parseNumberFromSetting(settingMap.get("delivery_fee") ?? "5.90"), currency),
      free_shipping_at: formatCurrencyAmount(parseNumberFromSetting(settingMap.get("free_shipping_at") ?? "80"), currency),
      delivery_delay: settingMap.get("delivery_delay") ?? "48 heures ouvrées",
      returns: settingMap.get("returns") ?? "30 jours, gratuits",
    });
  }, [settings]);

  const updateField = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const handleCurrencyChange = (value: string) => {
    const previousCurrency = draft.shop_currency || "EUR";
    const nextCurrency = value;
    const previousRate = CURRENCY_OPTIONS.find((c) => c.value === previousCurrency)?.rate ?? 1;
    const nextRate = CURRENCY_OPTIONS.find((c) => c.value === nextCurrency)?.rate ?? 1;

    const deliveryBase = parseNumberFromSetting(settingMap.get("delivery_fee") ?? "5.90");
    const thresholdBase = parseNumberFromSetting(settingMap.get("free_shipping_at") ?? "80");

    const deliveryDisplay = (deliveryBase / previousRate) * nextRate;
    const thresholdDisplay = (thresholdBase / previousRate) * nextRate;

    setDraft((current) => ({
      ...current,
      shop_currency: nextCurrency,
      delivery_fee: formatCurrencyAmount(deliveryDisplay, nextCurrency),
      free_shipping_at: formatCurrencyAmount(thresholdDisplay, nextCurrency),
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const selectedCurrency = draft.shop_currency || "EUR";
      const selectedRate = CURRENCY_OPTIONS.find((c) => c.value === selectedCurrency)?.rate ?? 1;

      const rows = Object.entries(draft).reduce<Record<string, string>>((acc, [key, value]) => {
        if (key === "delivery_fee") {
          const numeric = parseNumberFromSetting(value);
          acc[key] = String((numeric / selectedRate));
        } else if (key === "free_shipping_at") {
          const numeric = parseNumberFromSetting(value);
          acc[key] = String((numeric / selectedRate));
        } else if (key === "shop_currency") {
          acc[key] = value;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});

      for (const [key, value] of Object.entries(rows)) {
        const existing = settings.find((item) => item.key === key);
        if (existing) {
          const { error } = await supabase.from("store_settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("store_settings").insert({ key, value });
          if (error) throw error;
        }
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("shop_currency", draft.shop_currency);
      }
      await queryClient.invalidateQueries({ queryKey: ["store", "settings"] });
      toast.success("Paramètres sauvegardés");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Paramètres" description="Configuration de la boutique de démonstration.">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-lg">Boutique</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <Label htmlFor="shop_name">Nom</Label>
              <Input id="shop_name" value={draft.shop_name} onChange={(e) => updateField("shop_name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="shop_currency">Devise</Label>
              <Select value={draft.shop_currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="shop_currency" className="mt-1.5">
                  <SelectValue placeholder="Choisir une devise" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shop_email">E-mail de contact</Label>
              <Input id="shop_email" value={draft.shop_email} onChange={(e) => updateField("shop_email", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="shop_phone">Téléphone</Label>
              <Input id="shop_phone" value={draft.shop_phone} onChange={(e) => updateField("shop_phone", e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">Livraison</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <Label htmlFor="delivery_fee">Frais de livraison</Label>
              <Input id="delivery_fee" value={draft.delivery_fee} onChange={(e) => updateField("delivery_fee", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="free_shipping_at">Livraison offerte à partir de</Label>
              <Input id="free_shipping_at" value={draft.free_shipping_at} onChange={(e) => updateField("free_shipping_at", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="delivery_delay">Délai d'expédition</Label>
              <Input id="delivery_delay" value={draft.delivery_delay} onChange={(e) => updateField("delivery_delay", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="returns">Retours</Label>
              <Input id="returns" value={draft.returns} onChange={(e) => updateField("returns", e.target.value)} className="mt-1.5" />
            </div>
            <Button className="w-full" onClick={saveSettings} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</Button>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">Moyens de paiement</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {PAYMENT_METHODS.map((method) => (
              <li key={method.id} className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <span>{method.label}</span>
                <span className="text-xs text-muted-foreground">{method.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            L'architecture est prête pour ces moyens de paiement ; seule la validation de
            démonstration est active.
          </p>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg">État de la boutique</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Produits au catalogue</dt>
              <dd>{products.length}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Commandes enregistrées</dt>
              <dd>{orders.length}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Comptes clients</dt>
              <dd>{profiles.length}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            Connecté en tant qu'administrateur : {profile?.email}
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
