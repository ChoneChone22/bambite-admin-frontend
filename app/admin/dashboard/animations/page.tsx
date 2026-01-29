/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Animation Management Page
 * CRUD operations for animations with image uploads
 */

"use client";

import { useEffect, useState } from "react";
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

export default function AnimationsManagementPage() {
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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingAnimation, setEditingAnimation] = useState<Animation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modal = useModal();

  const fetchAnimations = async () => {
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
    fetchAnimations();
  }, []);

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
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this animation? This action cannot be undone.",
      "Delete Animation"
    );
    if (!confirmed) return;

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Animation Management</h1>
          <p className="text-muted-foreground mt-1">Manage application animations</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Enable Animations</span>
            <button
              type="button"
              role="switch"
              aria-checked={animationEnabled}
              onClick={handleToggleTrigger}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-border transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              style={{
                backgroundColor: animationEnabled ? "hsl(var(--primary))" : "hsl(var(--input))",
              }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
                style={{
                  transform: animationEnabled ? "translateX(1.25rem)" : "translateX(0)",
                  backgroundColor: "hsl(var(--primary-foreground))",
                }}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {animationEnabled ? "On" : "Off"}
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary px-4 py-2 rounded-lg transition-colors"
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
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No animations yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm text-center">
            Create your first animation to enhance the application&apos;s user experience
          </p>
          <button
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Animation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {animations.map((animation) => (
            <div
              key={animation.id}
              className={`group relative bg-card rounded-2xl border transition-all duration-200 overflow-hidden ${
                animation.selected
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              {/* Image Section */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {animation.imageUrl ? (
                  <img
                    src={animation.imageUrl}
                    alt={animation.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {animation.selected && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground shadow-md">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Active
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{animation.name}</h3>
                  {animation.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(animation.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {animation.selected ? (
                    <button
                      onClick={() => handleUnselect(animation.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors cursor-pointer"
                    >
                      Deselect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(animation.id)}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                      }}
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(animation)}
                    className="px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(animation.id)}
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
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Animation Name *
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="e.g., Christmas Animation"
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-foreground mb-1">
                  Animation Image {!editingAnimation && "*"}
                </label>
                {editingAnimation?.imageUrl && (
                  <div className="mb-2">
                    <img
                      src={editingAnimation.imageUrl}
                      alt={editingAnimation.name}
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Current image</p>
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
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {errors.image && touched.image && (
                  <p className="mt-1 text-sm text-destructive">{errors.image}</p>
                )}
                {values.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(values.image)}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">New image preview</p>
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
                  className="btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
