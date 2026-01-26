# Frontend AI Agent Prompt: Complete Backend Updates for Admin Dashboard & Staff Portal

## 🎯 Overview

This document provides a comprehensive guide for updating the **Admin Dashboard** and **Staff Portal** frontend applications to integrate with all recent backend changes. The backend has undergone significant updates including real-time updates, guest user support, new features, and enhanced security.

---

## 📋 Table of Contents

1. [Real-Time Updates (WebSocket)](#1-real-time-updates-websocket)
2. [Guest User Support](#2-guest-user-support)
3. [Billing Address Management](#3-billing-address-management)
4. [Favourites System](#4-favourites-system)
5. [Product Reviews](#5-product-reviews)
6. [FAQ Management](#6-faq-management)
7. [Theme & Animation Management](#7-theme--animation-management)
8. [User Profile Images](#8-user-profile-images)
9. [Order Security Enhancements](#9-order-security-enhancements)
10. [Product Updates](#10-product-updates)
11. [Authentication System](#11-authentication-system)
12. [Forgot Password (Admin & Staff)](#12-forgot-password-admin--staff)
13. [API Endpoints Reference](#13-api-endpoints-reference)

---

## 1. Real-Time Updates (WebSocket)

### 🆕 NEW FEATURE: WebSocket Support

The backend now supports **real-time updates** via WebSocket (Socket.io) with polling fallback for reliability.

### WebSocket Connection

**Connection URL:** `ws://your-api-domain/api/v1` (or `wss://` for HTTPS)

**Authentication:**
- **Cookie-based** (automatic if cookies are available)
- **Authorization header:** `Bearer <accessToken>` or `Guest <guestToken>`
- **Query parameter:** `?guestToken=<token>` (for guest users)

### WebSocket Events

#### 1.1 Order Updates

**Event:** `order:updated`
**Emitted when:** Order status changes (PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED)

```typescript
socket.on('order:updated', (data) => {
  // data: { orderId, status, netPrice, orderedDate }
  // Update order in UI
});
```

**Event:** `order:new`
**Emitted when:** New order is created
**Audience:** Admin/Staff dashboard only

```typescript
socket.on('order:new', (data) => {
  // data: { id, userId, status, netPrice, orderedDate, itemCount }
  // Show notification in admin dashboard
});
```

#### 1.2 Inventory Updates

**Event:** `inventory:updated`
**Emitted when:** Product stock quantity changes

```typescript
socket.on('inventory:updated', (data) => {
  // data: { productId, stockQuantity, quantityChange, reason }
  // Update product stock in UI
});
```

#### 1.3 Cart Updates

**Event:** `cart:updated`
**Emitted when:** Cart items are added, updated, or removed

```typescript
socket.on('cart:updated', (data) => {
  // data: { items, totalItems, totalPrice }
  // Update cart UI
});
```

### WebSocket Subscription

**Subscribe to channels:**

```typescript
// Subscribe to order updates
socket.emit('subscribe', { channel: 'order', id: orderId });

// Subscribe to product inventory
socket.emit('subscribe', { channel: 'product', id: productId });

// Subscribe to cart updates (automatic for authenticated users)
socket.emit('subscribe', { channel: 'cart' });
```

**Unsubscribe:**

```typescript
socket.emit('unsubscribe', { channel: 'order', id: orderId });
```

### Polling Fallback Endpoints

If WebSocket is unavailable, use these polling endpoints:

**Order Status:**
```http
GET /api/v1/realtime/order/:orderId
```

**Product Inventory:**
```http
GET /api/v1/realtime/product/:productId/inventory
```

**Cart Updates:**
```http
GET /api/v1/realtime/cart
```

**Admin Orders:**
```http
GET /api/v1/realtime/admin/orders
```

**Recommended polling interval:** 5-10 seconds

### Frontend Implementation Example

```typescript
import { io, Socket } from 'socket.io-client';

class RealtimeService {
  private socket: Socket | null = null;

  connect(accessToken?: string, guestToken?: string) {
    const options: any = {
      transports: ['websocket', 'polling'],
      withCredentials: true, // Include cookies
    };

    // Add authentication
    if (accessToken) {
      options.auth = { token: accessToken };
      options.extraHeaders = { Authorization: `Bearer ${accessToken}` };
    } else if (guestToken) {
      options.query = { guestToken };
      options.extraHeaders = { Authorization: `Guest ${guestToken}` };
    }

    this.socket = io('https://your-api-domain', options);

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  subscribeOrder(orderId: string) {
    this.socket?.emit('subscribe', { channel: 'order', id: orderId });
  }

  onOrderUpdate(callback: (data: any) => void) {
    this.socket?.on('order:updated', callback);
  }

  onNewOrder(callback: (data: any) => void) {
    this.socket?.on('order:new', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
```

---

## 2. Guest User Support

### 🆕 NEW FEATURE: Guest Checkout

Users can now add items to cart and create orders **without registration**.

### Guest Token Management

**Get/Create Guest Token:**
- Guest token is automatically created on first cart/order request
- Returned in `X-Guest-Token` header and response body
- Store in localStorage for persistence

**Guest Token Format:**
```typescript
{
  guestToken: "uuid-string",
  // Included in response body for Safari/iOS compatibility
}
```

### Guest User Flow

1. **Add to Cart (Guest):**
```http
POST /api/v1/cart
Headers:
  X-Guest-Token: <guestToken> (optional on first request)
Body:
  { productId, quantity }
Response:
  {
    guestToken: "...", // Store this
    data: { ...cart data }
  }
```

2. **Create Order (Guest):**
```http
POST /api/v1/orders
Headers:
  X-Guest-Token: <guestToken>
Body:
  {
    items: [{ productId, quantity }],
    email: "guest@example.com", // REQUIRED for guest
    phoneNumber: "+66 8 1234 5678", // REQUIRED for guest
    billingAddress: { ... } // REQUIRED for guest
  }
```

3. **Guest to User Conversion:**
When guest user registers/logs in, provide `guestToken`:
```http
POST /api/v1/auth/user/register
Body:
  {
    email, password,
    guestToken: "<stored-guest-token>" // Optional
  }
```

Cart and orders are automatically merged into the user account.

### Frontend Implementation

```typescript
// Store guest token
let guestToken: string | null = localStorage.getItem('guestToken');

// On first request, guest token will be returned
async function addToCartGuest(productId: string, quantity: number) {
  const headers: any = {};
  if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }

  const response = await fetch('/api/v1/cart', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }),
    credentials: 'include', // Important for cookies
  });

  const data = await response.json();
  
  // Store guest token if returned
  if (data.guestToken) {
    guestToken = data.guestToken;
    localStorage.setItem('guestToken', guestToken);
  }

  return data;
}
```

---

## 3. Billing Address Management

### 🆕 NEW FEATURE: Multiple Billing Addresses

Users can save up to **5 billing addresses** with one default address.

### API Endpoints

**Get All Billing Addresses:**
```http
GET /api/v1/billing-addresses
Response:
  {
    addresses: [...],
    defaultAddress: { ... } | null,
    count: 3,
    remainingSlots: 2
  }
```

**Get Prefill Data:**
```http
GET /api/v1/billing-addresses/prefill
Response:
  {
    email: "user@example.com",
    phone: "+66 8 1234 5678",
    addressCount: 2,
    remainingSlots: 3
  }
```

**Create Billing Address:**
```http
POST /api/v1/billing-addresses
Body:
  {
    region: "Bangkok",
    streetAddress: "123 Main St",
    city: "Bangkok",
    state: "Bangkok",
    postcode: "10110",
    phone: "+66 8 1234 5678", // Optional - prefilled from user
    email: "user@example.com", // Optional - prefilled from user
    isDefault: true // If true, sets as default and unsets others
  }
```

**Update Billing Address:**
```http
PUT /api/v1/billing-addresses/:id
Body:
  {
    // Only include fields to update
    streetAddress: "456 New St",
    isDefault: true
  }
```

**Delete Billing Address:**
```http
DELETE /api/v1/billing-addresses/:id
```

**Set Default Address:**
```http
PATCH /api/v1/billing-addresses/:id/default
```

### Order Creation with Billing Address

**Option 1: Use Saved Address**
```http
POST /api/v1/orders
Body:
  {
    items: [...],
    billingAddressId: "address-uuid" // Use saved address
  }
```

**Option 2: Use Default Address (if exists)**
```http
POST /api/v1/orders
Body:
  {
    items: [...]
    // No billingAddressId - uses default if available
  }
```

**Option 3: Provide New Address**
```http
POST /api/v1/orders
Body:
  {
    items: [...],
    billingAddress: {
      region: "...",
      streetAddress: "...",
      city: "...",
      state: "...",
      postcode: "...",
      phone: "...",
      email: "..."
    }
    // Optionally save: billingAddressId will be returned if saved
  }
```

**For Guest Users:** `billingAddress` is **REQUIRED** (cannot use saved addresses)

### Error Handling

**Maximum Address Limit:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "You have reached the maximum limit of 5 billing addresses. To add a new address, please delete one of your existing addresses first.",
  "details": {
    "currentCount": 5,
    "maxAllowed": 5,
    "action": "delete_existing"
  }
}
```

---

## 4. Favourites System

### 🆕 NEW FEATURE: Product Favourites

Users can favorite/unfavorite products.

### API Endpoints

**Get User's Favourites:**
```http
GET /api/v1/favourites
Query Params:
  ?page=1&limit=20
Response:
  {
    favourites: [
      {
        id: "...",
        productId: "...",
        product: { ...product details },
        createdAt: "..."
      }
    ],
    total: 10,
    page: 1,
    limit: 20
  }
```

**Add to Favourites:**
```http
POST /api/v1/favourites
Body:
  {
    productId: "product-uuid"
  }
```

**Remove from Favourites:**
```http
DELETE /api/v1/favourites/:productId
```

**Check if Product is Favorited:**
```http
GET /api/v1/favourites/check/:productId
Response:
  {
    isFavorited: true,
    favouriteId: "..." // null if not favorited
  }
```

---

## 5. Product Reviews

### 🆕 NEW FEATURE: Product Reviews with Moderation

### Review Requirements

- **Authenticated Users:** Must have purchased the product (order status: PENDING or later)
- **Guests:** Can review with name and email
- **Rating:** 1-5 stars (required)
- **Message:** Optional
- **Status:** PENDING → APPROVED (admin moderation required)

### API Endpoints

**Get Reviews for Product:**
```http
GET /api/v1/reviews/product/:productId
Query Params:
  ?page=1&limit=10
  &sortBy=newest|highest|helpful
  &status=APPROVED (default) | PENDING | ALL
Response:
  {
    reviews: [
      {
        id: "...",
        userId: "..." | null,
        guestName: "..." | null,
        guestEmail: "..." | null,
        rating: 4,
        message: "...",
        status: "APPROVED",
        helpfulVotes: 5,
        createdAt: "...",
        user: { email: "..." } | null
      }
    ],
    total: 20,
    averageRating: 4.5,
    totalReviews: 20
  }
```

**Get Prefill Data:**
```http
GET /api/v1/reviews/prefill?productId=...
Query Params:
  ?guestEmail=guest@example.com (for guests)
Response:
  {
    name: "John", // From user account or empty
    email: "user@example.com" // From user account or guest email
  }
```

**Create Review (Authenticated):**
```http
POST /api/v1/reviews
Body:
  {
    productId: "...",
    rating: 4, // 1-5, required
    message: "Great product!" // Optional
  }
// Name and email auto-filled from account
```

**Create Review (Guest):**
```http
POST /api/v1/reviews
Body:
  {
    productId: "...",
    rating: 4,
    message: "Great product!",
    guestName: "John Doe", // Required for guests
    guestEmail: "guest@example.com" // Required for guests
  }
```

**Vote Helpful:**
```http
POST /api/v1/reviews/:id/helpful
// Toggles helpful vote (can vote/unvote)
```

**Admin: Get All Reviews:**
```http
GET /api/v1/reviews/admin/all
Query Params:
  ?status=PENDING|APPROVED|REJECTED
  &page=1&limit=20
```

**Admin: Update Review Status:**
```http
PATCH /api/v1/reviews/admin/:id/status
Body:
  {
    status: "APPROVED" | "REJECTED"
  }
```

### Product Response Includes Review Stats

```json
{
  "product": {
    "id": "...",
    "name": "...",
    "averageRating": 4.5, // Cached
    "totalReviews": 20 // Cached
  }
}
```

---

## 6. FAQ Management

### 🆕 NEW FEATURE: FAQ System

### API Endpoints

**Get All FAQs (Public):**
```http
GET /api/v1/faqs
Query Params:
  ?activeOnly=true (default: false)
Response:
  {
    faqs: [
      {
        id: "...",
        question: "What is your return policy?",
        answer: "We accept returns within 30 days...",
        isActive: true,
        order: 1,
        createdAt: "...",
        updatedAt: "..."
      }
    ],
    total: 10
  }
```

**Get Single FAQ:**
```http
GET /api/v1/faqs/:id
```

**Create FAQ (Admin/Staff with content_management permission):**
```http
POST /api/v1/faqs
Body:
  {
    question: "...",
    answer: "...",
    isActive: true, // Optional, default: true
    order: 1 // Optional, for sorting
  }
```

**Update FAQ:**
```http
PUT /api/v1/faqs/:id
Body:
  {
    question: "...", // Optional
    answer: "...", // Optional
    isActive: true // Optional
  }
```

**Update FAQ Order:**
```http
PATCH /api/v1/faqs/:id/order
Body:
  {
    order: 2
  }
```

**Toggle FAQ Status:**
```http
PATCH /api/v1/faqs/:id/status
Body:
  {
    isActive: true
  }
```

**Delete FAQ:**
```http
DELETE /api/v1/faqs/:id
```

---

## 7. Theme & Animation Management

### 🆕 NEW FEATURE: Theme and Animation Control

### Theme Management

**Get All Themes (Public):**
```http
GET /api/v1/themes
Response:
  {
    themes: [
      {
        id: "...",
        name: "Dark Theme",
        colors: {
          primary: "#3498db",
          secondary: "#2ecc71",
          accent: "#e74c3c",
          background: "#ffffff",
          text: "#333333",
          card: "#f5f5f5",
          logo: "#000000"
        },
        selected: true, // Only one can be selected
        createdAt: "...",
        updatedAt: "..."
      }
    ]
  }
```

**Get Selected Theme (Public):**
```http
GET /api/v1/themes/selected
Response:
  {
    theme: { ... } | null // null if no theme selected
  }
```

**Create Theme (Admin/Staff with theme_and_animation permission):**
```http
POST /api/v1/themes
Body:
  {
    name: "New Theme",
    colors: {
      primary: "#3498db",
      secondary: "#2ecc71",
      accent: "#e74c3c",
      background: "#ffffff",
      text: "#333333",
      card: "#f5f5f5",
      logo: "#000000"
    }
  }
// selected defaults to false
```

**Update Theme:**
```http
PUT /api/v1/themes/:id
Body:
  {
    name: "...", // Optional
    colors: { ... } // Optional
  }
// Maintains selected status
```

**Select Theme:**
```http
PATCH /api/v1/themes/:id/select
// Sets this theme as selected, unselects others
```

**Unselect Theme:**
```http
PATCH /api/v1/themes/:id/unselect
// Sets selected to false
```

**Delete Theme:**
```http
DELETE /api/v1/themes/:id
```

### Animation Management

**Get All Animations (Public):**
```http
GET /api/v1/animations
Response:
  {
    animations: [
      {
        id: "...",
        name: "Fade In",
        imageUrl: "https://...",
        selected: true,
        createdAt: "...",
        updatedAt: "..."
      }
    ]
  }
```

**Get Selected Animation (Public):**
```http
GET /api/v1/animations/selected
```

**Create Animation (Admin/Staff with theme_and_animation permission):**
```http
POST /api/v1/animations
Content-Type: multipart/form-data
Body:
  {
    name: "Fade In",
    image: <file> // Image file (uploaded to Cloudinary)
  }
```

**Update Animation:**
```http
PUT /api/v1/animations/:id
Content-Type: multipart/form-data
Body:
  {
    name: "...", // Optional
    image: <file> // Optional
  }
```

**Select/Unselect Animation:**
```http
PATCH /api/v1/animations/:id/select
PATCH /api/v1/animations/:id/unselect
```

**Delete Animation:**
```http
DELETE /api/v1/animations/:id
```

### Animation Trigger

**Get Trigger State (Public):**
```http
GET /api/v1/animation-trigger
Response:
  {
    enabled: true
  }
```

**Update Trigger State (Admin/Staff with theme_and_animation permission):**
```http
PATCH /api/v1/animation-trigger
Body:
  {
    enabled: true
  }
```

---

## 8. User Profile Images

### 🆕 NEW FEATURE: Profile Image Upload

Users can upload a profile image (one image per user). Guest users cannot upload profile images.

### API Endpoints

**Get User Profile (includes profileImageUrl):**
```http
GET /api/v1/auth/user/profile
Response:
  {
    user: {
      id: "...",
      email: "...",
      profileImageUrl: "https://cloudinary.com/..." | null,
      createdAt: "...",
      updatedAt: "..."
    }
  }
```

**Upload Profile Image:**
```http
PUT /api/v1/auth/user/profile/image
Content-Type: multipart/form-data
Body:
  {
    image: <file> // Single image file
  }
Response:
  {
    profileImageUrl: "https://cloudinary.com/..."
  }
```

**Delete Profile Image:**
```http
DELETE /api/v1/auth/user/profile/image
```

---

## 9. Order Security Enhancements

### 🔒 ENHANCED: Order Creation Security

The backend now includes multiple security layers for order creation:

### Rate Limiting

- **Guest Users:** 10 orders per hour (IP-based)
- **Authenticated Users:** 20 orders per hour (User ID-based)

### Order Limits

Configurable via environment variables (defaults shown):

- **Max Order Value:** $100,000
- **Max Items per Order:** 100 items
- **Max Quantity per Item:** 1000 units
- **Duplicate Detection Window:** 30 seconds

### Duplicate Order Prevention

Orders with identical items and billing email within 30 seconds are rejected.

### Error Responses

**Rate Limit Exceeded:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many orders. Please try again later."
}
```

**Order Limit Exceeded:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Order exceeds maximum value of $100,000"
}
```

**Duplicate Order:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Duplicate order detected. Please wait before placing another identical order."
}
```

---

## 10. Product Updates

### 📝 UPDATED: Product Description Optional

**Product creation/update:** `description` field is now **optional**.

```http
POST /api/v1/products
Body:
  {
    name: "Product Name",
    categoryId: "...",
    price: 29.99,
    stockQuantity: 100,
    description: "..." // Optional - can be omitted or empty string
  }
```

---

## 11. Authentication System

### 🔐 Two-Cookie Authentication System

The backend uses **role-specific cookies** for multiple simultaneous logins:

- `accessToken_user` - Customer users
- `accessToken_admin` - Admin users
- `accessToken_staff` - Staff users

### Authentication Methods

**Priority 1: Cookies (httpOnly)**
- Automatically sent by browser
- Works in Chrome, Firefox, Edge

**Priority 2: Authorization Header (Safari/iOS)**
- Required for Safari/iOS compatibility
- Format: `Authorization: Bearer <token>`

### Login Responses

All login endpoints return tokens in response body:

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "5c084770aff7b0db09a105ab4b4c3e138210e45b..."
    },
    "expiresIn": 900
  }
}
```

### Frontend Implementation

```typescript
// Store token for Safari/iOS
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important for cookies
  });

  const data = await response.json();
  
  // Store token for Authorization header (Safari/iOS)
  if (data.data?.tokens?.accessToken) {
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
  }

  return data;
}

// Use token in requests
function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  const headers: any = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

### Guest Token Authentication

For guest users, use guest token:

```typescript
headers['Authorization'] = `Guest ${guestToken}`;
// OR
headers['X-Guest-Token'] = guestToken;
```

---

## 12. Forgot Password (Admin & Staff)

### 🆕 NEW FEATURE: Password Reset with OTP

This feature allows **Admin and Staff** users to reset their passwords using a 6-digit OTP code sent via email.

**IMPORTANT:** This feature is **NOT available for regular users/customers**. Only Admin and Staff accounts can use forgot password functionality.

### API Endpoints

**1. Request Password Reset OTP (Forgot Password)**

```http
POST /api/v1/auth/admin/forgot-password
POST /api/v1/staff-accounts/forgot-password
```

**Request Body:**
```json
{
  "email": "admin@bambite.com"
}
```

**Request Headers:**
- `Content-Type: application/json`
- No authentication required (public endpoint)

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "If an account exists with this email, a password reset OTP has been sent. Please check your email."
}
```

**Response (Rate Limited - 429):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many password reset requests. Please wait before requesting another OTP."
}
```

**Response (Validation Error - 400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Email is required"
}
```

**Backend Behavior:**
- Always returns success message (doesn't reveal if email exists - security feature)
- Sends 6-digit OTP code to email if account exists
- OTP expires in **15 minutes**
- Rate limited to **3 requests per hour** per email
- Invalidates any existing unused OTPs for the email/role

**2. Reset Password with OTP**

```http
POST /api/v1/auth/admin/reset-password
POST /api/v1/staff-accounts/reset-password
```

**Request Body:**
```json
{
  "email": "admin@bambite.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Request Headers:**
- `Content-Type: application/json`
- No authentication required (public endpoint)

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Password reset successful. You can now login with your new password."
}
```

**Response (Invalid OTP - 400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

**Response (Validation Error - 400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Email, OTP, and new password are required"
}
```

**Response (OTP Format Error - 400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "OTP must be exactly 6 digits"
}
```

**Response (Password Validation Error - 400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
}
```

**Backend Behavior:**
- Validates 6-digit OTP code
- Checks OTP expiry (15 minutes)
- Verifies OTP hasn't been used (single-use)
- Updates password with new hashed password
- Invalidates all other unused OTPs for the email/role
- New password must meet complexity requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### Frontend Implementation Requirements

**1. Forgot Password Page/Modal**

Create a "Forgot Password" page or modal accessible from the login page:

```typescript
interface ForgotPasswordRequest {
  email: string;
}

async function requestPasswordResetOTP(email: string, role: 'admin' | 'staff'): Promise<void> {
  const endpoint = role === 'admin' 
    ? '/api/v1/auth/admin/forgot-password'
    : '/api/v1/staff-accounts/forgot-password';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send OTP');
  }

  return response.json();
}
```

**UI Requirements:**
- Email input field with validation
- "Send OTP" button
- Success message: "If an account exists with this email, a password reset OTP has been sent. Please check your email."
- Error handling for rate limiting (429) - show "Too many requests. Please wait before requesting another OTP."
- Loading state during request
- Link back to login page
- Clear, user-friendly design

**2. Reset Password Page/Modal**

Create a "Reset Password" page or modal with OTP input:

```typescript
interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
  role: 'admin' | 'staff'
): Promise<void> {
  const endpoint = role === 'admin'
    ? '/api/v1/auth/admin/reset-password'
    : '/api/v1/staff-accounts/reset-password';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return response.json();
}
```

**UI Requirements:**
- Email input field (pre-filled if coming from forgot password page)
- OTP input field (6 digits, numeric only)
  - Consider using a 6-input field component for better UX
  - Auto-advance to next field on input
  - Paste support for full OTP
  - Clear visual feedback for each digit
- New password input field (with show/hide toggle)
- Password strength indicator showing requirements
- Confirm password field (client-side validation)
- "Reset Password" button
- Success message: "Password reset successful. You can now login with your new password."
- Error handling:
  - Invalid/expired OTP: "Invalid or expired OTP. Please request a new one."
  - Validation errors: Show specific field errors
- Loading state during request
- Link to request new OTP if expired
- Link back to login page
- OTP expiry countdown timer (15 minutes)

**3. OTP Input Component (Recommended)**

Create a reusable 6-digit OTP input component:

```typescript
interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

function OTPInput({ value, onChange, error, disabled }: OTPInputProps) {
  const inputs = Array(6).fill(0);
  
  const handleChange = (index: number, digit: string) => {
    if (!/^\d$/.test(digit) && digit !== '') return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join('').slice(0, 6));
    
    // Auto-advance to next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      onChange(pasted);
      // Focus last input after paste
      const lastInput = document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`);
      lastInput?.focus();
    }
  };

  return (
    <div className="otp-input-container">
      <div className="otp-inputs">
        {inputs.map((_, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={error ? 'error' : ''}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

**4. Password Strength Indicator**

Show password requirements and strength:

```typescript
interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="password-strength">
      <div className="strength-bar" data-strength={strength}>
        <div className="strength-fill" style={{ width: `${(strength / 5) * 100}%` }} />
      </div>
      <p className="strength-label">{strengthLabels[strength - 1] || 'Very Weak'}</p>
      <ul className="password-requirements">
        <li className={checks.length ? 'valid' : ''}>
          ✓ At least 8 characters
        </li>
        <li className={checks.uppercase ? 'valid' : ''}>
          ✓ One uppercase letter
        </li>
        <li className={checks.lowercase ? 'valid' : ''}>
          ✓ One lowercase letter
        </li>
        <li className={checks.number ? 'valid' : ''}>
          ✓ One number
        </li>
        <li className={checks.special ? 'valid' : ''}>
          ✓ One special character (@$!%*?&)
        </li>
      </ul>
    </div>
  );
}
```

**5. Complete Flow Example**

```typescript
// ForgotPasswordPage.tsx
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const role = 'admin'; // or 'staff' - determine from context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await requestPasswordResetOTP(email, role);
      setSuccess(true);
    } catch (err: any) {
      if (err.message.includes('429') || err.message.includes('Too many')) {
        setError('Too many requests. Please wait before requesting another OTP.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-success">
        <h2>Check Your Email</h2>
        <p>If an account exists with this email, a password reset OTP has been sent. Please check your email.</p>
        <p className="otp-info">The OTP code will expire in 15 minutes.</p>
        <Link to={`/reset-password?email=${encodeURIComponent(email)}&role=${role}`}>
          Enter OTP
        </Link>
        <Link to="/login">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
        <Link to="/login">Back to Login</Link>
      </form>
    </div>
  );
}

// ResetPasswordPage.tsx
function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff'>('admin');

  useEffect(() => {
    // Get email and role from URL params if coming from forgot password page
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const roleParam = params.get('role');
    if (emailParam) setEmail(emailParam);
    if (roleParam === 'staff' || roleParam === 'admin') setRole(roleParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword, role);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login?passwordReset=success';
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset password';
      if (errorMessage.includes('OTP') || errorMessage.includes('otp')) {
        setOtpError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-success">
        <h2>Password Reset Successful</h2>
        <p>Your password has been reset successfully. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="otp">OTP Code (6 digits)</label>
          <OTPInput 
            value={otp} 
            onChange={setOtp} 
            error={otpError}
            disabled={loading}
          />
          <p className="otp-help">Enter the 6-digit code sent to your email. Expires in 15 minutes.</p>
          <Link to={`/forgot-password?email=${encodeURIComponent(email)}&role=${role}`}>
            Request New OTP
          </Link>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            disabled={loading}
          />
          <PasswordStrength password={newPassword} />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            disabled={loading}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <div className="error-message">Passwords do not match</div>
          )}
        </div>

        {(error || otpError) && (
          <div className="error-message">
            {otpError || error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || otp.length !== 6 || newPassword !== confirmPassword}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <Link to="/login">Back to Login</Link>
      </form>
    </div>
  );
}
```

**6. Integration with Login Page**

Add "Forgot Password?" link on login page:

```typescript
// LoginPage.tsx
function LoginPage() {
  const role = 'admin'; // or 'staff' - determine from context
  
  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
        {/* Login form fields */}
        <div className="login-actions">
          <a href={`/forgot-password?role=${role}`}>Forgot Password?</a>
        </div>
      </form>
    </div>
  );
}
```

### Security Considerations

1. **Rate Limiting:** Show appropriate error message when user hits rate limit (3 requests/hour)
2. **OTP Expiry:** Display countdown timer showing OTP expiry (15 minutes)
3. **Email Privacy:** Never reveal if email exists in system (always show success message)
4. **Password Validation:** Validate password strength client-side before submission
5. **OTP Format:** Ensure OTP input only accepts 6 numeric digits
6. **Error Messages:** Show user-friendly error messages without revealing system details
7. **Single-Use OTP:** Inform users that OTP can only be used once
8. **Auto-Logout:** Consider logging out user from all sessions after password reset (if applicable)

### Testing Checklist

- [ ] Forgot password page accessible from login page
- [ ] Email validation works correctly
- [ ] OTP sent successfully (check email)
- [ ] Rate limiting works (try 4 requests in 1 hour)
- [ ] OTP input accepts only 6 digits
- [ ] OTP paste functionality works
- [ ] OTP auto-advance works
- [ ] OTP backspace navigation works
- [ ] Password strength indicator works
- [ ] Password reset with valid OTP succeeds
- [ ] Password reset with invalid OTP shows error
- [ ] Password reset with expired OTP shows error
- [ ] Password reset with used OTP shows error
- [ ] Password validation errors show correctly
- [ ] Success redirect to login page works
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Works for both admin and staff accounts
- [ ] OTP expiry countdown timer works (if implemented)
- [ ] Form validation prevents submission with invalid data

---

## 13. API Endpoints Reference

### Complete Endpoint List

#### Authentication
- `POST /api/v1/auth/user/register` - User registration
- `POST /api/v1/auth/user/login` - User login
- `GET /api/v1/auth/user/profile` - Get user profile
- `PUT /api/v1/auth/user/profile/image` - Upload profile image
- `DELETE /api/v1/auth/user/profile/image` - Delete profile image
- `POST /api/v1/auth/admin/login` - Admin login
- `GET /api/v1/auth/admin/profile` - Get admin profile
- `POST /api/v1/auth/admin/forgot-password` - Request password reset OTP (Admin)
- `POST /api/v1/auth/admin/reset-password` - Reset password with OTP (Admin)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

#### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

#### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order
- `PATCH /api/v1/orders/:id/status` - Update status (Admin)
- `POST /api/v1/orders/:id/cancel` - Cancel order

#### Cart
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart` - Add to cart
- `PUT /api/v1/cart` - Update cart item
- `DELETE /api/v1/cart/:productId` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

#### Billing Addresses
- `GET /api/v1/billing-addresses` - Get addresses
- `GET /api/v1/billing-addresses/prefill` - Get prefill data
- `POST /api/v1/billing-addresses` - Create address
- `PUT /api/v1/billing-addresses/:id` - Update address
- `DELETE /api/v1/billing-addresses/:id` - Delete address
- `PATCH /api/v1/billing-addresses/:id/default` - Set default

#### Favourites
- `GET /api/v1/favourites` - Get favourites
- `POST /api/v1/favourites` - Add favourite
- `DELETE /api/v1/favourites/:productId` - Remove favourite
- `GET /api/v1/favourites/check/:productId` - Check if favorited

#### Reviews
- `GET /api/v1/reviews/product/:productId` - Get product reviews
- `GET /api/v1/reviews/prefill` - Get prefill data
- `POST /api/v1/reviews` - Create review
- `POST /api/v1/reviews/:id/helpful` - Vote helpful
- `GET /api/v1/reviews/admin/all` - Get all reviews (Admin)
- `PATCH /api/v1/reviews/admin/:id/status` - Update status (Admin)

#### FAQs
- `GET /api/v1/faqs` - Get FAQs
- `GET /api/v1/faqs/:id` - Get FAQ
- `POST /api/v1/faqs` - Create FAQ (Admin)
- `PUT /api/v1/faqs/:id` - Update FAQ (Admin)
- `PATCH /api/v1/faqs/:id/order` - Update order (Admin)
- `PATCH /api/v1/faqs/:id/status` - Toggle status (Admin)
- `DELETE /api/v1/faqs/:id` - Delete FAQ (Admin)

#### Themes
- `GET /api/v1/themes` - Get themes
- `GET /api/v1/themes/selected` - Get selected theme
- `POST /api/v1/themes` - Create theme (Admin)
- `PUT /api/v1/themes/:id` - Update theme (Admin)
- `PATCH /api/v1/themes/:id/select` - Select theme (Admin)
- `PATCH /api/v1/themes/:id/unselect` - Unselect theme (Admin)
- `DELETE /api/v1/themes/:id` - Delete theme (Admin)

#### Animations
- `GET /api/v1/animations` - Get animations
- `GET /api/v1/animations/selected` - Get selected animation
- `POST /api/v1/animations` - Create animation (Admin)
- `PUT /api/v1/animations/:id` - Update animation (Admin)
- `PATCH /api/v1/animations/:id/select` - Select animation (Admin)
- `PATCH /api/v1/animations/:id/unselect` - Unselect animation (Admin)
- `DELETE /api/v1/animations/:id` - Delete animation (Admin)

#### Animation Trigger
- `GET /api/v1/animation-trigger` - Get trigger state
- `PATCH /api/v1/animation-trigger` - Update trigger state (Admin)

#### Real-Time (Polling)
- `GET /api/v1/realtime/order/:orderId` - Poll order status
- `GET /api/v1/realtime/product/:productId/inventory` - Poll inventory
- `GET /api/v1/realtime/cart` - Poll cart
- `GET /api/v1/realtime/admin/orders` - Poll admin orders

#### Staff Management
- `GET /api/v1/staff-accounts` - List staff accounts (Admin)
- `POST /api/v1/staff-accounts` - Create staff account (Admin)
- `GET /api/v1/staff-accounts/profile` - Get staff profile
- `POST /api/v1/staff-accounts/login` - Staff login
- `POST /api/v1/staff-accounts/forgot-password` - Request password reset OTP (Staff)
- `POST /api/v1/staff-accounts/reset-password` - Reset password with OTP (Staff)
- `POST /api/v1/staff-accounts/change-password` - Change password

#### Inventory
- `POST /api/v1/inventory` - Record change (Admin)
- `GET /api/v1/inventory/summary` - Get summary (Admin)
- `GET /api/v1/inventory/changes` - Get all changes (Admin)
- `GET /api/v1/inventory/product/:id` - Get product history (Admin)

#### Categories
- `GET /api/v1/categories` - List categories (Admin)
- `GET /api/v1/categories/active` - Get active categories (Public)
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `PATCH /api/v1/categories/:id/status` - Update status (Admin)

#### Job Posts
- `GET /api/v1/job-posts` - List job posts (Public)
- `GET /api/v1/job-posts/:id` - Get job post (Public)
- `POST /api/v1/job-posts` - Create job post (Admin)
- `PUT /api/v1/job-posts/:id` - Update job post (Admin)
- `DELETE /api/v1/job-posts/:id` - Delete job post (Admin)

#### Apply Jobs
- `POST /api/v1/apply-jobs` - Submit application (Public)
- `GET /api/v1/apply-jobs` - List applications (Admin)
- `GET /api/v1/apply-jobs/:id` - Get application (Admin)
- `PUT /api/v1/apply-jobs/:id` - Update application (Admin)
- `POST /api/v1/apply-jobs/:id/email` - Send email (Admin)

#### Interviews
- `POST /api/v1/interviews` - Create interview (Admin)
- `GET /api/v1/interviews` - List interviews (Admin)
- `GET /api/v1/interviews/:id` - Get interview (Admin)
- `PUT /api/v1/interviews/:id` - Update interview (Admin)
- `DELETE /api/v1/interviews/:id` - Delete interview (Admin)

---

## 🎯 Implementation Checklist

### Admin Dashboard

- [ ] Implement WebSocket connection for real-time order updates
- [ ] Add order status update notifications
- [ ] Implement new order notifications
- [ ] Add inventory update real-time display
- [ ] Implement FAQ management UI
- [ ] Add Theme management UI
- [ ] Add Animation management UI
- [ ] Implement Review moderation UI
- [ ] Add billing address management (for order viewing)
- [ ] Update product creation form (description optional)
- [ ] Add profile image upload for admin
- [ ] **Add Forgot Password functionality (Admin accounts)**
  - [ ] Forgot Password page/modal accessible from login
  - [ ] OTP request form with email input
  - [ ] Reset Password page/modal with OTP input
  - [ ] 6-digit OTP input component (numeric only, auto-advance, paste support)
  - [ ] Password strength indicator component
  - [ ] Password confirmation field
  - [ ] Error handling for rate limiting (429)
  - [ ] Error handling for invalid/expired OTP
  - [ ] Success message display
  - [ ] Loading states
  - [ ] Integration with login page ("Forgot Password?" link)

### Staff Portal

- [ ] Implement WebSocket connection
- [ ] Add order status update notifications
- [ ] Implement FAQ management (if has content_management permission)
- [ ] Add Theme/Animation management (if has theme_and_animation permission)
- [ ] Implement Review moderation (if has review_management permission)
- [ ] Update product management (description optional)
- [ ] **Add Forgot Password functionality (Staff accounts)**
  - [ ] Forgot Password page/modal accessible from login
  - [ ] OTP request form with email input
  - [ ] Reset Password page/modal with OTP input
  - [ ] 6-digit OTP input component (numeric only, auto-advance, paste support)
  - [ ] Password strength indicator component
  - [ ] Password confirmation field
  - [ ] Error handling for rate limiting (429)
  - [ ] Error handling for invalid/expired OTP
  - [ ] Success message display
  - [ ] Loading states
  - [ ] Integration with login page ("Forgot Password?" link)

### Common Updates

- [ ] Update authentication to handle tokens in response body
- [ ] Implement Authorization header fallback for Safari/iOS
- [ ] Add guest token management
- [ ] Update error handling for new error formats
- [ ] Implement polling fallback for WebSocket
- [ ] Update API client to include all new endpoints

---

## 📝 Important Notes

1. **Safari/iOS Compatibility:** Always use Authorization header as fallback
2. **Guest Users:** Handle guest tokens and merge on login/register
3. **Real-Time Updates:** Implement WebSocket with polling fallback
4. **Error Handling:** Check for `details` object in error responses
5. **Permissions:** Verify user permissions before showing UI elements
6. **Rate Limiting:** Handle 429 errors gracefully
7. **File Uploads:** Use `multipart/form-data` for images
8. **Pagination:** All list endpoints support `page` and `limit` query params

---

## 🔗 Related Documentation

- `AUTHENTICATION_VERIFICATION.md` - Complete authentication guide
- `FRONTEND_SAFARI_FIX.md` - Safari/iOS cookie fix details
- `USER_FRONTEND_UPDATE_PROMPT.md` - User-facing frontend updates
- `JOB_APPLICATION_FLOW.md` - Job application workflow

---

**Last Updated:** 2025-01-23
**Backend Version:** v1
**API Base URL:** `/api/v1`
