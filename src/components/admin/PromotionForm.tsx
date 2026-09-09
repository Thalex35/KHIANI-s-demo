import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/shop";

export type Promotion = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, { message: "Le nom est requis" }).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive({ message: "La valeur doit être supérieure à 0" }),
  start_date: z.string().min(1, { message: "Date de début requise" }),
  end_date: z.string().min(1, { message: "Date de fin requise" }),
  is_active: z.boolean(),
});

type Draft = z.infer<typeof schema>;

export function PromotionFormComponent({ promotion }: { promotion?: Promotion }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<Draft>({
    name: promotion?.name ?? "",
    description: promotion?.description ?? "",
    discount_type: promotion?.discount_type ?? "percentage",
    discount_value: promotion?.discount_value ?? 0,
    start_date: promotion?.start_date ? promotion.start_date.split("T")[0] : "",
    end_date: promotion?.end_date ? promotion.end_date.split("T")[0] : "",
    is_active: promotion?.is_active ?? true,
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Draft) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(draft.end_date) <= new Date(draft.start_date)) {
      setError("La date de fin doit être après la date de début");
      return;
    }

    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setSaving(true);
    const payload = {
      ...parsed.data,
      slug: promotion?.slug ?? slugify(draft.name),
      start_date: new Date(draft.start_date).toISOString(),
      end_date: new Date(draft.end_date).toISOString(),
    };

    try {
      if (promotion) {
        const { error: updateError } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", promotion.id);
        if (updateError) throw updateError;
        toast.success("Promotion mise à jour");
      } else {
        const { error: insertError } = await supabase
          .from("promotions")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        toast.success("Promotion créée");
      }
      await queryClient.invalidateQueries({ queryKey: ["promotions"] });
      navigate({ to: "/admin/promotions" });
    } catch (err) {
      setSaving(false);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <AdminLayout
      title={promotion ? "Modifier une promotion" : "Ajouter une promotion"}
      backTo="/admin/promotions"
    >
      <form onSubmit={submit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la promotion</Label>
          <Input
            id="name"
            value={draft.name}
            onChange={set("name")}
            placeholder="ex: Soldes d'été"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={draft.description ?? ""}
            onChange={set("description")}
            placeholder="Description de la promotion"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_type">Type de réduction</Label>
            <Select
              value={draft.discount_type}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, discount_type: v as "percentage" | "fixed" }))
              }
            >
              <SelectTrigger id="discount_type">
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
              placeholder="ex: 20"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Date de début</Label>
            <Input
              id="start_date"
              type="date"
              value={draft.start_date}
              onChange={set("start_date")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Date de fin</Label>
            <Input
              id="end_date"
              type="date"
              value={draft.end_date}
              onChange={set("end_date")}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="is_active" className="mb-1 block text-sm font-medium">
              Active
            </Label>
            <p className="text-xs text-muted-foreground">
              La promotion sera visible en boutique
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
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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
            <a href="/admin/promotions">Annuler</a>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
