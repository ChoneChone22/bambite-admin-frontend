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

  // Create toast element - solid background, no glass (light/dark/mobile)
  const toast = document.createElement("div");
  toast.id = "global-toast";
  toast.className = "no-glass fixed top-20 right-4 left-4 sm:left-auto z-[9999] animate-slide-in";

  const bgVar = type === "success" ? "--success" : type === "error" ? "--destructive" : "--info";
  const fgVar = type === "success" ? "--success-foreground" : type === "error" ? "--destructive-foreground" : "--info-foreground";
  const innerStyle = `background-color: hsl(var(${bgVar})); color: hsl(var(${fgVar})); opacity: 1; backdrop-filter: none; -webkit-backdrop-filter: none;`;

  toast.innerHTML = `
    <div class="px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3" style="${innerStyle}">
      <span>${message}</span>
      <button onclick="this.closest('#global-toast').remove()" class="text-current hover:opacity-80 font-bold cursor-pointer">
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
