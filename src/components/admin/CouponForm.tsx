import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateCode } from "@/lib/utils";

export type Coupon = {
  id: string;
  code: string;
  coupon_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_value: number | null;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expiration_date: string | null;
  is_active: boolean;
};

const schema = z.object({
  code: z.string().trim().toUpperCase().min(2, { message: "Le code est requis" }).max(50),
  coupon_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive({ message: "La valeur doit être supérieure à 0" }),
  minimum_order_value: z.number().positive().nullable(),
  maximum_discount: z.number().positive().nullable(),
  usage_limit: z.number().int().positive().nullable(),
  expiration_date: z.string().nullable(),
  is_active: z.boolean(),
});

type Draft = z.infer<typeof schema>;

export function CouponFormComponent({ coupon }: { coupon?: Coupon }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<Draft>({
    code: coupon?.code ?? "",
    coupon_type: coupon?.coupon_type ?? "percentage",
    discount_value: coupon?.discount_value ?? 0,
    minimum_order_value: coupon?.minimum_order_value ?? null,
    maximum_discount: coupon?.maximum_discount ?? null,
    usage_limit: coupon?.usage_limit ?? null,
    expiration_date: coupon?.expiration_date ? coupon.expiration_date.split("T")[0] : null,
    is_active: coupon?.is_active ?? true,
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "number" 
      ? (e.target.value ? Number(e.target.value) : null)
      : e.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const generateRandomCode = () => {
    const code = generateCode(8).toUpperCase();
    setDraft((d) => ({ ...d, code }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setSaving(true);
    const payload = {
      ...parsed.data,
      expiration_date: draft.expiration_date 
        ? new Date(draft.expiration_date).toISOString()
        : null,
    };

    try {
      if (coupon) {
        const { error: updateError } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", coupon.id);
        if (updateError) throw updateError;
        toast.success("Coupon mis à jour");
      } else {
        const { error: insertError } = await supabase
          .from("coupons")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        toast.success("Coupon créé");
      }
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      navigate({ to: "/admin/coupons" });
    } catch (err) {
      setSaving(false);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <AdminLayout
      title={coupon ? "Modifier un coupon" : "Ajouter un coupon"}
      backTo="/admin/coupons"
    >
      <form onSubmit={submit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code">Code de réduction</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={draft.code}
              onChange={set("code")}
              placeholder="ex: SUMMER2024"
              className="font-mono"
              disabled={!!coupon}
            />
            {!coupon && (
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomCode}
              >
                Générer
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coupon_type">Type</Label>
            <Select
              value={draft.coupon_type}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, coupon_type: v as "percentage" | "fixed" }))
              }
            >
              <SelectTrigger id="coupon_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                <SelectItem value="fixed">Montant fixe (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_value">Valeur</Label>
            <Input
              id="discount_value"
              type="number"
              value={draft.discount_value}
              onChange={set("discount_value")}
              placeholder="ex: 10"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimum_order_value">Montant minimum de commande (€)</Label>
          <Input
            id="minimum_order_value"
            type="number"
            value={draft.minimum_order_value ?? ""}
            onChange={set("minimum_order_value")}
            placeholder="Optionnel"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maximum_discount">Réduction maximale (€)</Label>
          <Input
            id="maximum_discount"
            type="number"
            value={draft.maximum_discount ?? ""}
            onChange={set("maximum_discount")}
            placeholder="Optionnel"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage_limit">Limite d'utilisation</Label>
          <Input
            id="usage_limit"
            type="number"
            value={draft.usage_limit ?? ""}
            onChange={set("usage_limit")}
            placeholder="Optionnel (illimité si vide)"
            min="1"
            step="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiration_date">Date d'expiration</Label>
          <Input
            id="expiration_date"
            type="date"
            value={draft.expiration_date ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, expiration_date: e.target.value || null }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="is_active" className="mb-1 block text-sm font-medium">
              Actif
            </Label>
            <p className="text-xs text-muted-foreground">
              Le coupon sera utilisable en boutique
            </p>
          </div>
          <Select
            value={draft.is_active ? "true" : "false"}
            onValueChange={(v) => setDraft((d) => ({ ...d, is_active: v === "true" }))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Actif</SelectItem>
              <SelectItem value="false">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/admin/coupons">Annuler</a>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
