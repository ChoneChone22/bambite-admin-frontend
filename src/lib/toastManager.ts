/**
 * Toast Manager - Global toast notification system
 * Can be used from anywhere, including axios interceptors
 */

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast (success, error, info)
 * @param duration - Duration in milliseconds (default: 3000)
 */
export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
  duration: number = 3000
): void {
  if (typeof window === "undefined") return;

  // Remove any existing toast
  const existingToast = document.getElementById("global-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "global-toast";
  toast.className = "fixed top-20 right-4 z-[9999] animate-slide-in";

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  toast.innerHTML = `
    <div class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
      <span>${message}</span>
      <button onclick="this.closest('#global-toast').remove()" class="text-white hover:text-gray-200 font-bold cursor-pointer">
        ×
      </button>
    </div>
  `;

  // Append to body
  document.body.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
}

/**
 * Show error toast
 */
export function showErrorToast(message: string, duration?: number): void {
  showToast(message, "error", duration);
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, duration?: number): void {
  showToast(message, "success", duration);
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, duration?: number): void {
  showToast(message, "info", duration);
}
