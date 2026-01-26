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
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    colorName: string;
    colorCode: string;
    x: number;
    y: number;
  }>({
    show: false,
    colorName: "",
    colorCode: "",
    x: 0,
    y: 0,
  });

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
      console.error("Error fetching themes:", err);
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
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this theme? This action cannot be undone.",
      "Delete Theme"
    );
    if (!confirmed) return;

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

  // Tooltip handlers
  const handleColorHover = (
    e: React.MouseEvent<HTMLDivElement>,
    colorName: string,
    colorCode: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      colorName,
      colorCode,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleColorLeave = () => {
    setTooltip((prev) => ({ ...prev, show: false }));
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
      {modal.ModalComponent}
      
      {/* Color Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium pointer-events-none transition-opacity duration-150"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "#1f2937",
            color: "#ffffff",
            marginTop: "-8px",
          }}
        >
          <div className="font-semibold mb-0.5" style={{ color: "#ffffff" }}>
            {tooltip.colorName}
          </div>
          <div className="font-mono text-[10px] opacity-90" style={{ color: "#d1d5db" }}>
            {tooltip.colorCode}
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
            style={{
              transform: "translateX(-50%)",
              borderTopColor: "#1f2937",
            }}
          />
        </div>
      )}
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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No themes yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm text-center">
            Create your first theme to customize the application&apos;s appearance
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Theme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`group relative bg-white rounded-2xl border transition-all duration-200 ${
                theme.selected
                  ? "border-blue-500 shadow-lg shadow-blue-500/10"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{theme.name}</h3>
                      {theme.selected && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Active
                        </span>
                      )}
                    </div>
                    {theme.createdAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(theme.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Palette Preview */}
                <div className="space-y-4">
                  {/* Main Colors */}
                  <div>
                    <div className="flex gap-2 mb-2">
                      <div
                        className="flex-1 aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105"
                        onMouseEnter={(e) =>
                          handleColorHover(e, "Primary", theme.colors.primary)
                        }
                        onMouseLeave={handleColorLeave}
                      >
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                      </div>
                      <div
                        className="flex-1 aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105"
                        onMouseEnter={(e) =>
                          handleColorHover(e, "Secondary", theme.colors.secondary)
                        }
                        onMouseLeave={handleColorLeave}
                      >
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                      </div>
                      <div
                        className="flex-1 aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105"
                        onMouseEnter={(e) =>
                          handleColorHover(e, "Accent", theme.colors.accent)
                        }
                        onMouseLeave={handleColorLeave}
                      >
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="flex-1 truncate">{theme.colors.primary}</span>
                      <span className="flex-1 truncate">{theme.colors.secondary}</span>
                      <span className="flex-1 truncate">{theme.colors.accent}</span>
                    </div>
                  </div>

                  {/* Background Preview */}
                  <div className="relative">
                    <div
                      className="h-20 rounded-xl p-4 flex items-center justify-between border border-gray-200 relative"
                      style={{ backgroundColor: theme.colors.background }}
                      onMouseEnter={(e) =>
                        handleColorHover(e, "Background", theme.colors.background)
                      }
                      onMouseLeave={handleColorLeave}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer transition-transform hover:scale-110"
                          style={{
                            backgroundColor: theme.colors.background,
                            color: theme.colors.logo,
                            border: `2px solid ${theme.colors.logo}`,
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            handleColorHover(e, "Logo", theme.colors.logo);
                          }}
                          onMouseLeave={handleColorLeave}
                        >
                          L
                        </div>
                        <div>
                          <div
                            className="h-2 w-16 rounded mb-1 cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: theme.colors.card }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              handleColorHover(e, "Card", theme.colors.card);
                            }}
                            onMouseLeave={handleColorLeave}
                          />
                          <div
                            className="h-2 w-12 rounded cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: theme.colors.card, opacity: 0.6 }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              handleColorHover(e, "Card", theme.colors.card);
                            }}
                            onMouseLeave={handleColorLeave}
                          />
                        </div>
                      </div>
                      <div
                        className="text-xs font-semibold px-2 py-1 rounded cursor-pointer transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: theme.colors.card,
                          color: theme.colors.text,
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          handleColorHover(e, "Text", theme.colors.text);
                        }}
                        onMouseLeave={handleColorLeave}
                      >
                        Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex gap-2">
                  {theme.selected ? (
                    <button
                      onClick={() => handleUnselect(theme.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ color: "#374151" }}
                    >
                      Deselect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(theme.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                      style={{ color: "#ffffff" }}
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(theme)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ color: "#374151" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(theme.id)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    style={{ color: "#dc2626" }}
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
