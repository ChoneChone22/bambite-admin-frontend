"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Solid theme colors, no glass effect (light/dark/mobile)
  const bgToken = type === "success" ? "--success" : type === "error" ? "--destructive" : "--info";
  const fgToken = type === "success" ? "--success-foreground" : type === "error" ? "--destructive-foreground" : "--info-foreground";

  return (
    <div
      className="no-glass fixed top-20 right-4 left-4 sm:left-auto z-50 animate-slide-in"
    >
      <div
        className="px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3"
        style={{
          backgroundColor: `hsl(var(${bgToken}))`,
          color: `hsl(var(${fgToken}))`,
          opacity: 1,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-current hover:opacity-80 font-bold transition-opacity cursor-pointer"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
