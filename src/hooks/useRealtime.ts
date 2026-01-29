/**
 * React Hook for WebSocket Real-Time Updates
 */

import { useEffect, useCallback, useRef } from "react";
import { realtimeService } from "@/src/services/realtime";
import {
  OrderUpdateEvent,
  NewOrderEvent,
  InventoryUpdateEvent,
  CartUpdateEvent,
} from "@/src/types/api";
import { tokenManager } from "@/src/lib/tokenManager";
import { guestTokenManager } from "@/src/lib/guestTokenManager";

interface UseRealtimeOptions {
  onOrderUpdate?: (data: OrderUpdateEvent) => void;
  onNewOrder?: (data: NewOrderEvent) => void;
  onInventoryUpdate?: (data: InventoryUpdateEvent) => void;
  onCartUpdate?: (data: CartUpdateEvent) => void;
  subscribeToOrder?: string; // Order ID (single order)
  subscribeToOrdersList?: boolean; // Admin/Staff: new orders + all order updates (channel 'order' without id)
  subscribeToProduct?: string; // Product ID
  subscribeToCart?: boolean;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    onOrderUpdate,
    onNewOrder,
    onInventoryUpdate,
    onCartUpdate,
    subscribeToOrder,
    subscribeToOrdersList,
    subscribeToProduct,
    subscribeToCart,
    enabled = true,
  } = options;

  const callbacksRef = useRef({
    onOrderUpdate,
    onNewOrder,
    onInventoryUpdate,
    onCartUpdate,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onOrderUpdate,
      onNewOrder,
      onInventoryUpdate,
      onCartUpdate,
    };
  }, [onOrderUpdate, onNewOrder, onInventoryUpdate, onCartUpdate]);

  // Connect and subscribe
  useEffect(() => {
    if (!enabled) {
      realtimeService.disconnect();
      return;
    }

    // Get tokens for authentication
    const user = tokenManager.getUser();
    let accessToken: string | undefined;
    let guestToken: string | undefined;

    if (user) {
      // Determine which token to use based on user role
      if (user.role === "ADMIN") {
        accessToken = localStorage.getItem("accessToken_admin") || undefined;
      } else if (user.role === "STAFF") {
        accessToken = localStorage.getItem("accessToken_staff") || undefined;
      } else {
        accessToken = localStorage.getItem("accessToken_user") || undefined;
      }
    } else {
      guestToken = guestTokenManager.get() || undefined;
    }

    // Connect to WebSocket
    const socket = realtimeService.connect(accessToken, guestToken);

    if (!socket) {
      console.warn("Failed to connect to WebSocket");
      return;
    }

    // Set up event listeners
    if (onOrderUpdate || callbacksRef.current.onOrderUpdate) {
      realtimeService.onOrderUpdate((data) => {
        callbacksRef.current.onOrderUpdate?.(data);
      });
    }

    if (onNewOrder || callbacksRef.current.onNewOrder) {
      realtimeService.onNewOrder((data) => {
        callbacksRef.current.onNewOrder?.(data);
      });
    }

    if (onInventoryUpdate || callbacksRef.current.onInventoryUpdate) {
      realtimeService.onInventoryUpdate((data) => {
        callbacksRef.current.onInventoryUpdate?.(data);
      });
    }

    if (onCartUpdate || callbacksRef.current.onCartUpdate) {
      realtimeService.onCartUpdate((data) => {
        callbacksRef.current.onCartUpdate?.(data);
      });
    }

    // Subscribe to channels
    if (subscribeToOrder) {
      realtimeService.subscribeOrder(subscribeToOrder);
    }
    if (subscribeToOrdersList) {
      realtimeService.subscribeOrdersList();
    }
    if (subscribeToProduct) {
      realtimeService.subscribeProduct(subscribeToProduct);
    }
    if (subscribeToCart) {
      realtimeService.subscribeCart();
    }

    // Cleanup on unmount
    return () => {
      if (subscribeToOrder) {
        realtimeService.unsubscribe("order", subscribeToOrder);
      }
      if (subscribeToOrdersList) {
        realtimeService.unsubscribe("order");
      }
      if (subscribeToProduct) {
        realtimeService.unsubscribe("product", subscribeToProduct);
      }
      if (subscribeToCart) {
        realtimeService.unsubscribe("cart");
      }
      // Note: We don't disconnect here to allow multiple components to use the same connection
      // The service manages connection lifecycle
    };
  }, [
    enabled,
    subscribeToOrder,
    subscribeToOrdersList,
    subscribeToProduct,
    subscribeToCart,
    onOrderUpdate,
    onNewOrder,
    onInventoryUpdate,
    onCartUpdate,
  ]);

  const subscribeOrder = useCallback((orderId: string) => {
    realtimeService.subscribeOrder(orderId);
  }, []);

  const subscribeProduct = useCallback((productId: string) => {
    realtimeService.subscribeProduct(productId);
  }, []);

  const subscribeCart = useCallback(() => {
    realtimeService.subscribeCart();
  }, []);

  const unsubscribe = useCallback((channel: string, id?: string) => {
    realtimeService.unsubscribe(channel, id);
  }, []);

  return {
    connected: realtimeService.connected,
    subscribeOrder,
    subscribeProduct,
    subscribeCart,
    unsubscribe,
  };
}
