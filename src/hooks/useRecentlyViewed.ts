import { useEffect, useState } from "react";

const STORAGE_KEY = "maison-nova-produits-vus";
const MAX_ITEMS = 8;

export function useRecentlyViewed(productId?: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
      setIds(stored.filter((id) => id !== productId));
    } catch {
      setIds([]);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
      const next = [productId, ...stored.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Recently viewed is optional and should never block product browsing.
    }
  }, [productId]);

  return ids;
}
