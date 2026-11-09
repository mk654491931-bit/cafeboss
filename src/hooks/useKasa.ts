import { useCallback, useEffect, useRef, useState } from "react";
import {
  createKasaId,
  loadKasaState,
  orderTotal,
  saveKasaState,
  type CafeTable,
  type KasaState,
  type OrderLine,
  type PaymentMethod,
  type Sale,
  type TableSection,
} from "../lib/kasa";
import type { Product } from "../lib/types";

/**
 * Kasa durumunun tek kaynağı. Masalar, açık adisyonlar ve kapanan hesaplar
 * tarayıcıda saklanır; böylece Supabase anahtarı olmadan da önizlemede
 * kesintisiz çalışır.
 */
export function useKasa() {
  const [state, setState] = useState<KasaState>(() => loadKasaState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    saveKasaState(state);
  }, [state]);

  const addTable = useCallback(
    (section: TableSection, label: string): string | null => {
      const trimmed = label.trim();
      if (!trimmed) return "Masa adı boş olamaz.";

      const duplicate = stateRef.current.tables.some(
        (table) =>
          table.section === section &&
          table.label.toLocaleLowerCase("tr") ===
            trimmed.toLocaleLowerCase("tr"),
      );
      if (duplicate) return "Bu bölümde aynı isimde bir masa var.";

      const table: CafeTable = {
        id: createKasaId(),
        label: trimmed,
        section,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({ ...prev, tables: [...prev.tables, table] }));
      return null;
    },
    [],
  );

  const removeTable = useCallback((tableId: string): string | null => {
    const current = stateRef.current;
    const table = current.tables.find((item) => item.id === tableId);
    if (!table) return "Masa bulunamadı.";

    if ((current.orders[tableId]?.lines.length ?? 0) > 0) {
      return "Açık masa silinemez. Önce hesabı kapatın.";
    }

    setState((prev) => {
      const orders = { ...prev.orders };
      delete orders[tableId];
      return {
        ...prev,
        tables: prev.tables.filter((item) => item.id !== tableId),
        orders,
      };
    });
    return null;
  }, []);

  const addItem = useCallback((tableId: string, product: Product): void => {
    const addedAt = new Date().toISOString();

    setState((prev) => {
      if (!prev.tables.some((table) => table.id === tableId)) return prev;

      const order = prev.orders[tableId];
      let lines: OrderLine[];

      if (!order) {
        lines = [
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: 1,
            addedAt,
          },
        ];
      } else {
        const existing = order.lines.find(
          (line) => line.productId === product.id,
        );
        lines = existing
          ? order.lines.map((line) =>
              line.productId === product.id
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            )
          : [
              ...order.lines,
              {
                productId: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                quantity: 1,
                addedAt,
              },
            ];
      }

      return {
        ...prev,
        orders: {
          ...prev.orders,
          [tableId]: {
            tableId,
            openedAt: order?.openedAt ?? addedAt,
            lines,
          },
        },
      };
    });
  }, []);

  const changeQuantity = useCallback(
    (tableId: string, productId: string, delta: number): void => {
      setState((prev) => {
        const order = prev.orders[tableId];
        if (!order) return prev;

        const lines = order.lines
          .map((line) =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + delta }
              : line,
          )
          .filter((line) => line.quantity > 0);

        const orders = { ...prev.orders };
        if (lines.length === 0) {
          delete orders[tableId];
        } else {
          orders[tableId] = { ...order, lines };
        }

        return { ...prev, orders };
      });
    },
    [],
  );

  const removeLine = useCallback((tableId: string, productId: string): void => {
    setState((prev) => {
      const order = prev.orders[tableId];
      if (!order) return prev;

      const lines = order.lines.filter(
        (line) => line.productId !== productId,
      );
      const orders = { ...prev.orders };
      if (lines.length === 0) {
        delete orders[tableId];
      } else {
        orders[tableId] = { ...order, lines };
      }

      return { ...prev, orders };
    });
  }, []);

  const closeTable = useCallback(
    (tableId: string, paymentMethod: PaymentMethod): string | null => {
      const current = stateRef.current;
      const table = current.tables.find((item) => item.id === tableId);
      if (!table) return "Masa bulunamadı.";

      const order = current.orders[tableId];
      if (!order || order.lines.length === 0) return "Masa zaten boş.";

      const sale: Sale = {
        id: createKasaId(),
        tableId,
        tableLabel: table.label,
        section: table.section,
        lines: order.lines.map((line) => ({
          name: line.name,
          category: line.category,
          price: line.price,
          quantity: line.quantity,
        })),
        total: orderTotal(order),
        paymentMethod,
        closedAt: new Date().toISOString(),
      };

      setState((prev) => {
        const orders = { ...prev.orders };
        delete orders[tableId];
        return { ...prev, orders, sales: [sale, ...prev.sales] };
      });
      return null;
    },
    [],
  );

  return {
    tables: state.tables,
    orders: state.orders,
    sales: state.sales,
    addTable,
    removeTable,
    addItem,
    changeQuantity,
    removeLine,
    closeTable,
  };
}

export type KasaApi = ReturnType<typeof useKasa>;
