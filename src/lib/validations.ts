/**
 * Form Validation Schemas using Yup
 */

import * as Yup from "yup";

// ==================== Auth Schemas ====================

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export const registerSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  phoneNumber: Yup.string()
    .matches(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone number is required"),
  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .required("Address is required"),
});

// ==================== Product Schemas ====================
// Note: productSchema is now defined inline in product management pages
// to support dynamic categories and image uploads
// This legacy schema is kept for backward compatibility
export const productSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must not exceed 200 characters")
    .required("Product name is required"),
  categoryId: Yup.string().required("Category is required"),
  description: Yup.string().max(1000, "Description must not exceed 1000 characters"),
  ingredients: Yup.string().max(500, "Ingredients must not exceed 500 characters"),
  price: Yup.number()
    .positive("Price must be greater than 0")
    .required("Price is required"),
  stockQuantity: Yup.number()
    .integer("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .required("Stock quantity is required"),
});

// ==================== Cart Schemas ====================

export const addToCartSchema = Yup.object().shape({
  productId: Yup.string().required("Product ID is required"),
  quantity: Yup.number()
    .integer("Quantity must be a whole number")
    .positive("Quantity must be greater than 0")
    .max(100, "Maximum quantity is 100")
    .required("Quantity is required"),
});

// ==================== Checkout Schemas ====================

export const checkoutSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .matches(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone number is required"),
  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .required("Delivery address is required"),
  notes: Yup.string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

// ==================== Staff Schemas ====================

export const staffSchema = Yup.object().shape({
  position: Yup.string()
    .min(3, "Position must be at least 3 characters")
    .required("Position is required"),
  salary: Yup.number()
    .positive("Salary must be greater than 0")
    .max(1000000, "Salary must not exceed ฿1,000,000")
    .required("Salary is required"),
  overtimePayment: Yup.number()
    .min(0, "Overtime payment cannot be negative")
    .optional(),
  tax: Yup.number().min(0, "Tax cannot be negative").optional(),
  userId: Yup.string().required("User ID is required"),
});
