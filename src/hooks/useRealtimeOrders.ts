/**
 * React Hook: Admin/Staff Orders List — WebSocket + Polling Fallback
 * Per guide: WebSocket for order:new, order:updated; poll GET /realtime/admin/orders when WS disconnected.
 */

import { useCallback, useEffect, useRef } from "react";
import { useRealtime } from "./useRealtime";
import api from "@/src/services/api";
import type { Order } from "@/src/types/api";
import type { NewOrderEvent, OrderUpdateEvent } from "@/src/types/api";

const DEFAULT_POLL_INTERVAL_MS = 20_000; // 20s when WebSocket disconnected

export interface UseRealtimeOrdersOptions {
  /** Current orders (from parent state) */
  orders: Order[];
  /** Update orders (from parent setState) */
  setOrders: (value: Order[] | ((prev: Order[]) => Order[])) => void;
  /** Refetch full list (e.g. api.orders.getAll). Used for initial load; polling uses api.realtime.getAdminOrders. */
  refetchOrders?: () => Promise<Order[]>;
  /** When true, WebSocket and polling are active */
  enabled?: boolean;
  /** Polling interval when WebSocket is disconnected (ms) */
  pollIntervalMs?: number;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions) {
  const {
    orders,
    setOrders,
    refetchOrders,
    enabled = true,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = options;

  const onNewOrder = useCallback(
    (payload: NewOrderEvent) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === payload.id)) return prev;
        const newOrder: Order = {
          id: payload.id,
          userId: payload.userId,
          status: payload.status,
          netPrice: payload.netPrice,
          orderedDate: payload.orderedDate,
          orderItems: [],
          items: [],
          user: undefined,
        } as Order;
        return [newOrder, ...prev];
      });
    },
    [setOrders]
  );

  const onOrderUpdate = useCallback(
    (payload: OrderUpdateEvent) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.orderId
            ? {
                ...o,
                status: payload.status,
                netPrice: payload.netPrice,
                orderedDate: payload.orderedDate,
              }
            : o
        )
      );
    },
    [setOrders]
  );

  const { connected } = useRealtime({
    onNewOrder,
    onOrderUpdate,
    subscribeToOrdersList: true,
    enabled,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling fallback when WebSocket disconnected.
  // Delay first poll so page's api.orders.getAll() (full data) wins on refresh; then merge poll results to avoid overwriting full orders with minimal realtime payload.
  useEffect(() => {
    if (!enabled || connected) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (initialLoadDelayRef.current) {
        clearTimeout(initialLoadDelayRef.current);
        initialLoadDelayRef.current = null;
      }
      return;
    }
    const poll = async () => {
      try {
        const list = await api.realtime.getAdminOrders();
        if (!list || !Array.isArray(list)) return;
        setOrders((prev) => {
          if (prev.length === 0) return prev;
          // Merge: keep full data (email, orderItems, user) from prev; update status/netPrice/orderedDate from poll so refresh never loses detail.
          const merged = list.map((incoming) => {
            const existing = prev.find((o) => o.id === incoming.id);
            if (!existing) return incoming;
            return { ...existing, ...incoming };
          });
          return merged;
        });
      } catch {
        // ignore
      }
    };
    const INITIAL_POLL_DELAY_MS = 2000;
    initialLoadDelayRef.current = setTimeout(() => {
      initialLoadDelayRef.current = null;
      poll();
      pollIntervalRef.current = setInterval(poll, pollIntervalMs);
    }, INITIAL_POLL_DELAY_MS);
    return () => {
      if (initialLoadDelayRef.current) {
        clearTimeout(initialLoadDelayRef.current);
        initialLoadDelayRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, connected, pollIntervalMs, setOrders]);

  return { connected };
}
