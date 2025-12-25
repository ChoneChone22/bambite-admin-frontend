/**
 * Token Manager - Production-ready secure token management with httpOnly cookies
 * 
 * Security implementation:
 * - Tokens are stored in httpOnly cookies by the backend (not accessible via JavaScript)
 * - Role-specific cookie names for multiple simultaneous logins:
 *   - User: accessToken_user, refreshToken_user
 *   - Admin: accessToken_admin, refreshToken_admin
 *   - Staff: accessToken_staff, refreshToken_staff
 * - User data is stored in localStorage (non-sensitive, needed for UI)
 * - Automatic cookie handling by browser (withCredentials: true in axios)
 * - No token storage in localStorage (security best practice)
 * 
 * Note: httpOnly cookies cannot be read by JavaScript, so we rely on:
 * - Backend to set role-specific cookies automatically on login/refresh
 * - Browser to send the correct role-specific cookies with requests
 * - Backend to automatically detect which role's cookies to use
 * - Backend to clear role-specific cookies on logout
 * 
 * Multiple simultaneous logins are supported - you can be logged in as
 * admin, staff, and user at the same time, each with their own cookies.
 */

// Storage keys (only for user data, not tokens)
const USER_KEY = "bambite_user";

/**
 * Token Manager Class
 * Handles user data storage (tokens are in httpOnly cookies managed by backend)
 */
class TokenManager {
  /**
   * Store user data after successful authentication
   * Note: Tokens are stored in httpOnly cookies by backend, not here
   */
  setUser(user: any): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user data
   */
  getUser(): any | null {
    if (typeof window === "undefined") return null;
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Clear user data
   * Note: Cookies are cleared by backend on logout
   */
  clearUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user data exists (indicates potential authentication)
   * Note: Actual token validation happens on backend via cookies
   */
  hasUser(): boolean {
    return !!this.getUser();
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Tokens are now in httpOnly cookies, use setUser() instead
   */
  setTokens(accessToken: string, refreshToken: string, user: any): void {
    // Only store user data, tokens are in cookies
    this.setUser(user);
  }

  /**
   * Legacy method - tokens are in cookies, not accessible
   * @deprecated Tokens are in httpOnly cookies, cannot be read
   */
  getAccessToken(): string | null {
    // httpOnly cookies cannot be read by JavaScript
    return null;
  }

  /**
   * Legacy method - tokens are in cookies, not accessible
   * @deprecated Tokens are in httpOnly cookies, cannot be read
   */
  getRefreshToken(): string | null {
    // httpOnly cookies cannot be read by JavaScript
    return null;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use clearUser() instead
   */
  clearTokens(): void {
    this.clearUser();
  }

  /**
   * Legacy method - check if user data exists
   * @deprecated Use hasUser() instead
   */
  isAuthenticated(): boolean {
    return this.hasUser();
  }

  /**
   * Legacy method - update access token
   * @deprecated Tokens are managed by backend via cookies
   */
  updateAccessToken(accessToken: string, refreshToken?: string): void {
    // Tokens are in cookies, managed by backend
    // No action needed - cookies are automatically updated by backend
  }

  /**
   * Legacy method - check if token is expired
   * @deprecated Token expiration is handled by backend
   */
  isAccessTokenExpired(): boolean {
    // Cannot check httpOnly cookie expiration from JavaScript
    // Backend will return 401 if token is expired
    return false;
  }

  /**
   * Legacy method - should proactively refresh
   * @deprecated Token refresh is handled automatically by axios interceptor
   */
  shouldProactivelyRefresh(): boolean {
    // Cannot check httpOnly cookie expiration from JavaScript
    // Backend will return 401 if token is expired, triggering refresh
    return false;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
