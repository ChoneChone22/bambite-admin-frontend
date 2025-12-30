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
          iconBgColor: "#fee2e2",
          iconColor: "#dc2626",
          titleColor: "#991b1b",
          borderColor: "#fecaca",
          buttonBg: "#dc2626",
          buttonBgHover: "#b91c1c",
        };
      case "success":
        return {
          icon: "✓",
          iconBgColor: "#d1fae5",
          iconColor: "#16a34a",
          titleColor: "#065f46",
          borderColor: "#bbf7d0",
          buttonBg: "#16a34a",
          buttonBgHover: "#15803d",
        };
      case "warning":
        return {
          icon: "⚠",
          iconBgColor: "#fef3c7",
          iconColor: "#ca8a04",
          titleColor: "#854d0e",
          borderColor: "#fde68a",
          buttonBg: "#ca8a04",
          buttonBgHover: "#a16207",
        };
      case "confirm":
        return {
          icon: "?",
          iconBgColor: "#dbeafe",
          iconColor: "#2563eb",
          titleColor: "#1e3a8a",
          borderColor: "#bfdbfe",
          buttonBg: "var(--primary)",
          buttonBgHover: "var(--primary-dark)",
        };
      default: // info or alert
        return {
          icon: "ℹ",
          iconBgColor: "#dbeafe",
          iconColor: "#2563eb",
          titleColor: "#1e3a8a",
          borderColor: "#bfdbfe",
          buttonBg: "var(--primary)",
          buttonBgHover: "var(--primary-dark)",
        };
    }
  };

  const styles = getTypeStyles();
  const defaultTitle = type === "confirm" ? "Confirm Action" : type === "error" ? "Error" : type === "success" ? "Success" : type === "warning" ? "Warning" : "Information";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop with glass effect - light overlay with subtle blur */}
      <div 
        className="fixed inset-0 bg-white/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative rounded-lg shadow-2xl max-w-md w-full transform animate-slideUp border border-gray-100 z-10"
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-start p-6 border-b"
          style={{ borderBottomColor: styles.borderColor }}
        >
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4"
            style={{ backgroundColor: styles.iconBgColor }}
          >
            <span 
              className="text-xl font-bold"
              style={{ color: styles.iconColor }}
            >
              {styles.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3
              id="modal-title"
              className="text-lg font-semibold mb-1"
              style={{ color: styles.titleColor }}
            >
              {title || defaultTitle}
            </h3>
            <p id="modal-description" className="text-sm" style={{ color: "#4b5563" }}>
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
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary] transition-colors cursor-pointer"
              style={{ 
                color: "#374151",
                backgroundColor: "#ffffff",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary] transition-colors cursor-pointer"
            style={{ 
              color: "#ffffff",
              backgroundColor: styles.buttonBg,
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.buttonBgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.buttonBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

