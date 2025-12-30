/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Product Management Page
 * CRUD operations for products
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Product,
  ProductCategory,
  CreateProductRequest,
} from "@/src/types/api";
import { formatPrice, getCategoryColor } from "@/src/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/src/types";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const productSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name must not exceed 100 characters")
    .required("Product name is required"),
  category: Yup.string()
    .oneOf(Object.values(ProductCategory), "Invalid category")
    .required("Category is required"),
  ingredients: Yup.string()
    .min(10, "Ingredients must be at least 10 characters")
    .required("Ingredients are required"),
  price: Yup.number()
    .positive("Price must be greater than 0")
    .max(10000, "Price must not exceed $10,000")
    .required("Price is required"),
  stockQuantity: Yup.number()
    .integer("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .required("Stock quantity is required"),
});

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modal = useModal();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.products.getAll();
      setProducts(response);
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this product? This action cannot be undone.",
      "Delete Product"
    );
    if (!confirmed) return;

    try {
      await api.products.delete(id);
      await fetchProducts();
    } catch (err: any) {
      await modal.alert(err.message || "Failed to delete product", "Error", "error");
      console.error(err);
    }
  };

  const handleSubmit = async (
    values: CreateProductRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, values);
      } else {
        await api.products.create(values);
      }
      resetForm();
      setShowModal(false);
      await fetchProducts();
    } catch (err: any) {
      await modal.alert(err.message || "Failed to save product", "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
          Product Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="ml-4">
                      <div
                        className="text-sm font-medium"
                        style={{ color: "#000000" }}
                      >
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.ingredients}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(
                      product.category
                    )}`}
                  >
                    {product.category}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${
                      product.stockQuantity > 10
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#DC2626", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        maxWidth="2xl"
      >
        <Formik
              initialValues={{
                name: editingProduct?.name || "",
                category: editingProduct?.category || ("" as ProductCategory),
                ingredients: editingProduct?.ingredients || "",
                price: editingProduct?.price || 0,
                stockQuantity: editingProduct?.stockQuantity || 0,
              }}
              validationSchema={productSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <Field
                      name="name"
                      type="text"
                      className="input-field"
                      placeholder="e.g., Tom Yum Soup"
                    />
                    {errors.name && touched.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <Field as="select" name="category" className="input-field">
                      <option value="">Select a category</option>
                      {Object.values(ProductCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Field>
                    {errors.category && touched.category && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredients *
                    </label>
                    <Field
                      as="textarea"
                      name="ingredients"
                      rows={3}
                      className="input-field"
                      placeholder="List main ingredients..."
                    />
                    {errors.ingredients && touched.ingredients && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.ingredients}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($) *
                      </label>
                      <Field
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field"
                        placeholder="9.99"
                      />
                      {errors.price && touched.price && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity *
                      </label>
                      <Field
                        name="stockQuantity"
                        type="number"
                        min="0"
                        className="input-field"
                        placeholder="50"
                      />
                      {errors.stockQuantity && touched.stockQuantity && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.stockQuantity}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 cursor-pointer"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingProduct
                        ? "Update"
                        : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
      </FormModal>
    </div>
  );
}
