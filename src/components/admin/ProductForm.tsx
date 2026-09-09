import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
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
import { CATEGORIES, COLORS, SIZES, TYPES, colorHex, slugify, type Product, type Variant } from "@/lib/shop";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, { message: "Le nom est requis" }).max(120),
  description: z.string().trim().max(2000),
  category: z.string().min(1, { message: "Catégorie requise" }),
  subcategory: z.string().min(1, { message: "Type requis" }),
  brand: z.string().trim().min(1).max(80),
  price: z.number().positive({ message: "Le prix doit être supérieur à 0" }),
  sale_price: z.number().positive().nullable(),
  cover_url: z.string().trim().min(1, { message: "Une image principale est requise" }),
});

type Draft = {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: string;
  sale_price: string;
  cover_url: string;
  images: string;
  material: string;
  composition: string;
  fit: string;
  care: string;
  origin: string;
  sku: string;
  is_new: boolean;
  is_featured: boolean;
  is_active: boolean;
};

const SETTINGS_BUCKET = "product-images";

const emptyDraft: Draft = {
  name: "",
  description: "",
  category: CATEGORIES[0],
  subcategory: TYPES[0],
  brand: "MAISON NOVA",
  price: "",
  sale_price: "",
  cover_url: "/images/tshirt-blanc.jpg",
  images: "",
  material: "",
  composition: "",
  fit: "",
  care: "",
  origin: "Portugal",
  sku: "",
  is_new: true,
  is_featured: false,
  is_active: true,
};

export function ProductForm({
  product,
  variants = [],
}: {
  product?: Product;
  variants?: Variant[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<Draft>(
    product
      ? {
          name: product.name,
          description: product.description ?? "",
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          price: String(product.price),
          sale_price: product.sale_price != null ? String(product.sale_price) : "",
          cover_url: product.cover_url,
          images: (product.images ?? []).join("\n"),
          material: product.material ?? "",
          composition: product.composition ?? "",
          fit: product.fit ?? "",
          care: product.care ?? "",
          origin: product.origin ?? "",
          sku: product.sku ?? "",
          is_new: product.is_new,
          is_featured: product.is_featured,
          is_active: product.is_active,
        }
      : emptyDraft,
  );

  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ["S", "M", "L"]);
  const [colors, setColors] = useState<string[]>(product?.colors ?? ["Noir", "Blanc"]);
  const [stocks, setStocks] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const v of variants) map[`${v.size}|${v.color}`] = v.stock;
    return map;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const uploadCoverImage = async (file: File) => {
    const safeName = file.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]+/g, "-");
    const path = `uploads/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);
    return publicUrlData.publicUrl;
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const url = await uploadCoverImage(file);
      setDraft((d) => ({ ...d, cover_url: url }));
      toast.success("Image chargée");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le chargement de l’image a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({
      name: draft.name,
      description: draft.description,
      category: draft.category,
      subcategory: draft.subcategory,
      brand: draft.brand,
      price: Number(draft.price),
      sale_price: draft.sale_price ? Number(draft.sale_price) : null,
      cover_url: draft.cover_url,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    if (sizes.length === 0 || colors.length === 0) {
      setError("Sélectionnez au moins une taille et une couleur");
      return;
    }
    if (parsed.data.sale_price && parsed.data.sale_price >= parsed.data.price) {
      setError("Le prix promotionnel doit être inférieur au prix normal");
      return;
    }

    setSaving(true);
    const payload = {
      ...parsed.data,
      slug: product?.slug ?? slugify(draft.name),
      images: draft.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      sizes,
      colors,
      material: draft.material || null,
      composition: draft.composition || null,
      fit: draft.fit || null,
      care: draft.care || null,
      origin: draft.origin || null,
      sku: draft.sku || `MN-${Date.now().toString().slice(-6)}`,
      is_new: draft.is_new,
      is_featured: draft.is_featured,
      is_active: draft.is_active,
    };

    let productId = product?.id;
    if (product) {
      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);
      if (updateError) {
        setSaving(false);
        setError("L'enregistrement a échoué. Vérifiez les champs et réessayez.");
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (insertError || !data) {
        setSaving(false);
        setError("La création du produit a échoué.");
        return;
      }
      productId = data.id;
    }

    // Variantes : on remplace l'ensemble par la grille tailles × couleurs
    await supabase.from("product_variants").delete().eq("product_id", productId!);
    const rows = sizes.flatMap((size) =>
      colors.map((color) => ({
        product_id: productId!,
        size,
        color,
        stock: stocks[`${size}|${color}`] ?? 0,
      })),
    );
    const { error: variantError } = await supabase.from("product_variants").insert(rows);

    setSaving(false);
    if (variantError) {
      setError("Le produit est enregistré mais les stocks n'ont pas pu être mis à jour.");
      return;
    }

    await queryClient.invalidateQueries();
    toast.success(product ? "Produit mis à jour" : "Produit ajouté au catalogue");
    void navigate({ to: "/admin/produits" });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="surface-card p-5">
        <h2 className="text-lg">Informations générales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Nom du produit</Label>
            <Input id="name" value={draft.name} onChange={set("name")} className="mt-1.5" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={draft.description}
              onChange={set("description")}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Catégorie</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type de vêtement</Label>
            <Select
              value={draft.subcategory}
              onValueChange={(v) => setDraft((d) => ({ ...d, subcategory: v }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="brand">Marque</Label>
            <Input id="brand" value={draft.brand} onChange={set("brand")} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="sku">Référence (SKU)</Label>
            <Input id="sku" value={draft.sku} onChange={set("sku")} className="mt-1.5" />
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg">Prix et promotion</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Prix (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={draft.price}
              onChange={set("price")}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="sale_price">Prix promotionnel (€)</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              min="0"
              value={draft.sale_price}
              onChange={set("sale_price")}
              className="mt-1.5"
              placeholder="Laisser vide si aucune promotion"
            />
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg">Images</h2>
        <div className="mt-4 grid gap-4">
          <div className="rounded-xl border border-border bg-white/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="cover_file" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#9b6940] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7b5632] focus:outline-none focus:ring-2 focus:ring-[#9b6940] focus:ring-offset-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 16a4 4 0 0 0 0-8 4 4 0 0 0 0 8z" />
                  <path d="M12 3a9 9 0 0 0-7 3.6" />
                  <path d="M21 15v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5" />
                </svg>
                Télécharger une image principale
              </label>
              <Input id="cover_file" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              <span className="text-sm text-muted-foreground">
                {draft.cover_url ? "Image prête" : "Aucune image sélectionnée"}
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="images">Galerie — une image par ligne</Label>
            <Textarea id="images" rows={3} value={draft.images} onChange={set("images")} className="mt-1.5" />
          </div>
          {draft.cover_url && (
            <div className="mt-2 flex items-center">
              <img
                src={draft.cover_url}
                alt="Aperçu"
                className="size-32 rounded-md object-cover border border-border shadow-sm"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg">Variantes et stocks</h2>
        <div className="mt-4">
          <Label>Tailles</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(sizes, s, setSizes)}
                className={cn(
                  "min-w-12 rounded-md border px-3 py-2 text-sm",
                  sizes.includes(s) ? "border-foreground bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Label>Couleurs</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => toggle(colors, c.name, setColors)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  colors.includes(c.name) ? "border-foreground" : "border-border",
                )}
              >
                <span
                  className="size-4 rounded-full border border-border"
                  style={{ backgroundColor: colorHex(c.name) }}
                />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {sizes.length > 0 && colors.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-md text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium">Taille</th>
                  {colors.map((c) => (
                    <th key={c} className="p-2 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sizes.map((s) => (
                  <tr key={s}>
                    <td className="p-2 font-medium">{s}</td>
                    {colors.map((c) => (
                      <td key={c} className="p-2">
                        <Input
                          type="number"
                          min="0"
                          aria-label={`Stock ${s} ${c}`}
                          value={stocks[`${s}|${c}`] ?? 0}
                          onChange={(e) =>
                            setStocks((prev) => ({
                              ...prev,
                              [`${s}|${c}`]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className="w-20"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg">Détails matière</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["material", "Matière"],
              ["composition", "Composition"],
              ["fit", "Coupe"],
              ["care", "Entretien"],
              ["origin", "Pays de fabrication"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} value={draft[key]} onChange={set(key)} className="mt-1.5" />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg">Options d'affichage</h2>
        <div className="mt-4 space-y-4">
          {(
            [
              ["is_active", "Produit publié dans la boutique"],
              ["is_new", "Afficher le badge « Nouveau »"],
              ["is_featured", "Mettre en avant sur l'accueil"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key}>{label}</Label>
              <Switch
                id={key}
                checked={draft[key]}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : product ? "Enregistrer les modifications" : "Ajouter le produit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => void navigate({ to: "/admin/produits" })}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
