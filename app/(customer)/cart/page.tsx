"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, useCart } from "@/src/hooks";
import { PLACEHOLDER_IMAGE } from "@/src/types";
import { formatPrice, getErrorMessage } from "@/src/lib/utils";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, total, isLoading, updateItem, removeItem, clearCart } =
    useCart();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setProcessingItem(productId);
    try {
      await updateItem(productId, quantity);
      setToast({ message: "Cart updated", type: "success" });
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setProcessingItem(productId);
    try {
      await removeItem(productId);
      setToast({ message: "Item removed from cart", type: "success" });
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;

    try {
      await clearCart();
      setToast({ message: "Cart cleared", type: "success" });
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Add some delicious items to get started!
          </p>
          <button
            onClick={() => router.push("/products")}
            className="btn-primary"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items && items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-4"
                >
                  {/* Product Image */}
                  <div className="relative h-32 w-full sm:w-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={PLACEHOLDER_IMAGE}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {item.category}
                      </p>
                      <p
                        className="font-bold text-lg"
                        style={{ color: "#2C5BBB" }}
                      >
                        {formatPrice(parseFloat(item.price))}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            item.quantity <= 1 ||
                            processingItem === item.productId
                          }
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold text-xl"
                          style={{ color: "#000000" }}
                        >
                          -
                        </button>
                        <span
                          className="px-4 py-1 border-x min-w-[3rem] text-center font-semibold"
                          style={{ color: "#000000" }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.quantity >= item.stockQuantity ||
                            processingItem === item.productId
                          }
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold text-xl"
                          style={{ color: "#000000" }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={processingItem === item.productId}
                        className="text-red-600 hover:text-red-800 font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {processingItem === item.productId ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Remove"
                        )}
                      </button>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity >= item.stockQuantity && (
                      <p className="text-yellow-600 text-sm mt-2">
                        Maximum stock reached
                      </p>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="sm:text-right">
                    <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                <button
                  onClick={() => router.push("/products")}
                  className="btn-primary"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items && items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({items.length})</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span
                      className="font-semibold"
                      style={{ color: "#F59759" }}
                    >
                      FREE
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold">
                    <span style={{ color: "#000000" }}>Total</span>
                    <span className="font-bold" style={{ color: "#2C5BBB" }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full btn-primary text-lg py-3"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push("/products")}
                  className="w-full btn-secondary text-lg py-3 mt-3"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
