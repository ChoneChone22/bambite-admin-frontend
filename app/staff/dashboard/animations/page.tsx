/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Animation Management Page
 * CRUD operations for animations (requires THEME_AND_ANIMATION permission)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Animation,
  CreateAnimationRequest,
  UpdateAnimationRequest,
} from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

// Validation Schema
const animationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Animation name must be at least 2 characters")
    .max(100, "Animation name must not exceed 100 characters")
    .required("Animation name is required"),
  image: Yup.mixed()
    .test("fileType", "Only image files are allowed", function (value) {
      if (!value) return true; // Optional for updates
      return value instanceof File && value.type.startsWith("image/");
    })
    .test("fileSize", "Image must be less than 5MB", function (value) {
      if (!value) return true;
      return value instanceof File && value.size <= 5 * 1024 * 1024;
    }),
});

const ANIMATION_TRIGGER_KEY = "animationTriggerEnabled";

export default function StaffAnimationsManagementPage() {
  const router = useRouter();
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ANIMATION_TRIGGER_KEY);
      return stored === "true";
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingAnimation, setEditingAnimation] = useState<Animation | null>(null);
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

  const fetchAnimations = async () => {
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const animationsResponse = await api.animations.getAll();
      const animationsList = animationsResponse.animations || [];
      setAnimations(animationsList);
      const selected = animationsList.find((a) => a.selected);
      setSelectedAnimation(selected || null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err) || "Failed to fetch animations";
      setError(errorMessage);
      console.error("Error fetching animations:", {
        error: err,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchAnimations();
    }
  }, [hasPermission]);

  const handleCreate = async (values: CreateAnimationRequest) => {
    try {
      await api.animations.create(values);
      setSuccessMessage("Animation created successfully");
      setShowModal(false);
      fetchAnimations();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to create animation");
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: UpdateAnimationRequest) => {
    try {
      await api.animations.update(id, values);
      setSuccessMessage("Animation updated successfully");
      setShowModal(false);
      setEditingAnimation(null);
      fetchAnimations();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update animation");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this animation?")) return;

    try {
      await api.animations.delete(id);
      setSuccessMessage("Animation deleted successfully");
      fetchAnimations();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete animation");
    }
  };

  const handleSelect = async (id: string) => {
    try {
      await api.animations.select(id);
      setSuccessMessage("Animation selected successfully");
      fetchAnimations();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to select animation");
    }
  };

  const handleUnselect = async (id: string) => {
    try {
      await api.animations.unselect(id);
      setSuccessMessage("Animation unselected successfully");
      fetchAnimations();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to unselect animation");
    }
  };

  const handleToggleTrigger = () => {
    const newState = !animationEnabled;
    setAnimationEnabled(newState);
    
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(ANIMATION_TRIGGER_KEY, String(newState));
    }
    
    setSuccessMessage(
      `Animations ${newState ? "enabled" : "disabled"} successfully`
    );
  };

  const openCreateModal = () => {
    setEditingAnimation(null);
    setShowModal(true);
  };

  const openEditModal = (animation: Animation) => {
    setEditingAnimation(animation);
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
          <h1 className="text-3xl font-bold text-gray-900">Animation Management</h1>
          <p className="text-gray-600 mt-1">Manage application animations</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Enable Animations</span>
            <button
              type="button"
              role="switch"
              aria-checked={animationEnabled}
              onClick={handleToggleTrigger}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: animationEnabled ? "#2563eb" : "#e5e7eb",
              }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
                style={{
                  backgroundColor: "#ffffff",
                  transform: animationEnabled ? "translateX(1.25rem)" : "translateX(0)",
                }}
              />
            </button>
            <span className="text-sm text-gray-500">
              {animationEnabled ? "On" : "Off"}
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Animation
          </button>
        </div>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      {animations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No animations found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Animation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animations.map((animation) => (
            <div
              key={animation.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                animation.selected ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {animation.imageUrl ? (
                  <img
                    src={animation.imageUrl}
                    alt={animation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{animation.name}</h3>
                  {animation.selected && (
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      Selected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {animation.selected ? (
                    <button
                      onClick={() => handleUnselect(animation.id)}
                      className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm"
                    >
                      Unselect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(animation.id)}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-sm"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(animation)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(animation.id)}
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
          setEditingAnimation(null);
        }}
        title={editingAnimation ? "Edit Animation" : "Create Animation"}
        maxWidth="md"
      >
        <Formik
          initialValues={{
            name: editingAnimation?.name || "",
            image: undefined as File | undefined,
          }}
          validationSchema={animationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (editingAnimation) {
                await handleUpdate(editingAnimation.id, {
                  name: values.name,
                  image: values.image,
                });
              } else {
                if (!values.image) {
                  setError("Image is required for new animations");
                  return;
                }
                await handleCreate({ name: values.name, image: values.image });
              }
            } catch (err) {
              // Error handled in handleCreate/handleUpdate
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Animation Name *
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Christmas Animation"
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Animation Image {!editingAnimation && "*"}
                </label>
                {editingAnimation?.imageUrl && (
                  <div className="mb-2">
                    <img
                      src={editingAnimation.imageUrl}
                      alt={editingAnimation.name}
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFieldValue("image", file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  style={{ color: "#111827" }}
                />
                {errors.image && touched.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
                {values.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(values.image)}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">New image preview</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAnimation(null);
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
                  {isSubmitting ? "Saving..." : editingAnimation ? "Update" : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </FormModal>
    </div>
  );
}
