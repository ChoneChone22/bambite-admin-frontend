/**
 * Guest Token Manager
 * Manages guest tokens for guest user functionality
 */

const GUEST_TOKEN_KEY = "guestToken";

export const guestTokenManager = {
  /**
   * Get guest token from localStorage
   */
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GUEST_TOKEN_KEY);
  },

  /**
   * Set guest token in localStorage
   */
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  },

  /**
   * Remove guest token from localStorage
   */
  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_TOKEN_KEY);
  },

  /**
   * Check if guest token exists
   */
  exists: (): boolean => {
    return guestTokenManager.get() !== null;
  },
};
