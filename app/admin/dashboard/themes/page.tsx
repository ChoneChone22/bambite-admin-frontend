/**
 * Admin Theme Management Page
 * CRUD operations for themes with color customization.
 * Theme colors (5 only): primary, foreground, background, logo, card.
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Theme,
  CreateThemeRequest,
  UpdateThemeRequest,
  ThemeColors,
  DEFAULT_THEME_COLORS,
} from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
  "primary",
  "foreground",
  "background",
  "logo",
  "card",
];

const themeColorsSchema = Yup.object().shape(
  THEME_COLOR_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: Yup.string().required(`${key} is required`) }),
    {} as Record<string, Yup.StringSchema>
  )
);

const themeSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Theme name must be at least 2 characters")
    .max(100, "Theme name must not exceed 100 characters")
    .required("Theme name is required"),
  colors: themeColorsSchema,
});

export default function ThemesManagementPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchThemes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.themes.getAll();
      const themesList = response.themes || [];
      setThemes(themesList);
    } catch (err) {
      setError("Failed to fetch themes");
      console.error("Error fetching themes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  /** Ensure only the 5 supported color keys are sent/used (ignore legacy secondary, accent, text, etc.) */
  const pickThemeColors = (colors: Partial<ThemeColors>): ThemeColors => ({
    primary: colors.primary ?? DEFAULT_THEME_COLORS.primary,
    foreground: colors.foreground ?? DEFAULT_THEME_COLORS.foreground,
    background: colors.background ?? DEFAULT_THEME_COLORS.background,
    logo: colors.logo ?? DEFAULT_THEME_COLORS.logo,
    card: colors.card ?? DEFAULT_THEME_COLORS.card,
  });

  const handleCreate = async (values: CreateThemeRequest) => {
    try {
      await api.themes.create({
        name: values.name,
        colors: pickThemeColors(values.colors),
      });
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
      await api.themes.update(id, {
        name: values.name,
        colors: values.colors ? pickThemeColors(values.colors) : undefined,
      });
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
    e: React.MouseEvent<HTMLElement>,
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
          <div className="font-semibold mb-0.5 text-foreground">
            {tooltip.colorName}
          </div>
          <div className="font-mono text-[10px] opacity-90 text-foreground">
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
          <h1 className="text-3xl font-bold text-foreground">Theme Management</h1>
          <p className="text-muted-foreground mt-1">Manage application themes and colors</p>
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
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-gray-100">
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
          <h3 className="text-xl font-semibold text-foreground mb-2">No themes yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm text-center">
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
              className={`group relative bg-card rounded-2xl border transition-all duration-200 ${
                theme.selected
                  ? "border-blue-500 shadow-lg shadow-blue-500/10"
                  : "border-border hover:border-border hover:shadow-md"
              }`}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground truncate">{theme.name}</h3>
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
                      <p className="text-xs text-muted-foreground">
                        {new Date(theme.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Palette Preview — primary, foreground, background, logo, card (5-color schema) */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {THEME_COLOR_KEYS.map((key) => (
                      <div
                        key={key}
                        className="w-10 h-10 rounded-lg shrink-0 overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-110 border border-border"
                        style={{ backgroundColor: theme.colors[key] ?? "#ccc" }}
                        onMouseEnter={(e) =>
                          handleColorHover(e, key.replace(/([A-Z])/g, " $1").trim(), theme.colors[key] ?? "")
                        }
                        onMouseLeave={handleColorLeave}
                        title={`${key}: ${theme.colors[key] ?? ""}`}
                      />
                    ))}
                  </div>

                  {/* Live preview strip: primary, foreground, background, logo, card */}
                  <div
                    className="rounded-xl overflow-hidden border border-border relative"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div
                      className="h-8 px-3 flex items-center justify-between"
                      style={{ backgroundColor: theme.colors.primary, color: theme.colors.foreground }}
                      onMouseEnter={(e) =>
                        handleColorHover(e, "Primary", theme.colors.primary)
                      }
                      onMouseLeave={handleColorLeave}
                    >
                      <span className="text-xs font-medium opacity-80">Primary</span>
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold border"
                        style={{
                          backgroundColor: theme.colors.background,
                          color: theme.colors.logo,
                          borderColor: theme.colors.logo,
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          handleColorHover(e, "Logo", theme.colors.logo);
                        }}
                        onMouseLeave={handleColorLeave}
                      >
                        L
                      </div>
                    </div>
                    <div
                      className="p-3 min-h-16"
                      style={{ backgroundColor: theme.colors.background, color: theme.colors.foreground }}
                      onMouseEnter={(e) =>
                        handleColorHover(e, "Foreground", theme.colors.foreground)
                      }
                      onMouseLeave={handleColorLeave}
                    >
                      <div
                        className="rounded-lg p-2 text-xs"
                        style={{ backgroundColor: theme.colors.card, color: theme.colors.foreground }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          handleColorHover(e, "Card", theme.colors.card);
                        }}
                        onMouseLeave={handleColorLeave}
                      >
                        Card preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <div className="flex gap-2">
                  {theme.selected ? (
                    <button
                      onClick={() => handleUnselect(theme.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors cursor-pointer"
                    >
                      Deselect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(theme.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                      }}
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(theme)}
                    className="px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(theme.id)}
                    className="px-4 py-2 text-sm font-medium rounded-lg btn-destructive transition-colors cursor-pointer"
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
            colors: editingTheme?.colors
              ? { ...DEFAULT_THEME_COLORS, ...pickThemeColors(editingTheme.colors as Partial<ThemeColors>) }
              : { ...DEFAULT_THEME_COLORS },
          }}
          validationSchema={themeSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (editingTheme) {
                await handleUpdate(editingTheme.id, values);
              } else {
                await handleCreate(values);
              }
            } catch {
              // Error displayed via handleCreate/handleUpdate
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                  Theme Name *
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Dark Theme"
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEME_COLOR_KEYS.map((colorKey) => (
                  <div key={colorKey}>
                    <label
                      htmlFor={`colors.${colorKey}`}
                      className="block text-sm font-medium text-muted-foreground mb-1 capitalize"
                    >
                      {colorKey.replace(/([A-Z])/g, " $1").trim()} *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id={`colors.${colorKey}`}
                        value={values.colors[colorKey] ?? "#000000"}
                        onChange={(e) =>
                          setFieldValue("colors", {
                            ...values.colors,
                            [colorKey]: e.target.value,
                          })
                        }
                        className="h-12 w-12 rounded border border-border cursor-pointer shrink-0"
                        style={{ minWidth: "3rem", minHeight: "3rem" }}
                        aria-label={`${colorKey} color`}
                      />
                      <Field
                        id={`colors.${colorKey}-text`}
                        name={`colors.${colorKey}`}
                        type="text"
                        className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                    {errors.colors &&
                      typeof errors.colors === "object" &&
                      (errors.colors as Record<string, string>)[colorKey] && (
                        <p className="mt-1 text-sm text-red-600">
                          {(errors.colors as Record<string, string>)[colorKey]}
                        </p>
                      )}
                  </div>
                ))}
              </div>

              {/* Color Preview — 5-color schema: primary, foreground, background, logo, card */}
              <div className="p-4 bg-muted rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">Preview</p>
                <div
                  className="rounded-xl overflow-hidden border border-border"
                  style={{ backgroundColor: values.colors.background }}
                >
                  <div
                    className="h-8 px-3 flex items-center justify-between text-xs"
                    style={{ backgroundColor: values.colors.primary, color: values.colors.foreground }}
                  >
                    <span className="font-medium opacity-80">Primary</span>
                    <span
                      key={`preview-logo-${values.colors?.logo ?? ""}`}
                      className="w-6 h-6 rounded border flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: values.colors?.background ?? DEFAULT_THEME_COLORS.background,
                        color: values.colors?.logo ?? DEFAULT_THEME_COLORS.logo,
                        borderColor: values.colors?.logo ?? DEFAULT_THEME_COLORS.logo,
                      }}
                    >
                      L
                    </span>
                  </div>
                  <div
                    className="p-3 min-h-16"
                    style={{ backgroundColor: values.colors.background, color: values.colors.foreground }}
                  >
                    <div
                      className="rounded-lg p-2 text-xs"
                      style={{
                        backgroundColor: values.colors.card,
                        color: values.colors.foreground,
                      }}
                    >
                      Card preview
                    </div>
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
                  className="btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
