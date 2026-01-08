/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Product Management Page
 * CRUD operations for products (with product_management permission)
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Product,
  Category,
  Option,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/src/types/api";
import { formatPrice, getErrorMessage } from "@/src/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/src/types";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const productSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must not exceed 200 characters")
    .required("Product name is required"),
  categoryId: Yup.string().required("Category is required"),
  description: Yup.string().max(1000, "Description must not exceed 1000 characters"),
  ingredients: Yup.string().max(500, "Ingredients must not exceed 500 characters"),
  price: Yup.number()
    .positive("Price must be greater than 0")
    .required("Price is required"),
  stockQuantity: Yup.number()
    .integer("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .required("Stock quantity is required"),
  images: Yup.mixed()
    .test("required", "At least one image is required", function (value) {
      const { parent } = this;
      if (!parent.isEdit && (!value || (Array.isArray(value) && value.length === 0))) {
        return false;
      }
      return true;
    })
    .test("fileType", "Only JPEG, PNG, and WebP images are allowed", function (value) {
      if (!value || !Array.isArray(value)) return true;
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      return value.every((file: File) => validTypes.includes(file.type));
    })
    .test("fileSize", "Each image must be less than 5MB", function (value) {
      if (!value || !Array.isArray(value)) return true;
      const maxSize = 5 * 1024 * 1024;
      return value.every((file: File) => file.size <= maxSize);
    }),
  optionIds: Yup.array().of(Yup.string()),
});

interface ImagePreview {
  url: string;
  file?: File;
  isExisting?: boolean;
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const modal = useModal();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.products.getAll({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setProducts(response.data || response);
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const activeCategories = await api.categories.getActive();
      setCategories(activeCategories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchOptions = async () => {
    try {
      const allOptions = await api.options.getAll();
      setOptions(allOptions);
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOptions();
  }, []);

  const handleCreate = () => {
    setEditingProduct(null);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const existingPreviews: ImagePreview[] =
      product.imageUrls?.map((url) => ({
        url,
        isExisting: true,
      })) || [];
    setImagePreviews(existingPreviews);
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
      await modal.alert(
        getErrorMessage(err) || "Failed to delete product",
        "Error",
        "error"
      );
      console.error(err);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: any
  ) => {
    const files = Array.from(e.target.files || []);
    const newPreviews: ImagePreview[] = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    const combinedPreviews = editingProduct
      ? [...imagePreviews.filter((p) => p.isExisting), ...newPreviews]
      : newPreviews;

    setImagePreviews(combinedPreviews);
    setFieldValue("images", files);
  };

  const removeImagePreview = (index: number, setFieldValue: any) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    
    const remainingFiles = newPreviews
      .filter((p) => !p.isExisting && p.file)
      .map((p) => p.file!);
    setFieldValue("images", remainingFiles);
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingProduct) {
        const updateData: UpdateProductRequest = {
          name: values.name,
          description: values.description,
          categoryId: values.categoryId,
          ingredients: values.ingredients,
          price: values.price,
          stockQuantity: values.stockQuantity,
          optionIds: values.optionIds || [],
        };

        const newImages = imagePreviews
          .filter((p) => !p.isExisting && p.file)
          .map((p) => p.file!);
        
        if (newImages.length > 0) {
          updateData.images = newImages;
          const hasRemovedExisting = imagePreviews.some((p) => p.isExisting);
          updateData.deleteOldImages = !hasRemovedExisting;
        }

        await api.products.update(editingProduct.id, updateData);
      } else {
        const createData: CreateProductRequest = {
          name: values.name,
          description: values.description,
          categoryId: values.categoryId,
          ingredients: values.ingredients,
          price: values.price,
          stockQuantity: values.stockQuantity,
          optionIds: values.optionIds || [],
          images: imagePreviews
            .filter((p) => p.file)
            .map((p) => p.file!),
        };

        await api.products.create(createData);
      }

      resetForm();
      setShowModal(false);
      setImagePreviews([]);
      await fetchProducts();
      await fetchCategories();
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to save product",
        "Error",
        "error"
      );
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
          Product Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

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
                      src={
                        product.imageUrls && product.imageUrls.length > 0
                          ? product.imageUrls[0]
                          : PLACEHOLDER_IMAGE
                      }
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
                        {product.description || product.ingredients || "No description"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                    {product.category?.name || "N/A"}
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

      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setImagePreviews([]);
        }}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        maxWidth="2xl"
      >
        <Formik
          initialValues={{
            name: editingProduct?.name || "",
            description: editingProduct?.description || "",
            categoryId: editingProduct?.categoryId || "",
            ingredients: editingProduct?.ingredients || "",
            price: editingProduct?.price || 0,
            stockQuantity: editingProduct?.stockQuantity || 0,
            optionIds: editingProduct?.optionIds || [],
            images: [],
            isEdit: !!editingProduct,
          }}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, setFieldValue, values }) => (
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
                  Description
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows={3}
                  className="input-field"
                  placeholder="Product description..."
                />
                {errors.description && touched.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <Field as="select" name="categoryId" className="input-field">
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Field>
                {errors.categoryId && touched.categoryId && (
                  <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredients
                </label>
                <Field
                  as="textarea"
                  name="ingredients"
                  rows={3}
                  className="input-field"
                  placeholder="List main ingredients..."
                />
                {errors.ingredients && touched.ingredients && (
                  <p className="text-red-600 text-sm mt-1">{errors.ingredients}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <Field
                        type="checkbox"
                        name="optionIds"
                        value={option.id}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {option.displayName} ({option.optionLists.join(", ")})
                      </span>
                    </label>
                  ))}
                  {options.length === 0 && (
                    <p className="text-sm text-gray-500">No options available.</p>
                  )}
                </div>
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
                    <p className="text-red-600 text-sm mt-1">{errors.price}</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images {!editingProduct && "*"}
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageChange(e, setFieldValue)}
                  className="input-field"
                />
                {errors.images && touched.images && (
                  <p className="text-red-600 text-sm mt-1">{errors.images}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPEG, PNG, WebP. Max size: 5MB per image.
                </p>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index, setFieldValue)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        {preview.isExisting && (
                          <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Existing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                  onClick={() => {
                    setShowModal(false);
                    setImagePreviews([]);
                  }}
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
