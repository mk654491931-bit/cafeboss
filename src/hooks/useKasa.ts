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
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  addKasaOrderItem,
  changeKasaOrderItemQuantity,
  closeKasaTable,
  deleteKasaTable,
  fetchKasaState,
  fetchKasaWorkspace,
  insertKasaTable,
  isMissingKasaSchema,
  kasaError,
  removeKasaOrderItem,
} from "../lib/kasaDb";
import type { Product } from "../lib/types";

const EMPTY_STATE: KasaState = { tables: [], orders: {}, sales: [] };
const POLL_INTERVAL_MS = 20_000;
const REALTIME_DEBOUNCE_MS = 180;

export type KasaSyncState = "connecting" | "live" | "polling" | "offline";

/**
 * Kasa durumunun tek kaynağı. Supabase yapılandırıldığında masalar, açık
 * adisyonlar ve satışlar veritabanında tutulur; telefon ve masaüstü aynı
 * kayıtları görür. Önizleme modunda ise tarayıcı deposu kullanılır.
 */
export function useKasa() {
  const usingCloud = isSupabaseConfigured;
  const [state, setState] = useState<KasaState>(() =>
    usingCloud ? EMPTY_STATE : loadKasaState(),
  );
  const [loading, setLoading] = useState(usingCloud);
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<KasaSyncState>(
    usingCloud ? "connecting" : "offline",
  );
  const [localFallback, setLocalFallback] = useState(false);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  const loadSequence = useRef(0);
  const localFallbackRef = useRef(false);
  const realtimeConnectedRef = useRef(false);
  const useDatabase = usingCloud && !localFallback;

  useEffect(() => {
    stateRef.current = state;
    if (!useDatabase) saveKasaState(state);
  }, [state, useDatabase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(
    async (options?: {
      silent?: boolean;
      full?: boolean;
    }): Promise<void> => {
      if (!usingCloud) {
        setState(loadKasaState());
        return;
      }

      const sequence = ++loadSequence.current;
      const full = options?.full ?? true;
      if (!options?.silent) setLoading(true);

      try {
        if (full || localFallbackRef.current) {
          const next = await fetchKasaState();
          if (!mountedRef.current || sequence !== loadSequence.current) return;
          localFallbackRef.current = false;
          setLocalFallback(false);
          setState(next);
        } else {
          const workspace = await fetchKasaWorkspace();
          if (!mountedRef.current || sequence !== loadSequence.current) return;
          setState((prev) => ({ ...prev, ...workspace }));
        }
        setError(null);
        setSyncState("live");
      } catch (loadError) {
        if (!mountedRef.current || sequence !== loadSequence.current) return;
        const message = kasaError(loadError);
        setError(message);
        setSyncState("offline");

        // Tablolar henüz kurulmadıysa mevcut kasa çalışmaya devam etsin;
        // şema çalıştırılıp bir sonraki yenilemede otomatik ortak kayda geçer.
        if (isMissingKasaSchema(loadError) && !localFallbackRef.current) {
          localFallbackRef.current = true;
          setLocalFallback(true);
          setState(loadKasaState());
        }
      } finally {
        if (mountedRef.current && sequence === loadSequence.current) {
          setLoading(false);
        }
      }
    },
    [usingCloud],
  );

  useEffect(() => {
    if (!usingCloud) return;
    void reload();
  }, [usingCloud, reload]);

  useEffect(() => {
    const realtime = supabase;
    if (!usingCloud || !realtime) return;

    let reloadTimer: number | undefined;
    let reloadFull = false;
    const channel = realtime.channel(`kasa-sync-${Date.now()}`);

    const scheduleReload = (full: boolean) => {
      reloadFull = reloadFull || full;
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => {
        const shouldFetchSales = reloadFull;
        reloadFull = false;
        void reload({ silent: true, full: shouldFetchSales });
      }, REALTIME_DEBOUNCE_MS);
    };

    for (const table of ["cafe_tables", "table_orders", "order_items"]) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => scheduleReload(false),
      );
    }
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales" },
      () => scheduleReload(true),
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        realtimeConnectedRef.current = true;
        setSyncState("live");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        realtimeConnectedRef.current = false;
        setSyncState("polling");
      }
    });

    let pollCount = 0;
    const pollTimer = window.setInterval(() => {
      pollCount += 1;
      void reload({
        silent: true,
        full: !realtimeConnectedRef.current || pollCount % 6 === 0,
      });
    }, POLL_INTERVAL_MS);

    const onFocus = () => {
      void reload({ silent: true, full: true });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onFocus();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(reloadTimer);
      window.clearInterval(pollTimer);
      realtimeConnectedRef.current = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void realtime.removeChannel(channel);
    };
  }, [usingCloud, reload]);

  const addTable = useCallback(
    async (section: TableSection, label: string): Promise<string | null> => {
      const trimmed = label.trim();
      if (!trimmed) return "Masa adı boş olamaz.";
      if (trimmed.length > 60) {
        return "Masa adı en fazla 60 karakter olabilir.";
      }

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

      if (!useDatabase) {
        setState((prev) => ({ ...prev, tables: [...prev.tables, table] }));
        return null;
      }

      try {
        await insertKasaTable(table);
        await reload({ silent: true, full: false });
        return null;
      } catch (insertError) {
        return kasaError(insertError);
      }
    },
    [reload, useDatabase],
  );

  const removeTable = useCallback(
    async (tableId: string): Promise<string | null> => {
      const current = stateRef.current;
      const table = current.tables.find((item) => item.id === tableId);
      if (!table) return "Masa bulunamadı.";

      if ((current.orders[tableId]?.lines.length ?? 0) > 0) {
        return "Açık masa silinemez. Önce hesabı kapatın.";
      }

      if (!useDatabase) {
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
      }

      try {
        await deleteKasaTable(tableId);
        await reload({ silent: true, full: false });
        return null;
      } catch (deleteError) {
        return kasaError(deleteError);
      }
    },
    [reload, useDatabase],
  );

  const addItem = useCallback(
    async (tableId: string, product: Product): Promise<string | null> => {
      if (useDatabase) {
        try {
          await addKasaOrderItem(tableId, product.id);
          await reload({ silent: true, full: false });
          return null;
        } catch (addError) {
          return kasaError(addError);
        }
      }

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
      return null;
    },
    [reload, useDatabase],
  );

  const changeQuantity = useCallback(
    async (
      tableId: string,
      productId: string,
      delta: number,
    ): Promise<string | null> => {
      if (useDatabase) {
        try {
          await changeKasaOrderItemQuantity(tableId, productId, delta);
          await reload({ silent: true, full: false });
          return null;
        } catch (quantityError) {
          return kasaError(quantityError);
        }
      }

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
      return null;
    },
    [reload, useDatabase],
  );

  const removeLine = useCallback(
    async (tableId: string, productId: string): Promise<string | null> => {
      if (useDatabase) {
        try {
          await removeKasaOrderItem(tableId, productId);
          await reload({ silent: true, full: false });
          return null;
        } catch (removeError) {
          return kasaError(removeError);
        }
      }

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
      return null;
    },
    [reload, useDatabase],
  );

  const closeTable = useCallback(
    async (
      tableId: string,
      paymentMethod: PaymentMethod,
    ): Promise<string | null> => {
      const current = stateRef.current;
      const table = current.tables.find((item) => item.id === tableId);
      if (!table) return "Masa bulunamadı.";

      const order = current.orders[tableId];
      if (!order || order.lines.length === 0) return "Masa zaten boş.";

      if (useDatabase) {
        try {
          await closeKasaTable(tableId, paymentMethod);
          await reload({ silent: true, full: true });
          return null;
        } catch (closeError) {
          return kasaError(closeError);
        }
      }

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
    [reload, useDatabase],
  );

  return {
    tables: state.tables,
    orders: state.orders,
    sales: state.sales,
    loading,
    error,
    syncState,
    usingCloud,
    localFallback,
    reload,
    addTable,
    removeTable,
    addItem,
    changeQuantity,
    removeLine,
    closeTable,
  };
}

export type KasaApi = ReturnType<typeof useKasa>;
