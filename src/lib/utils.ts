/**
 * Utility Functions for Bambite E-commerce
 */

/**
 * Format price to USD currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
};

/**
 * Format date and time
 */
export const formatDateTime = (
  date: string | Date | undefined | null
): string => {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Generate random ID (for temporary use)
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Calculate cart total
 */
export const calculateCartTotal = (
  items: Array<{ quantity: number; price: string | number }>
): number => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((total, item) => {
    const price =
      typeof item.price === "string" ? parseFloat(item.price) : item.price;
    return total + item.quantity * price;
  }, 0);
};

/**
 * Calculate cart item count
 */
export const calculateCartItemCount = (
  items: Array<{ quantity: number }>
): number => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

/**
 * Get error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;

  // Handle Axios errors
  if (error && typeof error === "object") {
    const err = error as any;

    // Check for response error message
    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    // Check for response error
    if (err.response?.data?.error) {
      return err.response.data.error;
    }

    // Check for general message
    if (err.message) {
      // Don't show network error details, show user-friendly message
      if (err.message.includes("Network Error")) {
        return "Unable to connect to server. Please check your connection.";
      }
      if (err.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
      return err.message;
    }

    // Check for status code
    if (err.response?.status) {
      switch (err.response.status) {
        case 400:
          return "Invalid request. Please check your input.";
        case 401:
          return "Authentication required. Please login.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "Resource not found.";
        case 500:
          return "Server error. Please try again later or contact support.";
        default:
          return `Request failed with status ${err.response.status}`;
      }
    }
  }

  return "An unexpected error occurred. Please try again.";
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Get category badge color
 * @deprecated Use dynamic category colors based on category name or status
 */
export const getCategoryColor = (category: string): string => {
  // Legacy support for enum-based categories
  const legacyColors: Record<string, string> = {
    SOUP: "bg-orange-100 text-orange-800",
    SALAD: "bg-green-100 text-green-800",
    NOODLE: "bg-yellow-100 text-yellow-800",
    SNACK: "bg-purple-100 text-purple-800",
  };
  
  // Return legacy color if it exists, otherwise default
  return legacyColors[category] || "bg-blue-100 text-blue-800";
};

/**
 * Parse API response to extract data array
 * Handles multiple backend response formats:
 * - { status: "success", data: [...] }
 * - { success: true, data: [...] }
 * - { data: [...] }
 * - { data: { items: [...] } } (nested)
 * - Direct array [...]
 * 
 * @param response - Axios response object
 * @param arrayKey - Optional key for nested arrays (e.g., "placeTags", "applications")
 * @returns Extracted array data
 * @throws Error if data cannot be extracted
 */
export const parseArrayResponse = <T>(
  response: any,
  arrayKey?: string
): T[] => {
  const responseData = response?.data || response;
  
  if (!responseData) {
    throw new Error("Empty response received from server");
  }

  // Case 1: Direct array
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // Case 2: { status: "success", data: [...] }
  if (responseData.status === "success" && responseData.data) {
    if (Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle nested: { status: "success", data: { items: [...] } }
    if (arrayKey && responseData.data[arrayKey] && Array.isArray(responseData.data[arrayKey])) {
      return responseData.data[arrayKey];
    }
  }

  // Case 3: { success: true, data: [...] }
  if (responseData.success === true && responseData.data) {
    if (Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle nested: { success: true, data: { items: [...] } }
    if (arrayKey && responseData.data[arrayKey] && Array.isArray(responseData.data[arrayKey])) {
      return responseData.data[arrayKey];
    }
  }

  // Case 4: { data: [...] }
  if (responseData.data) {
    if (Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle nested: { data: { items: [...] } }
    if (arrayKey && responseData.data[arrayKey] && Array.isArray(responseData.data[arrayKey])) {
      return responseData.data[arrayKey];
    }
  }

  // Case 5: Nested object with array key
  if (arrayKey && responseData[arrayKey] && Array.isArray(responseData[arrayKey])) {
    return responseData[arrayKey];
  }

  // If we can't find an array, log the structure for debugging
  console.error("Unable to parse array response. Response structure:", {
    hasData: !!responseData.data,
    hasStatus: !!responseData.status,
    hasSuccess: responseData.success !== undefined,
    arrayKey,
    responseKeys: Object.keys(responseData),
  });

  // Return empty array as fallback (but log warning)
  console.warn("Returning empty array as fallback. Check backend response format.");
  return [];
};

/**
 * Parse API response to extract single object
 * Handles multiple backend response formats:
 * - { status: "success", data: {...} }
 * - { success: true, data: {...} }
 * - { data: {...} }
 * - { data: { item: {...} } } (nested)
 * - Direct object {...}
 * 
 * @param response - Axios response object
 * @param objectKey - Optional key for nested objects (e.g., "placeTag", "application")
 * @returns Extracted object data
 * @throws Error if data cannot be extracted
 */
export const parseObjectResponse = <T>(
  response: any,
  objectKey?: string
): T => {
  const responseData = response?.data || response;
  
  if (!responseData) {
    throw new Error("Empty response received from server");
  }

  // Case 1: Direct object (not wrapped)
  if (typeof responseData === "object" && !Array.isArray(responseData) && !responseData.data && !responseData.status) {
    // Check if it's a nested object with the key
    if (objectKey && responseData[objectKey]) {
      return responseData[objectKey] as T;
    }
    return responseData as T;
  }

  // Case 2: { status: "success", data: {...} }
  if (responseData.status === "success" && responseData.data) {
    if (objectKey && responseData.data[objectKey]) {
      return responseData.data[objectKey] as T;
    }
    return responseData.data as T;
  }

  // Case 3: { success: true, data: {...} }
  if (responseData.success === true && responseData.data) {
    if (objectKey && responseData.data[objectKey]) {
      return responseData.data[objectKey] as T;
    }
    return responseData.data as T;
  }

  // Case 4: { data: {...} }
  if (responseData.data) {
    if (objectKey && responseData.data[objectKey]) {
      return responseData.data[objectKey] as T;
    }
    return responseData.data as T;
  }

  // Case 5: Nested object with object key
  if (objectKey && responseData[objectKey]) {
    return responseData[objectKey] as T;
  }

  // If we can't find the object, log the structure for debugging
  console.error("Unable to parse object response. Response structure:", {
    hasData: !!responseData.data,
    hasStatus: !!responseData.status,
    hasSuccess: responseData.success !== undefined,
    objectKey,
    responseKeys: Object.keys(responseData),
  });

  throw new Error(`Unable to extract ${objectKey || "object"} from response`);
};
