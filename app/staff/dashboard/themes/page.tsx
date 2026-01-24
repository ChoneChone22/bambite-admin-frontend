/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Theme Management Page
 * CRUD operations for themes (requires THEME_AND_ANIMATION permission)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Theme, CreateThemeRequest, UpdateThemeRequest, ThemeColors } from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

// Validation Schema
const themeSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Theme name must be at least 2 characters")
    .max(100, "Theme name must not exceed 100 characters")
    .required("Theme name is required"),
  colors: Yup.object().shape({
    primary: Yup.string().required("Primary color is required"),
    secondary: Yup.string().required("Secondary color is required"),
    accent: Yup.string().required("Accent color is required"),
    background: Yup.string().required("Background color is required"),
    text: Yup.string().required("Text color is required"),
    card: Yup.string().required("Card color is required"),
    logo: Yup.string().required("Logo color is required"),
  }),
});

export default function StaffThemesManagementPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modal = useModal();

  // Check permissions
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const profile = await api.staffAccounts.getProfile();
        const permissions = profile?.permissions || [];
        const permissionCodes = permissions.map((p) => p.code?.toUpperCase() || "");
        const hasThemePermission =
          permissionCodes.includes("THEME_AND_ANIMATION") ||
          profile?.staff?.user?.role === "ADMIN";
        setHasPermission(hasThemePermission);

        if (!hasThemePermission) {
          setError("You do not have permission to access this page");
          router.push("/staff/dashboard");
        }
      } catch (err) {
        setError("Failed to verify permissions");
        router.push("/staff/dashboard");
      }
    };

    checkPermission();
  }, [router]);

  const fetchThemes = async () => {
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.themes.getAll();
      const themesList = response.themes || [];
      setThemes(themesList);
      const selected = themesList.find((t) => t.selected);
      setSelectedTheme(selected || null);
    } catch (err) {
      setError("Failed to fetch themes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchThemes();
    }
  }, [hasPermission]);

  const handleCreate = async (values: CreateThemeRequest) => {
    try {
      await api.themes.create(values);
      setSuccessMessage("Theme created successfully");
      setShowModal(false);
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to create theme");
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: UpdateThemeRequest) => {
    try {
      await api.themes.update(id, values);
      setSuccessMessage("Theme updated successfully");
      setShowModal(false);
      setEditingTheme(null);
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update theme");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) return;

    try {
      await api.themes.delete(id);
      setSuccessMessage("Theme deleted successfully");
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete theme");
    }
  };

  const handleSelect = async (id: string) => {
    try {
      await api.themes.select(id);
      setSuccessMessage("Theme selected successfully");
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to select theme");
    }
  };

  const handleUnselect = async (id: string) => {
    try {
      await api.themes.unselect(id);
      setSuccessMessage("Theme unselected successfully");
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to unselect theme");
    }
  };

  const openCreateModal = () => {
    setEditingTheme(null);
    setShowModal(true);
  };

  const openEditModal = (theme: Theme) => {
    setEditingTheme(theme);
    setShowModal(true);
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">You do not have permission to access this page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Theme Management</h1>
          <p className="text-gray-600 mt-1">Manage application themes and colors</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          + Add Theme
        </button>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      {themes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No themes found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Theme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                theme.selected ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{theme.name}</h3>
                  {theme.selected && (
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      Selected
                    </span>
                  )}
                </div>

                {/* Color Preview */}
                <div className="space-y-2 mb-4">
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-8 rounded"
                      style={{ backgroundColor: theme.colors.background }}
                      title="Background"
                    />
                    <div
                      className="flex-1 h-8 rounded"
                      style={{ backgroundColor: theme.colors.card }}
                      title="Card"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {theme.selected ? (
                    <button
                      onClick={() => handleUnselect(theme.id)}
                      className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm"
                    >
                      Unselect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(theme.id)}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-sm"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(theme)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(theme.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTheme(null);
        }}
        title={editingTheme ? "Edit Theme" : "Create Theme"}
        maxWidth="lg"
      >
        <Formik
          initialValues={{
            name: editingTheme?.name || "",
            colors: editingTheme?.colors || {
              primary: "#3b82f6",
              secondary: "#10b981",
              accent: "#ef4444",
              background: "#ffffff",
              text: "#1f2937",
              card: "#f9fafb",
              logo: "#000000",
            },
          }}
          validationSchema={themeSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (editingTheme) {
                await handleUpdate(editingTheme.id, values);
              } else {
                await handleCreate(values);
              }
            } catch (err) {
              // Error handled in handleCreate/handleUpdate
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Theme Name *
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dark Theme"
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(values.colors).map((colorKey) => (
                  <div key={colorKey}>
                    <label
                      htmlFor={`colors.${colorKey}`}
                      className="block text-sm font-medium text-gray-700 mb-1 capitalize"
                    >
                      {colorKey.replace(/([A-Z])/g, " $1").trim()} *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id={`colors.${colorKey}`}
                        value={values.colors[colorKey as keyof ThemeColors]}
                        onChange={(e) =>
                          setFieldValue(`colors.${colorKey}`, e.target.value)
                        }
                        className="h-12 w-12 rounded border border-gray-300 cursor-pointer flex-shrink-0"
                        style={{ minWidth: "3rem", minHeight: "3rem" }}
                      />
                      <Field
                        id={`colors.${colorKey}-text`}
                        name={`colors.${colorKey}`}
                        type="text"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#000000"
                      />
                    </div>
                    {errors.colors && (errors.colors as any)[colorKey] && (
                      <p className="mt-1 text-sm text-red-600">
                        {(errors.colors as any)[colorKey]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Color Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: values.colors.primary }}
                    />
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: values.colors.secondary }}
                    />
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: values.colors.accent }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-16 rounded border-2 border-gray-300 flex items-center justify-center"
                      style={{ backgroundColor: values.colors.background }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: values.colors.logo }}
                      >
                        Logo
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-20 rounded p-4"
                    style={{
                      backgroundColor: values.colors.card,
                      color: values.colors.text,
                    }}
                  >
                    <p className="text-sm">Sample text on card background</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTheme(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ backgroundColor: "#ffffff", color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingTheme ? "Update" : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </FormModal>
    </div>
  );
}
