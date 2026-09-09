import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  oldPrice: number | null;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "maison-nova-panier";
const CartContext = createContext<CartContextValue | undefined>(undefined);

export const itemKey = (i: Pick<CartItem, "productId" | "size" | "color">) =>
  `${i.productId}|${i.size}|${i.color}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* panier illisible : on repart d'un panier vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + (i.oldPrice ?? i.unitPrice) * i.quantity,
      0,
    );
    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal,
      discount: subtotal - total,
      total,
      addItem: (item) =>
        setItems((prev) => {
          const key = itemKey(item);
          const found = prev.find((i) => itemKey(i) === key);
          if (!found) return [...prev, item];
          return prev.map((i) =>
            itemKey(i) === key
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
              : i,
          );
        }),
      updateQuantity: (key, quantity) =>
        setItems((prev) =>
          prev.map((i) =>
            itemKey(i) === key
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i,
          ),
        ),
      removeItem: (key) => setItems((prev) => prev.filter((i) => itemKey(i) !== key)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
