import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/shop";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

const categoriesQuery = () => ({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data as Category[]) || [];
  },
});

const schema = z.object({
  name: z.string().trim().min(2, { message: "Le nom est requis" }).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type Draft = z.infer<typeof schema> & {
  parent_id: string | null;
};

export function CategoryFormComponent({ category }: { category?: Category }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery());

  const [draft, setDraft] = useState<Draft>({
    name: category?.name ?? "",
    description: category?.description ?? "",
    image_url: category?.image_url ?? "",
    parent_id: category?.parent_id ?? null,
    display_order: category?.display_order ?? 0,
    is_active: category?.is_active ?? true,
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

    const parsed = schema.safeParse({
      name: draft.name,
      description: draft.description,
      image_url: draft.image_url,
      display_order: draft.display_order,
      is_active: draft.is_active,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setSaving(true);
    const payload = {
      ...parsed.data,
      slug: category?.slug ?? slugify(draft.name),
      parent_id: draft.parent_id,
    };

    try {
      if (category) {
        const { error: updateError } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", category.id);
        if (updateError) throw updateError;
        toast.success("Catégorie mise à jour");
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        toast.success("Catégorie créée");
      }
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate({ to: "/admin/categories" });
    } catch (err) {
      setSaving(false);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const mainCategories = categories.filter((c) => !c.parent_id && c.id !== category?.id);

  return (
    <AdminLayout
      title={category ? "Modifier une catégorie" : "Ajouter une catégorie"}
      backTo="/admin/categories"
    >
      <form onSubmit={submit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={draft.name}
            onChange={set("name")}
            placeholder="ex: Vêtements pour femme"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={draft.description ?? ""}
            onChange={set("description")}
            placeholder="Description de la catégorie"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image_url">Image</Label>
          <Input
            id="image_url"
            value={draft.image_url ?? ""}
            onChange={set("image_url")}
            placeholder="URL de l'image"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="display_order">Ordre d'affichage</Label>
            <Input
              id="display_order"
              type="number"
              value={draft.display_order}
              onChange={set("display_order")}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">Catégorie parent</Label>
            <Select
              value={draft.parent_id ?? ""}
              onValueChange={(v) => setDraft((d) => ({ ...d, parent_id: v || null }))}
            >
              <SelectTrigger id="parent_id">
                <SelectValue placeholder="Aucune (catégorie principale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune (catégorie principale)</SelectItem>
                {mainCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="is_active" className="mb-1 block text-sm font-medium">
              Publié
            </Label>
            <p className="text-xs text-muted-foreground">
              La catégorie sera visible en boutique
            </p>
          </div>
          <Switch
            id="is_active"
            checked={draft.is_active}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/admin/categories">Annuler</a>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
