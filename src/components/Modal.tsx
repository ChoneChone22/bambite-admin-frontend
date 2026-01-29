"use client";

import { useEffect, useRef } from "react";

export type ModalType = "alert" | "confirm" | "info" | "error" | "success" | "warning";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Focus the confirm button when modal opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        await onConfirm();
      } catch (error) {
        console.error("Error in modal confirm handler:", error);
        // Don't close modal if there's an error - let the caller handle it
        return;
      }
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal when clicking on backdrop (not on modal content)
    e.stopPropagation();
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  // Determine icon and colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return {
          icon: "✕",
          iconClass: "bg-destructive/10 text-destructive",
          titleClass: "text-destructive",
          borderClass: "border-destructive/20",
          buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        };
      case "success":
        return {
          icon: "✓",
          iconClass: "bg-success/10 text-success",
          titleClass: "text-success",
          borderClass: "border-success/20",
          buttonClass: "bg-success hover:bg-success/90 text-success-foreground",
        };
      case "warning":
        return {
          icon: "⚠",
          iconClass: "bg-warning/10 text-warning",
          titleClass: "text-warning",
          borderClass: "border-warning/20",
          buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground",
        };
      case "confirm":
        return {
          icon: "?",
          iconClass: "bg-primary/10 text-primary",
          titleClass: "text-primary",
          borderClass: "border-primary/20",
          buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
        };
      default: // info or alert
        return {
          icon: "ℹ",
          iconClass: "bg-info/10 text-info",
          titleClass: "text-info",
          borderClass: "border-info/20",
          buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
        };
    }
  };

  const styles = getTypeStyles();
  const defaultTitle = type === "confirm" ? "Confirm Action" : type === "error" ? "Error" : type === "success" ? "Success" : type === "warning" ? "Warning" : "Information";

  return (
    <div
      className="no-glass fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop - solid overlay, no glass/blur */}
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
        onClick={handleBackdropClick}
      />

      {/* Modal - solid background, no glass effect (light/dark/mobile) */}
      <div
        ref={modalRef}
        className="relative rounded-lg shadow-2xl max-w-md w-full transform animate-slideUp z-10"
        style={{
          backgroundColor: "hsl(var(--card))",
          opacity: 1,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          border: `1px solid hsl(var(--${type === "error" ? "destructive" : type === "success" ? "success" : type === "warning" ? "warning" : type === "confirm" ? "primary" : "info"}) / 0.2)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-start p-6"
          style={{
            borderBottom: `1px solid hsl(var(--${type === 'error' ? 'destructive' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'confirm' ? 'primary' : 'info'}) / 0.2)`
          }}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${styles.iconClass}`}>
            <span className="text-xl font-bold">
              {styles.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3
              id="modal-title"
              className={`text-lg font-semibold mb-1 ${styles.titleClass}`}
            >
              {title || defaultTitle}
            </h3>
            <p id="modal-description" className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6">
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer bg-background text-foreground hover:bg-accent"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer ${styles.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
