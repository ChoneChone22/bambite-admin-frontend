/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Product Management Page
 * CRUD operations for products (with product_management permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
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
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";

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
    .test("maxImages", "Maximum 20 images allowed per product", function (value) {
      const { parent } = this;
      // Get total image count (existing + new)
      if (parent.isEdit) {
        // In edit mode, check total count including existing images
        // This will be validated in handleImageChange as well
        return true; // Validation happens in handleImageChange
      }
      // For create, check new images only
      if (value && Array.isArray(value)) {
        return value.length <= 20;
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
  originalUrl?: string; // Store original URL for existing images to track removals
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
  const [searchQuery, setSearchQuery] = useState("");
  const modal = useModal();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.products.getAll({
        page: 1,
        limit: 1000, // Fetch all for client-side pagination
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

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      // Search in product name
      const name = product.name?.toLowerCase() || "";
      // Search in Thai name
      const thaiName = product.thaiName?.toLowerCase() || "";
      // Search in description
      const description = product.description?.toLowerCase() || "";
      // Search in ingredients
      const ingredients = product.ingredients?.toLowerCase() || "";
      // Search in category name
      const categoryName = product.category?.name?.toLowerCase() || "";
      // Search in price (convert to string)
      const price = product.price?.toString() || "";
      // Search in stock quantity
      const stock = product.stockQuantity?.toString() || "";

      return (
        name.includes(query) ||
        thaiName.includes(query) ||
        description.includes(query) ||
        ingredients.includes(query) ||
        categoryName.includes(query) ||
        price.includes(query) ||
        stock.includes(query)
      );
    });
  }, [products, searchQuery]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredProducts, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

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
    // Set existing images as previews with original URL for tracking
    const existingPreviews: ImagePreview[] =
      product.imageUrls?.map((url) => ({
        url,
        isExisting: true,
        originalUrl: url, // Store original URL to track which images are removed
      })) || [];
    setImagePreviews(existingPreviews);
    setShowModal(true);
  };

  // Extract option IDs from product for form initialization
  const getProductOptionIds = (product: Product | null): string[] => {
    if (!product) return [];
    // If optionIds exists, use it
    if (product.optionIds && product.optionIds.length > 0) {
      return product.optionIds;
    }
    // Otherwise, extract from productOptions
    if (product.productOptions && product.productOptions.length > 0) {
      return product.productOptions.map((po) => po.option.id);
    }
    return [];
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
    if (files.length === 0) return;

    // Validate file types and sizes
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 20;

    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      modal.alert(
        "Invalid files detected. Only JPEG, PNG, and WebP images under 5MB are allowed.",
        "Invalid Files",
        "error"
      );
      e.target.value = "";
      return;
    }

    // Check total image count (existing + new)
    const existingCount = editingProduct
      ? imagePreviews.filter((p) => p.isExisting).length
      : 0;
    const newCount = files.length;
    const totalCount = existingCount + newCount;

    if (totalCount > maxImages) {
      modal.alert(
        `Maximum ${maxImages} images allowed. You currently have ${existingCount} existing image${existingCount !== 1 ? "s" : ""} and are trying to add ${newCount} more. Please remove some images first.`,
        "Too Many Images",
        "error"
      );
      e.target.value = "";
      return;
    }

    const newPreviews: ImagePreview[] = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    // Combine with existing previews (for edit mode)
    // Keep all existing images and append new ones
    const combinedPreviews = editingProduct
      ? [...imagePreviews.filter((p) => p.isExisting), ...newPreviews]
      : newPreviews;

    setImagePreviews(combinedPreviews);
    
    // Update form field - only include new files (not existing ones)
    // Get all new files from combined previews
    const allNewFiles = combinedPreviews
      .filter((p) => !p.isExisting && p.file)
      .map((p) => p.file!);
    setFieldValue("images", allNewFiles);
    
    // Reset file input to allow selecting the same files again if needed
    e.target.value = "";
  };

  const removeImagePreview = (index: number, setFieldValue: any) => {
    const previewToRemove = imagePreviews[index];
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    
    // Update form field - only keep files that are not removed
    const remainingFiles = newPreviews
      .filter((p) => !p.isExisting && p.file)
      .map((p) => p.file!);
    setFieldValue("images", remainingFiles);
    
    // Note: Removed existing images will be tracked via removeImageUrls in handleSubmit
    // by comparing original imageUrls with current previews
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingProduct) {
        // Update product
        const updateData: UpdateProductRequest = {
          name: values.name,
          thaiName: values.thaiName || undefined,
          description: values.description,
          categoryId: values.categoryId,
          ingredients: values.ingredients,
          price: values.price,
          stockQuantity: values.stockQuantity,
          optionIds: values.optionIds || [],
        };

        // Get new images to add
        const newImages = imagePreviews
          .filter((p) => !p.isExisting && p.file)
          .map((p) => p.file!);
        
        // Calculate which existing images were removed
        const originalImageUrls = editingProduct.imageUrls || [];
        const remainingExistingUrls = imagePreviews
          .filter((p) => p.isExisting && p.originalUrl)
          .map((p) => p.originalUrl!);
        
        const removedImageUrls = originalImageUrls.filter(
          (url) => !remainingExistingUrls.includes(url)
        );

        // Handle image updates with professional logic
        if (newImages.length > 0) {
          // New images to add
          updateData.images = newImages;
          
          // Determine if we should replace all images or add to existing ones
          if (removedImageUrls.length === originalImageUrls.length && originalImageUrls.length > 0) {
            // All existing images were removed - replace all
            updateData.deleteOldImages = true;
          } else {
            // Add new images to existing ones (default behavior)
            // Explicitly set to false to ensure backend adds images without replacing
            updateData.deleteOldImages = false;
            
            // If specific images were removed, use removeImageUrls
            if (removedImageUrls.length > 0) {
              updateData.removeImageUrls = removedImageUrls;
            }
          }
        } else if (removedImageUrls.length > 0) {
          // No new images, but some existing images were removed
          updateData.removeImageUrls = removedImageUrls;
        }
        // If no new images and no removals, images remain unchanged (no image fields sent)

        await api.products.update(editingProduct.id, updateData);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setImagePreviews([]);
        await fetchProducts();
        await fetchCategories();
        await modal.alert("Product updated successfully", "Success", "success");
      } else {
        const createData: CreateProductRequest = {
          name: values.name,
          thaiName: values.thaiName || undefined,
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
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setImagePreviews([]);
        await fetchProducts();
        await fetchCategories();
        await modal.alert("Product created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(
        getErrorMessage(err) || "Failed to save product",
        "Error",
        "error"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Product Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products by name, description, category, price, or stock..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-foreground"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedData.map((product) => (
              <tr key={product.id} className="hover:bg-background">
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
                      >
                        {product.name}
                      </div>
                      {product.thaiName && (
                        <div
                          className="text-sm font-medium mt-0.5 text-foreground"
                        >
                          {product.thaiName}
                        </div>
                      )}
                      <div
                        className="text-sm truncate max-w-xs text-foreground"
                      >
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
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            minRowsPerPage={10}
            maxRowsPerPage={50}
          />
        )}
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
            thaiName: editingProduct?.thaiName || "",
            description: editingProduct?.description || "",
            categoryId: editingProduct?.categoryId || "",
            ingredients: editingProduct?.ingredients || "",
            price: editingProduct?.price || 0,
            stockQuantity: editingProduct?.stockQuantity || 0,
            optionIds: getProductOptionIds(editingProduct),
            images: [],
            isEdit: !!editingProduct,
          }}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, setFieldValue, values }) => (
            <Form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
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
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
                  Thai Name (ชื่อภาษาไทย)
                </label>
                <Field
                  name="thaiName"
                  type="text"
                  className="input-field"
                  placeholder="e.g., ม่อหิ่ง"
                  maxLength={200}
                />
                {errors.thaiName && touched.thaiName && (
                  <p className="text-red-600 text-sm mt-1">{errors.thaiName}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
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
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
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
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
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
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
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
                      <span className="text-sm text-foreground">
                        {option.displayName} ({option.optionLists.join(", ")})
                      </span>
                    </label>
                  ))}
                  {options.length === 0 && (
                    <p className="text-sm text-foreground">
                      No options available.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Price (฿) *
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
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
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
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
                  Images {!editingProduct && "*"}
                </label>
                {editingProduct && (
                  <p className="text-xs mb-2 text-foreground">
                    <strong>Add new images:</strong> Select new images to add them to existing ones. 
                    <br />
                    <strong>Remove images:</strong> Click the × button on any image to remove it.
                    <br />
                    New images will be added to existing ones by default.
                  </p>
                )}
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
                <p className="text-xs mt-1 text-foreground">
                  Accepted formats: JPEG, PNG, WebP. Max size: 5MB per image.
                </p>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2 text-foreground">
                      Image Previews ({imagePreviews.length} {imagePreviews.length === 1 ? 'image' : 'images'})
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border-2 transition-opacity"
                            style={{
                              borderColor: preview.isExisting ? "#3b82f6" : "#10b981",
                              opacity: preview.isExisting ? 1 : 0.9,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImagePreview(index, setFieldValue)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors shadow-md"
                            title="Remove image"
                          >
                            ×
                          </button>
                          {preview.isExisting ? (
                            <span 
                              className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium bg-card"
                            >
                              Existing
                            </span>
                          ) : (
                            <span 
                              className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium bg-card"
                            >
                              New
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {editingProduct && imagePreviews.filter(p => p.isExisting).length > 0 && (
                      <p className="text-xs mt-2 text-foreground">
                        <span className="text-foreground">Blue border</span> = Existing images •{" "}
                        <span className="text-foreground">Green border</span> = New images to add
                      </p>
                    )}
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
                  className="btn-secondary flex-1 cursor-pointer"
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
