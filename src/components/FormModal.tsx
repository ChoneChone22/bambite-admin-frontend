"use client";

import { useEffect, useRef } from "react";

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "2xl",
}: FormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClose();
  };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      {/* Backdrop with glass effect - light overlay with subtle blur */}
      <div
        className="fixed inset-0 bg-white/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative rounded-lg shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto transform animate-slideUp border border-gray-100 z-10`}
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 border-b border-gray-200 px-8 py-6 z-10"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <h2
              id="form-modal-title"
              className="text-2xl font-bold"
              style={{ color: "#000000" }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="transition-colors focus:outline-none focus:ring-2 focus:ring-[--primary] rounded-md p-1 cursor-pointer"
              style={{ 
                color: "#9ca3af",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4b5563";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#9ca3af";
              }}
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

