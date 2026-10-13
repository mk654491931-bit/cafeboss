import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../lib/menu";
import { toTurkishError } from "../lib/errors";
import type { Product, ProductInput } from "../lib/types";

function sortProducts(list: Product[]): Product[] {
  return [...list].sort(
    (a, b) =>
      a.category.localeCompare(b.category, "tr") ||
      a.name.localeCompare(b.name, "tr"),
  );
}

/**
 * Single source of menu state for both the public site and the admin panel.
 * Every mutation is optimistic and rolls back to the previous value on failure.
 * Mutations resolve to `null` on success or a Turkish error message.
 */
export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productsRef = useRef<Product[]>([]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.fetchProducts();
      setProducts(rows);
      productsRef.current = rows;
    } catch (caught) {
      setError(toTurkishError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addProduct = useCallback(
    async (input: ProductInput): Promise<string | null> => {
      try {
        const created = await api.createProduct(input);
        setProducts((prev) => sortProducts([...prev, created]));
        return null;
      } catch (caught) {
        return toTurkishError(caught);
      }
    },
    [],
  );

  const changePrice = useCallback(
    async (id: string, price: number): Promise<string | null> => {
      const previous = productsRef.current.find((p) => p.id === id);
      if (!previous) return "Ürün bulunamadı.";
      if (previous.price === price) return null;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price } : p)),
      );

      try {
        await api.updateProductPrice(id, price);
        return null;
      } catch (caught) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, price: previous.price } : p)),
        );
        return toTurkishError(caught);
      }
    },
    [],
  );

  const changeImage = useCallback(
    async (id: string, imageUrl: string): Promise<string | null> => {
      const previous = productsRef.current.find((p) => p.id === id);
      if (!previous) return "Ürün bulunamadı.";
      if (previous.image_url === imageUrl) return null;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, image_url: imageUrl } : p)),
      );

      try {
        await api.updateProductImage(id, imageUrl || null);
        return null;
      } catch (caught) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, image_url: previous.image_url } : p,
          ),
        );
        return toTurkishError(caught);
      }
    },
    [],
  );

  const changeAvailability = useCallback(
    async (id: string, isAvailable: boolean): Promise<string | null> => {
      const previous = productsRef.current.find((p) => p.id === id);
      if (!previous) return "Ürün bulunamadı.";
      if (previous.is_available === isAvailable) return null;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_available: isAvailable } : p,
        ),
      );

      try {
        await api.updateProductAvailability(id, isAvailable);
        return null;
      } catch (caught) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_available: previous.is_available } : p,
          ),
        );
        return toTurkishError(caught);
      }
    },
    [],
  );

  const removeProduct = useCallback(
    async (id: string): Promise<string | null> => {
      const previous = productsRef.current;
      const removed = previous.find((p) => p.id === id);
      if (!removed) return "Ürün bulunamadı.";

      setProducts((prev) => prev.filter((p) => p.id !== id));

      try {
        await api.deleteProduct(id);
        return null;
      } catch (caught) {
        setProducts((prev) => sortProducts([...prev, removed]));
        return toTurkishError(caught);
      }
    },
    [],
  );

  return {
    products,
    loading,
    error,
    reload,
    addProduct,
    changePrice,
    changeImage,
    changeAvailability,
    removeProduct,
  };
}
