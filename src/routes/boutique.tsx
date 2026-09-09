import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { ProductCard, ProductGridSkeleton } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsQuery, stockByProduct, variantsQuery } from "@/lib/catalog";
import { CATEGORIES, COLORS, SIZES, TYPES, effectivePrice, popularityScore } from "@/lib/shop";
import { useCatalogRealtime } from "@/hooks/useCatalogRealtime";
import { EmptyState } from "@/components/site/EmptyState";

type Search = {
  q?: string;
  category?: string;
  type?: string;
  size?: string;
  color?: string;
  brand?: string;
  min?: number;
  max?: number;
  stock?: "en_stock" | "rupture";
  promo?: boolean;
  sort?: "featured" | "nouveautes" | "populaires" | "best_selling" | "prix_asc" | "prix_desc";
};

export const Route = createFileRoute("/boutique")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
    size: typeof search["size"] === "string" ? search["size"] : undefined,
    color: typeof search["color"] === "string" ? search["color"] : undefined,
    brand: typeof search["brand"] === "string" ? search["brand"] : undefined,
    min: search["min"] != null ? Number(search["min"]) : undefined,
    max: search["max"] != null ? Number(search["max"]) : undefined,
    stock:
      search["stock"] === "en_stock" || search["stock"] === "rupture"
        ? (search["stock"] as Search["stock"])
        : undefined,
    promo: search["promo"] === true || search["promo"] === "true" ? true : undefined,
    sort: [
      "featured",
      "nouveautes",
      "populaires",
      "best_selling",
      "prix_asc",
      "prix_desc",
    ].includes(String(search["sort"]))
      ? (search["sort"] as Search["sort"])
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Boutique — Tous nos vêtements | MAISON NOVA" },
      {
        name: "description",
        content:
          "Parcourez tout le catalogue MAISON NOVA : filtrez par catégorie, type, taille, couleur, prix et disponibilité.",
      },
      { property: "og:title", content: "Boutique — Tous nos vêtements | MAISON NOVA" },
      {
        property: "og:description",
        content: "Filtrez par catégorie, taille, couleur, prix et disponibilité.",
      },
    ],
  }),
  component: BoutiquePage,
});

function BoutiquePage() {
  useCatalogRealtime();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/boutique" });
  const { data: products, isLoading, isError } = useQuery(productsQuery());
  const { data: variants } = useQuery(variantsQuery());
  const stocks = stockByProduct(variants ?? []);
  const [localQuery, setLocalQuery] = useState(search.q ?? "");
  const [localMin, setLocalMin] = useState<number | undefined>(search.min);
  const [localMax, setLocalMax] = useState<number | undefined>(search.max);

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const reset = () => {
    setLocalQuery("");
    setLocalMin(undefined);
    setLocalMax(undefined);
    void navigate({ search: {} });
  };

  const term = localQuery.trim().toLowerCase();
  let list = (products ?? []).filter((p) => {
    if (
      term &&
      ![p.name, p.category, p.subcategory, p.brand, p.description, p.colors.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
      return false;
    if (search.category && p.category !== search.category) return false;
    if (search.type && p.subcategory !== search.type) return false;
    if (search.brand && p.brand !== search.brand) return false;
    if (search.size && !p.sizes.includes(search.size)) return false;
    if (search.color && !p.colors.includes(search.color)) return false;
    const price = effectivePrice(p);
    if (localMin != null && price < localMin) return false;
    if (localMax != null && price > localMax) return false;
    if (search.promo && p.sale_price == null) return false;
    const stock = stocks.get(p.id) ?? 0;
    if (search.stock === "en_stock" && stock <= 0) return false;
    if (search.stock === "rupture" && stock > 0) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (search.sort) {
      case "populaires":
        return popularityScore(b) - popularityScore(a);
      case "best_selling":
        return b.purchases - a.purchases;
      case "featured":
        return (
          Number(b.is_featured) - Number(a.is_featured) || popularityScore(b) - popularityScore(a)
        );
      case "prix_asc":
        return effectivePrice(a) - effectivePrice(b);
      case "prix_desc":
        return effectivePrice(b) - effectivePrice(a);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const activeCount = Object.values(search).filter((v) => v !== undefined).length;

  const Filters = () => (
    <div className="space-y-7">
      <div>
        <Label htmlFor="recherche">Recherche</Label>
        <Input
          id="recherche"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="T-shirt, jean, robe noire…"
          className="mt-2"
        />
      </div>

      <FilterGroup
        title="Catégorie"
        options={[...CATEGORIES]}
        value={search.category}
        onChange={(v) => setSearch({ category: v })}
      />
      <FilterGroup
        title="Type"
        options={[...TYPES]}
        value={search.type}
        onChange={(v) => setSearch({ type: v })}
      />
      <FilterGroup
        title="Marque"
        options={[...new Set((products ?? []).map((p) => p.brand))]}
        value={search.brand}
        onChange={(v) => setSearch({ brand: v })}
      />

      <div>
        <p className="eyebrow text-muted-foreground">Taille</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSearch({ size: search.size === s ? undefined : s })}
              className={`min-w-11 rounded-md border px-3 py-2 text-sm transition ${
                search.size === s
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow text-muted-foreground">Couleur</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              onClick={() => setSearch({ color: search.color === c.name ? undefined : c.name })}
              className={`size-9 rounded-full border-2 transition ${
                search.color === c.name ? "border-accent" : "border-border"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow text-muted-foreground">Prix</p>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Prix minimum"
            value={localMin ?? ""}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              setLocalMin(next);
            }}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Prix maximum"
            value={localMax ?? ""}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              setLocalMax(next);
            }}
          />
        </div>
      </div>

      <div>
        <p className="eyebrow text-muted-foreground">Disponibilité</p>
        <div className="mt-3 space-y-2">
          {(
            [
              { id: "en_stock", label: "En stock" },
              { id: "rupture", label: "Rupture de stock" },
            ] as const
          ).map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={search.stock === o.id}
                onCheckedChange={(c) => setSearch({ stock: c ? o.id : undefined })}
              />
              {o.label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(search.promo)}
              onCheckedChange={(c) => setSearch({ promo: c ? true : undefined })}
            />
            En promotion
          </label>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={reset}>
        <X className="mr-2 size-4" /> Réinitialiser les filtres
      </Button>
    </div>
  );

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Catalogue"
        title="La boutique"
        description="Tous nos vêtements et accessoires, filtrables selon vos envies."
      />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <Filters />
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Chargement…" : `${list.length} produit${list.length > 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 size-4" />
                    Filtres{activeCount ? ` (${activeCount})` : ""}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-6">
                  <SheetTitle className="mb-6">Filtres</SheetTitle>
                  <Filters />
                </SheetContent>
              </Sheet>
              <Select
                value={search.sort ?? "featured"}
                onValueChange={(v) => setSearch({ sort: v as Search["sort"] })}
              >
                <SelectTrigger className="w-42.5" aria-label="Trier les produits">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">En vedette</SelectItem>
                  <SelectItem value="nouveautes">Nouveautés</SelectItem>
                  <SelectItem value="populaires">Plus populaires</SelectItem>
                  <SelectItem value="best_selling">Meilleures ventes</SelectItem>
                  <SelectItem value="prix_asc">Prix croissant</SelectItem>
                  <SelectItem value="prix_desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {Object.entries(search).map(([key, value]) =>
                value === undefined ? null : (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSearch({ [key]: undefined })}
                    className="rounded-full border border-border px-3 py-1 text-xs hover:border-foreground"
                  >
                    {key === "q" ? `Recherche : ${value}` : String(value)} ×
                  </button>
                ),
              )}
              <button type="button" onClick={reset} className="text-xs text-accent hover:underline">
                Tout effacer
              </button>
            </div>
          )}

          <div className="mt-6">
            {isError ? (
              <EmptyState
                title="Le catalogue n'a pas pu être chargé"
                text="Vérifiez votre connexion puis réessayez."
              />
            ) : isLoading ? (
              <ProductGridSkeleton />
            ) : list.length === 0 ? (
              <EmptyState
                title="Aucun résultat"
                text="Aucun produit ne correspond à votre recherche. Essayez d'autres filtres."
                action={<Button onClick={reset}>Réinitialiser les filtres</Button>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} stock={stocks.get(p.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <Checkbox checked={value === o} onCheckedChange={(c) => onChange(c ? o : undefined)} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}
