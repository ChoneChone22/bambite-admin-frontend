# Product Options - Frontend Implementation Guide (Dashboard & Storefront)

This guide provides comprehensive instructions for implementing **Product Options** support across the frontend. Products can now have options (e.g., Size, Color) that users must select when adding to cart and creating orders. The backend captures and stores these selections.

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Changes Summary](#2-api-changes-summary)
3. [Add to Cart](#3-add-to-cart)
4. [Cart Display](#4-cart-display)
5. [Create Order / Checkout](#5-create-order--checkout)
6. [Order Display (Admin/Staff Dashboard)](#6-order-display-adminstaff-dashboard)
7. [Product Detail Page (Storefront)](#7-product-detail-page-storefront)
8. [Option Resolution (Display Names)](#8-option-resolution-display-names)
9. [Error Handling](#9-error-handling)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. Overview

### What Changed?

- **Cart:** Items can now include `selectedOptions` (e.g., Size: medium, Color: blue)
- **Orders:** Order items now include `selectedOptionsSnapshot` - the options the customer chose at order time
- **Products with options:** Require valid selection before add-to-cart or checkout
- **Products without options:** Omit `selectedOptions` entirely

### Data Format

**selectedOptions / selectedOptionsSnapshot:**
```typescript
// { optionId: selectedValue }
// Keys = Option UUIDs, Values = Selected value from optionLists
{
  "550e8400-e29b-41d4-a716-446655440001": "medium",
  "550e8400-e29b-41d4-a716-446655440002": "blue"
}
```

### Option Structure (from Product)

```typescript
interface ProductOption {
  id: string;           // Option UUID (use as key in selectedOptions)
  name: string;         // e.g., "size"
  displayName: string;  // e.g., "Size" (for UI display)
  optionLists: string[]; // e.g., ["small", "medium", "large"]
}
```

---

## 2. API Changes Summary

| Endpoint | Change | Details |
|----------|--------|---------|
| `POST /api/v1/cart/items` | Request body | Optional `selectedOptions` |
| `GET /api/v1/cart` | Response | Items include `selectedOptions`, `productOptions` |
| `POST /api/v1/orders` | Request body | Items can include `selectedOptions` |
| `GET /api/v1/orders/:id` | Response | Order items include `selectedOptionsSnapshot` |
| `GET /api/v1/orders` | Response | Same as above |
| `GET /api/v1/products/:id` | Response | Product includes `productOptions` (already existed) |

---

## 3. Add to Cart

### API Endpoint

```
POST /api/v1/cart/items
```

### Request Body

```typescript
interface AddToCartRequest {
  productId: string;      // UUID, required
  quantity: number;       // Required, positive integer
  selectedOptions?: {    // Optional - REQUIRED for products with options
    [optionId: string]: string;  // optionId (UUID) -> selected value
  };
}
```

### Examples

**Product WITHOUT options:**
```json
{
  "productId": "abc-123",
  "quantity": 2
}
```

**Product WITH options (e.g., Size, Color):**
```json
{
  "productId": "abc-123",
  "quantity": 2,
  "selectedOptions": {
    "550e8400-e29b-41d4-a716-446655440001": "medium",
    "550e8400-e29b-41d4-a716-446655440002": "blue"
  }
}
```

### Validation Rules

- **Products with options:** Must provide `selectedOptions` with ALL option IDs and valid values from `optionLists`
- **Products without options:** Must NOT provide `selectedOptions` (or provide empty object)
- **Same product + same options:** Updates quantity (merges)
- **Same product + different options:** Creates new cart line (e.g., 1x T-shirt Medium Blue, 1x T-shirt Small Red = 2 lines)

### Frontend Implementation

```typescript
async function addToCart(productId: string, quantity: number, selectedOptions?: Record<string, string>) {
  const body: Record<string, unknown> = { productId, quantity };
  if (selectedOptions && Object.keys(selectedOptions).length > 0) {
    body.selectedOptions = selectedOptions;
  }

  const response = await fetch('/api/v1/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // For httpOnly cookies
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to add to cart');
  }
  return response.json();
}
```

### Error Responses

| Status | Message | Action |
|--------|---------|--------|
| 400 | "Invalid or missing selection for \"Size\". Please select a valid option (e.g., small, medium, large)." | Show option selector, ensure valid value |
| 400 | "Product has no options. Do not provide selectedOptions." | Remove selectedOptions from request |
| 400 | "Product does not have option \"...\"" | Don't send options product doesn't have |

---

## 4. Cart Display

### API Response: GET /api/v1/cart

```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  category: { id: string; name: string; status: string };
  selectedOptions: Record<string, string> | null;  // 🆕 User's chosen options
  productOptions: {                                 // 🆕 Option metadata for display
    id: string;
    name: string;
    displayName: string;
    optionLists: string[];
  }[];
}
```

### Display Logic

**Show selected options under each cart item:**

```tsx
function CartItemDisplay({ item }: { item: CartItem }) {
  const optionsText = useMemo(() => {
    if (!item.selectedOptions || Object.keys(item.selectedOptions).length === 0)
      return null;
    return item.productOptions
      .map((opt) => {
        const value = item.selectedOptions?.[opt.id];
        return value ? `${opt.displayName}: ${value}` : null;
      })
      .filter(Boolean)
      .join(', ');
  }, [item]);

  return (
    <div>
      <h4>{item.name}</h4>
      {optionsText && <p className="text-sm text-gray-500">{optionsText}</p>}
      <p>Qty: {item.quantity} × ${item.price} = ${item.subtotal}</p>
    </div>
  );
}
```

### Update/Remove Cart Item

- **Update quantity:** `PUT /api/v1/cart/items/:productId` - When product has multiple lines (different options), this may be ambiguous. Consider using cart item ID if backend adds that route.
- **Remove:** `DELETE /api/v1/cart/items/:productId` - Same consideration for products with multiple option variants in cart.

---

## 5. Create Order / Checkout

### API Endpoint

```
POST /api/v1/orders
```

### Request Body

```typescript
interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    selectedOptions?: Record<string, string>;  // 🆕 Required for products with options
  }>;
  email: string;
  phoneNumber: string;
  billingAddress?: { ... };
  billingAddressId?: string;
}
```

### Building Order Items from Cart

When user proceeds to checkout, send cart items with their `selectedOptions`:

```typescript
function buildOrderItemsFromCart(cartItems: CartItem[]) {
  return cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    ...(item.selectedOptions && Object.keys(item.selectedOptions).length > 0
      ? { selectedOptions: item.selectedOptions }
      : {}),
  }));
}

// Usage
const orderItems = buildOrderItemsFromCart(cart.items);
await createOrder({
  items: orderItems,
  email: userEmail,
  phoneNumber: userPhone,
});
```

### Validation Rules

- **Products with options:** Must include `selectedOptions` with valid values
- **Products without options:** Omit `selectedOptions`
- Backend returns 400 with clear message if validation fails

### Error Responses

| Status | Message | Action |
|--------|---------|--------|
| 400 | "Product \"T-Shirt\" requires option selection (e.g., Size, Color). Please select all required options." | Ensure all options are selected before checkout |
| 400 | "Invalid or missing selection for \"Size\" on product \"T-Shirt\". Valid options: small, medium, large" | Fix selection |
| 403 | "Please verify your email before placing an order." | Redirect to email verification flow |

---

## 6. Order Display (Admin/Staff Dashboard)

### API Response: GET /api/v1/orders, GET /api/v1/orders/:id

Order items now include `selectedOptionsSnapshot`:

```typescript
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  netPrice: number;
  product: {
    id: string;
    name: string;
    category: { id: string; name: string; status: string };
    description?: string;
  };
  selectedOptionsSnapshot: Record<string, string> | null;  // 🆕 Options at order time
}
```

### Display in Orders Table / Detail View

**Option A: Resolve display names via Options API**

Fetch options once: `GET /api/v1/options` returns all options with `id`, `displayName`, `optionLists`. Build a map `optionId -> displayName`.

```typescript
// Fetch options (e.g., on app load or orders page load)
const options = await fetch('/api/v1/options').then(r => r.json());
const optionMap = new Map(options.data.map((o: Option) => [o.id, o.displayName]));

function formatOrderItemOptions(snapshot: Record<string, string> | null, optionMap: Map<string, string>) {
  if (!snapshot || Object.keys(snapshot).length === 0) return null;
  return Object.entries(snapshot)
    .map(([optId, value]) => `${optionMap.get(optId) || optId}: ${value}`)
    .join(', ');
}
```

**Option B: Display values only (simpler)**

If you don't have option metadata, show values: `"medium, blue"`

### UI Example: Order Detail Modal/Page

```tsx
function OrderItemRow({ item }: { item: OrderItem }) {
  const optionsText = item.selectedOptionsSnapshot
    ? Object.entries(item.selectedOptionsSnapshot)
        .map(([id, val]) => `${val}`)  // Or resolve to "Size: medium"
        .join(', ')
    : null;

  return (
    <tr>
      <td>
        {item.product.name}
        {optionsText && (
          <span className="text-sm text-gray-500"> ({optionsText})</span>
        )}
      </td>
      <td>{item.quantity}</td>
      <td>${item.priceAtTime}</td>
      <td>${item.netPrice}</td>
    </tr>
  );
}
```

### Orders Table Enhancement

In the orders list/detail view, ensure each line item shows:
- Product name
- **Selected options** (e.g., "Size: Medium, Color: Blue")
- Quantity, price, line total

---

## 7. Product Detail Page (Storefront)

### Fetching Product with Options

`GET /api/v1/products/:id` returns product with `productOptions`:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  // ... other fields
  productOptions: Array<{
    option: {
      id: string;
      name: string;
      displayName: string;
      optionLists: string[];  // e.g., ["small", "medium", "large"]
    };
  }>;
}
```

### Option Selector UI

```tsx
function ProductOptionsSelector({
  productOptions,
  selectedOptions,
  onChange,
}: {
  productOptions: Product['productOptions'];
  selectedOptions: Record<string, string>;
  onChange: (opts: Record<string, string>) => void;
}) {
  const handleChange = (optionId: string, value: string) => {
    onChange({ ...selectedOptions, [optionId]: value });
  };

  return (
    <div className="space-y-4">
      {productOptions.map(({ option }) => (
        <div key={option.id}>
          <label className="block font-medium">{option.displayName}</label>
          <select
            value={selectedOptions[option.id] ?? ''}
            onChange={(e) => handleChange(option.id, e.target.value)}
            required
          >
            <option value="">Select {option.displayName}</option>
            {(option.optionLists as string[]).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
```

### Add to Cart Flow

1. If product has `productOptions.length > 0`, show option selectors
2. User must select a value for EACH option before "Add to Cart" is enabled
3. On "Add to Cart" click, build `selectedOptions`: `{ [option.id]: selectedValue }` for each option
4. Call `POST /api/v1/cart/items` with `productId`, `quantity`, `selectedOptions`

```tsx
function ProductDetailPage({ product }: { product: Product }) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const canAddToCart =
    product.productOptions.length === 0 ||
    product.productOptions.every((po) => selectedOptions[po.option.id]);

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity, 
      Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
    );
  };

  return (
    <>
      {product.productOptions.length > 0 && (
        <ProductOptionsSelector
          productOptions={product.productOptions}
          selectedOptions={selectedOptions}
          onChange={setSelectedOptions}
        />
      )}
      <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} />
      <button onClick={handleAddToCart} disabled={!canAddToCart}>
        Add to Cart
      </button>
    </>
  );
}
```

---

## 8. Option Resolution (Display Names)

### Fetching Options

**Endpoint:** `GET /api/v1/options`  
**Auth:** Admin or staff with `product_options_management` permission (Admin Dashboard / Staff Portal only)

**For customer-facing storefront:** Options are included in:
- Product response (`productOptions`) - no separate fetch needed
- Cart response (`productOptions` per item) - no separate fetch needed

**For Admin/Staff dashboard** (order display with human-readable option names):
1. Use `GET /api/v1/options` to build optionId → displayName map (requires admin/staff auth)
2. Or display raw values from `selectedOptionsSnapshot` (simpler: "medium, blue" without labels)

### Option Response Structure

```typescript
interface Option {
  id: string;
  name: string;
  displayName: string;
  optionLists: string[];
}
```

---

## 9. Error Handling

### Common Errors

| Scenario | Backend Message | Frontend Action |
|----------|-----------------|-----------------|
| Product with options, no selection | "Invalid or missing selection for \"Size\"..." | Disable Add to Cart / Place Order until all options selected |
| Invalid option value | "Invalid or missing selection for \"Size\"... Valid options: small, medium, large" | Show validation error, highlight selector |
| Product without options, selectedOptions sent | "Product has no options. Do not provide selectedOptions." | Don't send selectedOptions for products without productOptions |
| Extra/invalid option ID | "Product does not have option \"...\"" | Only send option IDs that exist in product.productOptions |

### Validation Before Submit

```typescript
function validateCartItemForOrder(item: CartItem): string | null {
  if (item.productOptions.length === 0) return null;
  for (const po of item.productOptions) {
    const val = item.selectedOptions?.[po.option.id];
    const lists = po.option.optionLists as string[];
    if (!val || !lists.includes(val)) {
      return `Please select ${po.option.displayName} for ${item.name}`;
    }
  }
  return null;
}

// Before createOrder
const errors = cart.items.map(validateCartItemForOrder).filter(Boolean);
if (errors.length > 0) {
  setCheckoutError(errors[0]);
  return;
}
```

---

## 10. Testing Checklist

### Cart

- [ ] Add product WITHOUT options - no selectedOptions, succeeds
- [ ] Add product WITH options - with valid selectedOptions, succeeds
- [ ] Add product WITH options - without selectedOptions, fails with clear error
- [ ] Add product WITH options - invalid value, fails with clear error
- [ ] Same product + same options - updates quantity
- [ ] Same product + different options - creates new cart line
- [ ] Cart display shows selected options per item
- [ ] Cart items include productOptions for option metadata

### Checkout / Order Creation

- [ ] Create order with items that have selectedOptions - succeeds
- [ ] Create order with items that have no options - omit selectedOptions, succeeds
- [ ] Create order with product that has options but missing selectedOptions - fails
- [ ] Order confirmation shows selected options in line items
- [ ] Order confirmation email (backend) includes options in item names

### Admin/Staff Dashboard

- [ ] Orders list/detail shows selectedOptionsSnapshot per order item
- [ ] Option display names resolved correctly (or values shown)
- [ ] Order export/print includes option details if applicable

### Product Detail (Storefront)

- [ ] Products with options show option selectors
- [ ] Products without options - no selectors, Add to Cart works
- [ ] Add to Cart disabled until all options selected (for products with options)
- [ ] Selected options persist when changing quantity before Add to Cart

### Dual Cookie System

- [ ] Works with `credentials: 'include'` (Chrome)
- [ ] Works with Authorization header (Safari/iOS)
- [ ] Guest users can add to cart and create order with options

---

## Summary

| Area | Change |
|------|--------|
| **Add to Cart** | Optional `selectedOptions` in body; required for products with options |
| **Cart Response** | Items include `selectedOptions`, `productOptions` |
| **Create Order** | Items can include `selectedOptions`; required for products with options |
| **Order Response** | Order items include `selectedOptionsSnapshot` |
| **Product Detail** | Show option selectors when `productOptions.length > 0` |
| **Orders Dashboard** | Display `selectedOptionsSnapshot` in order item rows |

**Backend is ready. Frontend needs to:**
1. Show option selectors on product detail for products with options
2. Include selectedOptions when adding to cart and creating orders
3. Display selected options in cart and order views
4. Handle validation errors gracefully
