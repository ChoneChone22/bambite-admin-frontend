"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/src/services/api";
import { Product, ProductCategory } from "@/src/types/api";
import { PRODUCT_CATEGORIES } from "@/src/types";
import ProductCard from "@/src/components/ProductCard";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" } | null>(
    null
  );

  useEffect(() => {
    const category = searchParams.get("category");
    if (
      category &&
      Object.values(ProductCategory).includes(category as ProductCategory)
    ) {
      setSelectedCategory(category as ProductCategory);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch all products without filters since backend filtering doesn't work
      const response = await api.products.getAll({});
      console.log("Products response:", response);
      setAllProducts(response);
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: ProductCategory | "ALL") => {
    setSelectedCategory(category);
  };

  // Client-side filtering since backend doesn't filter properly
  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "ALL" || product.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ingredients?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Menu</h1>
          <p className="text-gray-600">
            Discover our delicious selection of Asian cuisine
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => handleCategoryChange("ALL")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm cursor-pointer ${
              selectedCategory === "ALL"
                ? "text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
            style={
              selectedCategory === "ALL"
                ? { backgroundColor: "#2C5BBB" }
                : { color: "#000000" }
            }
          >
            All Items
          </button>
          {PRODUCT_CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm cursor-pointer ${
                selectedCategory === category.value
                  ? "text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50"
              }`}
              style={
                selectedCategory === category.value
                  ? { backgroundColor: "#2C5BBB" }
                  : { color: "#000000" }
              }
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products found</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
