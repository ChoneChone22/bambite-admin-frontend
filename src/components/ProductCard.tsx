import Link from "next/link";
import Image from "next/image";
import { Product } from "@/src/types/api";
import { formatPrice, getCategoryColor } from "@/src/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/src/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="card overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={PLACEHOLDER_IMAGE}
            alt={product.name}
            fill
            className="object-cover"
          />
          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">
              {product.name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                product.category
              )}`}
            >
              {product.category}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-1">
            {product.ingredients}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold" style={{ color: "#2C5BBB" }}>
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-500">
              Stock: {product.stockQuantity}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
