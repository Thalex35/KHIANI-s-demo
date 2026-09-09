export const CATEGORIES = ["Hommes", "Femmes", "Enfants", "Accessoires"] as const;

export const TYPES = [
  "T-shirt",
  "Chemise",
  "Jean",
  "Pantalon",
  "Robe",
  "Jupe",
  "Veste",
  "Sweatshirt",
  "Pull",
  "Sneakers",
  "Accessoires",
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const COLORS = [
  { name: "Noir", hex: "#111111" },
  { name: "Blanc", hex: "#f7f7f5" },
  { name: "Rouge", hex: "#a52a2a" },
  { name: "Bleu", hex: "#3b5c86" },
  { name: "Vert", hex: "#4a6b5f" },
  { name: "Beige", hex: "#d9c7ad" },
  { name: "Gris", hex: "#8f8f8f" },
  { name: "Rose", hex: "#e0a9ab" },
] as const;

export const colorHex = (name: string) =>
  COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase())?.hex ?? "#cccccc";

export const ORDER_STATUSES = [
  "en_attente",
  "confirmee",
  "en_preparation",
  "expediee",
  "livree",
  "annulee",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUS_CLASSES: Record<OrderStatus, string> = {
  en_attente: "bg-muted text-muted-foreground",
  confirmee: "bg-accent/15 text-accent",
  en_preparation: "bg-chart-4/20 text-foreground",
  expediee: "bg-chart-2/20 text-foreground",
  livree: "bg-success/15 text-success",
  annulee: "bg-destructive/15 text-destructive",
};

export const PAYMENT_METHODS = [
  { id: "demo", label: "Paiement de démonstration", hint: "Aucune transaction réelle" },
  { id: "carte", label: "Carte bancaire", hint: "Bientôt disponible" },
  { id: "moncash", label: "MonCash", hint: "Bientôt disponible" },
  { id: "natcash", label: "NatCash", hint: "Bientôt disponible" },
  { id: "paypal", label: "PayPal", hint: "Bientôt disponible" },
];

export const formatPrice = (value: number | string | null | undefined) => {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  sale_price: number | null;
  cover_url: string;
  images: string[];
  sizes: string[];
  colors: string[];
  material: string | null;
  composition: string | null;
  fit: string | null;
  care: string | null;
  origin: string | null;
  sku: string | null;
  is_new: boolean;
  is_featured: boolean;
  is_active: boolean;
  views: number;
  cart_adds: number;
  purchases: number;
  created_at: string;
  updated_at: string;
};

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
};

export const effectivePrice = (p: Pick<Product, "price" | "sale_price">) =>
  p.sale_price != null ? Number(p.sale_price) : Number(p.price);

export const discountPercent = (p: Pick<Product, "price" | "sale_price">) =>
  p.sale_price != null && Number(p.price) > 0
    ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
    : 0;

export const popularityScore = (p: Pick<Product, "views" | "cart_adds" | "purchases">) =>
  p.views + p.cart_adds * 5 + p.purchases * 12;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
