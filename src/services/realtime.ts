/**
 * WebSocket Service for Real-Time Updates
 * Uses Socket.io with polling fallback for reliability
 */

import { io, Socket } from "socket.io-client";
import {
  OrderUpdateEvent,
  NewOrderEvent,
  InventoryUpdateEvent,
  CartUpdateEvent,
} from "@/src/types/api";

class RealtimeService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private isConnected: boolean = false;

  constructor() {
    // Get base URL from environment or use default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    // Remove /api/v1 from URL for Socket.io connection
    this.baseUrl = apiUrl.replace("/api/v1", "");
  }

  /**
   * Connect to WebSocket server
   * @param accessToken - Access token for authenticated users
   * @param guestToken - Guest token for guest users
   */
  connect(accessToken?: string, guestToken?: string): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const options: any = {
      transports: ["websocket", "polling"],
      withCredentials: true, // Include cookies
      path: "/socket.io",
    };

    // Add authentication
    if (accessToken) {
      options.auth = { token: accessToken };
      options.extraHeaders = { Authorization: `Bearer ${accessToken}` };
    } else if (guestToken) {
      options.query = { guestToken };
      options.extraHeaders = { Authorization: `Guest ${guestToken}` };
    }

    try {
      this.socket = io(this.baseUrl, options);

      this.socket.on("connect", () => {
        console.log("✅ WebSocket connected");
        this.isConnected = true;
      });

      this.socket.on("disconnect", () => {
        console.log("❌ WebSocket disconnected");
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        this.isConnected = false;
      });

      return this.socket;
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      return null;
    }
  }

  /**
   * Subscribe to order updates
   */
  subscribeOrder(orderId: string): void {
    this.socket?.emit("subscribe", { channel: "order", id: orderId });
  }

  /**
   * Subscribe to product inventory updates
   */
  subscribeProduct(productId: string): void {
    this.socket?.emit("subscribe", { channel: "product", id: productId });
  }

  /**
   * Subscribe to cart updates
   */
  subscribeCart(): void {
    this.socket?.emit("subscribe", { channel: "cart" });
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: string, id?: string): void {
    this.socket?.emit("unsubscribe", { channel, id });
  }

  /**
   * Listen for order updates
   */
  onOrderUpdate(callback: (data: OrderUpdateEvent) => void): void {
    this.socket?.on("order:updated", callback);
  }

  /**
   * Listen for new orders (admin/staff only)
   */
  onNewOrder(callback: (data: NewOrderEvent) => void): void {
    this.socket?.on("order:new", callback);
  }

  /**
   * Listen for inventory updates
   */
  onInventoryUpdate(callback: (data: InventoryUpdateEvent) => void): void {
    this.socket?.on("inventory:updated", callback);
  }

  /**
   * Listen for cart updates
   */
  onCartUpdate(callback: (data: CartUpdateEvent) => void): void {
    this.socket?.on("cart:updated", callback);
  }

  /**
   * Remove event listeners
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
