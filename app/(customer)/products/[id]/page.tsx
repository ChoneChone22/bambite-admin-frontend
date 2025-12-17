"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/src/services/api";
import { Product } from "@/src/types/api";
import { PLACEHOLDER_IMAGE } from "@/src/types";
import {
  formatPrice,
  getCategoryColor,
  getErrorMessage,
} from "@/src/lib/utils";
import { useAuth, useCart } from "@/src/hooks";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addItem, refetch } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.products.getById(id);
      setProduct(data);
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Check both auth state and token to handle cases where state hasn't updated yet
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("bambite_auth_token")
        : null;

    if (!isAuthenticated && !token) {
      setToast({ message: "Please login to add items to cart", type: "error" });
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (!product) return;

    if (product.stockQuantity === 0) {
      setToast({ message: "This item is out of stock", type: "error" });
      return;
    }

    if (quantity > product.stockQuantity) {
      setToast({
        message: `Only ${product.stockQuantity} items available in stock`,
        type: "error",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      await refetch();
      setToast({ message: "Added to cart successfully!", type: "success" });
      setQuantity(1);
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Product not found
        </h2>
        <button
          onClick={() => router.push("/products")}
          className="btn-primary"
        >
          Back to Products
        </button>
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
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center font-semibold cursor-pointer"
          style={{ color: "#000000" }}
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="relative h-96 lg:h-full bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={PLACEHOLDER_IMAGE}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.stockQuantity === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${getCategoryColor(
                      product.category
                    )}`}
                  >
                    {product.category}
                  </span>
                  <span className="text-gray-600">
                    Stock: {product.stockQuantity}
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <p
                  className="text-3xl font-bold mb-6"
                  style={{ color: "#2C5BBB" }}
                >
                  {formatPrice(product.price)}
                </p>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Ingredients
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>

                {product.stockQuantity > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Availability
                    </h2>
                    <p className="text-green-600 font-semibold">✓ In Stock</p>
                  </div>
                )}
              </div>

              {/* Add to Cart Section */}
              {product.stockQuantity > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="font-semibold text-gray-700">
                      Quantity:
                    </label>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-bold text-xl"
                        style={{ color: "#000000" }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stockQuantity}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.min(
                              product.stockQuantity,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20 text-center border-x py-2 font-semibold"
                        style={{ color: "#000000" }}
                      />
                      <button
                        onClick={() =>
                          setQuantity(
                            Math.min(product.stockQuantity, quantity + 1)
                          )
                        }
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-bold text-xl"
                        style={{ color: "#000000" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full btn-primary text-lg py-3 flex items-center justify-center"
                  >
                    {isAddingToCart ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Adding to cart...</span>
                      </>
                    ) : (
                      "🛒 Add to Cart"
                    )}
                  </button>
                </div>
              )}

              {product.stockQuantity === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 font-semibold">
                    This item is currently out of stock
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
