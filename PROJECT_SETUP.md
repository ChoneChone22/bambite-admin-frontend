# Bambite Frontend - Project Overview

## ✅ Completed Setup

### 1. **Project Initialization**

- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS configured
- ESLint setup

### 2. **Dependencies Installed**

- axios (HTTP client)
- formik (form management)
- yup (validation schemas)

### 3. **Project Structure Created**

```
src/
├── types/
│   ├── api.ts           # Complete API types, enums, models
│   └── index.ts         # Type exports & constants
├── lib/
│   ├── axios.ts         # Axios instance with interceptors
│   ├── config.ts        # Environment configuration
│   ├── utils.ts         # Helper functions (formatPrice, etc.)
│   └── validations.ts   # Yup validation schemas
├── services/
│   └── api.ts           # All API endpoints (auth, products, cart, orders, staff, inventory)
└── hooks/
    └── index.ts         # Custom hooks (useAuth, useCart, useProducts, etc.)
```

### 4. **Key Features Implemented**

#### Authentication System

- JWT token management
- Automatic Bearer token injection via Axios interceptors
- Token stored in localStorage
- Auto redirect to login on 401

#### Type Safety

- All API responses typed
- No `any` types used
- Enums for categories, order status, inventory reasons
- Complete request/response interfaces

#### Axios Configuration

- Base URL: `http://localhost:3000/api/v1`
- Request interceptor: Injects Bearer token
- Response interceptor: Global error handling
- Helper functions: `getAuthToken()`, `setAuthToken()`, `clearAuth()`, `isAuthenticated()`

#### Custom Hooks

- `useAuth()`: Login, register, logout, profile management
- `useProducts()`: Product listing with filters
- `useProduct()`: Single product details
- `useCart()`: Cart operations (add, update, remove, clear)
- `useOrders()`: Order history
- `useOrder()`: Single order details

#### Styling

- Custom Tailwind utilities
- Responsive container
- Button variants (primary, secondary)
- Form input styles
- Card components
- Color scheme with CSS variables

### 5. **Pages Created**

- Homepage with hero section and features
- Loading component
- Error handler
- 404 page
- Updated layout with proper metadata

### 6. **Environment Configuration**

- `.env.local` created with API URL
- Configuration file for environment variables

## 📝 Type Definitions

### Enums

- `ProductCategory`: SOUP, SALAD, NOODLE, SNACK
- `OrderStatus`: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `InventoryReason`: PURCHASE, RESTOCK, DAMAGE, ADJUSTMENT
- `UserRole`: ADMIN, CUSTOMER, STAFF

### Models

- `User`: id, email, phoneNumber, address, role
- `Product`: id, name, category, ingredients, price, stockQuantity
- `CartItem`: productId, quantity, product
- `Order`: id, status, items, total
- `Staff`: id, position, salary, overtimePayment, tax, netPay
- `InventoryLog`: id, productId, reason, quantityChange, previousQuantity, newQuantity

## 🚀 Next Steps

To continue building the application, you can:

1. **Create Authentication Pages**

   - `/app/login/page.tsx`
   - `/app/register/page.tsx`

2. **Create Product Pages**

   - `/app/products/page.tsx` (product listing)
   - `/app/products/[id]/page.tsx` (product details)

3. **Create Cart & Checkout**

   - `/app/cart/page.tsx`
   - `/app/checkout/page.tsx`

4. **Create Order Pages**

   - `/app/orders/page.tsx` (order history)
   - `/app/orders/[id]/page.tsx` (order details)

5. **Create Admin Dashboard**

   - `/app/admin/products/page.tsx`
   - `/app/admin/orders/page.tsx`
   - `/app/admin/staff/page.tsx`

6. **Add Components**
   - `src/components/ProductCard.tsx`
   - `src/components/CartItem.tsx`
   - `src/components/Navbar.tsx`
   - `src/components/Footer.tsx`

## 🔧 Development

```bash
npm run dev
```

Visit http://localhost:3000 to see the homepage.

## 📦 Image Usage

All products use the placeholder image: `https://placehold.co/600x400`

Access it via the constant:

```typescript
import { PLACEHOLDER_IMAGE } from "@/types";
```

## 🔐 Authentication Flow

```typescript
// In a component
import { useAuth } from "@/hooks";

const { login, user, isAuthenticated, logout } = useAuth();

// Login
await login({ email, password });

// Check auth status
if (isAuthenticated) {
  // User is logged in
}

// Logout
await logout();
```

## 📡 API Usage

```typescript
import api from '@/services/api';

// Get products
const products = await api.products.getAll({ category: 'SOUP' });

// Add to cart
await api.cart.addItem({ productId: 'abc123', quantity: 2 });

// Create order
const order = await api.orders.create({ items: [...] });
```

All API calls automatically include the Bearer token if the user is authenticated.
