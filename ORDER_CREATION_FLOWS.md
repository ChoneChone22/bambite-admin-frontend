# Order Creation Flows: Authenticated Users vs Guest Users

This document explains the complete flow for creating an order, covering both **Authenticated Users** and **Guest Users** scenarios.

---

## 🔐 Flow 1: Authenticated User Order Creation

### Prerequisites
- User must be registered and logged in
- User's email must be verified (required for checkout)
- User has a valid JWT access token (in httpOnly cookie or Authorization header)

### Step-by-Step Flow

#### 1. **Add Items to Cart** (Optional but typical)
```
POST /api/v1/cart
Authorization: Bearer <accessToken> (or httpOnly cookie)
Body: { productId, quantity }
```

**Process:**
- `authenticateOptional` middleware checks for JWT token
- If token found → Authenticates user → `req.user` is set
- Cart service gets/creates cart for authenticated user
- Item added to cart with stock validation

**Response:**
```json
{
  "status": "success",
  "data": {
    "cart": { ... },
    "guestToken": null
  }
}
```

#### 2. **Get Cart** (Optional - to review items)
```
GET /api/v1/cart
Authorization: Bearer <accessToken> (or httpOnly cookie)
```

**Process:**
- Same authentication flow
- Returns cart with all items, totals, product details

#### 3. **Create Order**
```
POST /api/v1/orders
Authorization: Bearer <accessToken> (or httpOnly cookie)
Body: {
  "items": [{ productId, quantity }],
  "email": "user@example.com",       // REQUIRED (can be prefilled from account if omitted)
  "phoneNumber": "+66 8 1234 5678",  // REQUIRED
  "billingAddress": { ... },         // OPTIONAL - snapshot if provided
  "billingAddressId": "uuid"         // OPTIONAL - authenticated users: use saved address
}
```

**Middleware Chain:**
1. **`authenticateOptional`** → Authenticates user via JWT token
   - Checks httpOnly cookie: `accessToken_user`
   - Falls back to Authorization header: `Bearer <token>`
   - Sets `req.user = { id, email, role: 'user' }`

2. **`requireEmailVerification`** → Checks email verification
   - If `req.guest` → Skip (guests don't need verification)
   - If `req.user` → Check `emailVerified` in database
   - If not verified → **403 Forbidden**: "Email verification required"

3. **Rate Limiting** → `authenticatedOrderRateLimiter`
   - User ID-based rate limiting
   - **20 orders per hour** per user
   - If exceeded → **429 Too Many Requests**

4. **Validation** → `orderCreateSchema`
   - Validates items array, quantities
   - **Email and phoneNumber required** for all orders
   - Billing address optional

**Controller Logic (`createOrder`):**

1. **Extract User ID**
   ```typescript
   const userId = getUserId(req); // Returns req.user.id
   ```

2. **Contact Information**
   - **Email and phoneNumber** are required for all orders
   - For authenticated users: email can be **prefilled from account** if not provided in body
   - Phone number is always required

3. **Billing Address** (Optional)
   - If `billingAddress` or `billingAddressId` provided → Store as snapshot when creating order
   - If omitted → Order is created with only email and phone number (billing fields null)

4. **Order Service (`createOrder`)**:
   - **Duplicate Detection**: Checks for similar orders in last 5 minutes
   - **Stock Validation**: Verifies all products exist and have sufficient stock
   - **Order Limits**:
     - Max items per order (configurable)
     - Max quantity per item (configurable)
     - Max order value (configurable)
   - **Transaction** (Atomic):
     - Calculate total price (server-side, never trust client)
     - Update product stock (decrement)
     - Create inventory records
     - Create order with **email** and **phoneNumber** (billing address optional snapshot)
     - Create order items
     - **Clear cart** (delete all cart items)
   - **Fraud Detection Logging** (async, non-blocking)
   - **WebSocket Events** (async, non-blocking):
     - Emit new order to admin/staff
     - Emit order update to user

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "uuid",
      "userId": "uuid",
      "status": "PENDING",
      "netPrice": 1500.00,
      "orderedDate": "2024-01-15T10:30:00Z",
      "email": "user@example.com",
      "phoneNumber": "+66 8 1234 5678",
      "billingRegion": "Bangkok",
      "billingStreetAddress": "123 Main St",
      "billingCity": "Bangkok",
      "billingState": "Bangkok",
      "billingPostcode": "10110",
      "billingPhone": "+66123456789",
      "billingEmail": "user@example.com",
      "billingAddressId": "uuid",
      "orderItems": [ ... ]
    }
  }
}
```
*(Billing fields may be null if not provided.)*

---

## 👤 Flow 2: Guest User Order Creation

### Prerequisites
- No registration/login required
- Guest token (auto-generated on first request)
- Email and phone number required at checkout

### Step-by-Step Flow

#### 1. **Add Items to Cart** (Optional but typical)
```
POST /api/v1/cart
Authorization: Guest <guestToken> (or X-Guest-Token header, or guestToken in body)
Body: { productId, quantity }
```

**Process:**
- `authenticateOptional` middleware:
  - No JWT token found → Proceeds to guest flow
  - Checks for guest token in:
    1. Authorization header: `Guest <token>`
    2. X-Guest-Token header
    3. Query parameter: `?guestToken=...`
    4. Request body: `{ guestToken: "..." }`
  - If no guest token → Creates new guest user
  - If guest token provided → Validates and retrieves existing guest
  - Sets `req.guest = { id, guestToken, isGuest: true }`
  - Sets response header: `X-Guest-Token: <token>`
  - Stores `res.locals.guestToken` for response body

- Cart service gets/creates cart for guest user (same as authenticated)

**Response:**
```json
{
  "status": "success",
  "data": {
    "cart": { ... },
    "guestToken": "abc123..."  // For Safari/iOS - store and use in future requests
  }
}
```

#### 2. **Get Cart** (Optional - to review items)
```
GET /api/v1/cart
Authorization: Guest <guestToken> (or X-Guest-Token header)
```

**Process:**
- Same guest authentication flow
- Returns cart with all items

#### 3. **Create Order**
```
POST /api/v1/orders
Authorization: Guest <guestToken> (or X-Guest-Token header, or guestToken in body)
Body: {
  "items": [{ productId, quantity }],
  "email": "guest@example.com",       // REQUIRED
  "phoneNumber": "+66123456789",      // REQUIRED
  "billingAddress": { ... }           // OPTIONAL - snapshot if provided
}
```

**Middleware Chain:**
1. **`authenticateOptional`** → Guest user flow
   - No JWT token → Proceeds to guest flow
   - Gets/creates guest user
   - Sets `req.guest = { id, guestToken, isGuest: true }`

2. **`requireEmailVerification`** → **SKIPPED for guests**
   - Checks `req.guest` → If true, allows through
   - Guests don't need email verification

3. **Rate Limiting** → `guestOrderRateLimiter`
   - IP-based rate limiting (guests don't have user IDs)
   - **10 orders per hour** per IP address
   - If exceeded → **429 Too Many Requests**

4. **Validation** → `orderCreateSchema`
   - Validates items array, quantities
   - **Email and phoneNumber required** for all orders
   - Billing address optional

**Controller Logic (`createOrder`):**

1. **Extract Guest User ID**
   ```typescript
   const userId = getUserId(req); // Returns req.guest.id
   ```

2. **Contact Information**
   - **Email and phoneNumber** are required for all orders (same as authenticated)
   - Guest must provide both in the request body

3. **Update Guest Contact Info**
   ```typescript
   await guestUserService.updateGuestContactInfo(userId, email, phoneNumber);
   ```
   - Updates guest user record with email/phone for order confirmation

4. **Billing Address** (Optional for guests):
   - If provided, stored as snapshot; uses email/phone from request
   - If omitted, order is created with only email and phone number

5. **Order Service (`createOrder`)**:
   - Same process as authenticated users:
     - Duplicate detection
     - Stock validation
     - Order limits validation
     - Transaction (atomic):
       - Calculate total
       - Update stock
       - Create inventory records
       - Create order
       - Create order items
       - **Clear cart**
     - Fraud detection logging
     - WebSocket events

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "uuid",
      "userId": "guest-uuid",
      "status": "PENDING",
      "netPrice": 1500.00,
      "orderedDate": "2024-01-15T10:30:00Z",
      "email": "guest@example.com",
      "phoneNumber": "+66123456789",
      "billingRegion": "Bangkok",
      "billingStreetAddress": "123 Main St",
      "billingCity": "Bangkok",
      "billingState": "Bangkok",
      "billingPostcode": "10110",
      "billingPhone": "+66123456789",
      "billingEmail": "guest@example.com",
      "billingAddressId": null,
      "orderItems": [ ... ]
    },
    "guestToken": "abc123..."  // For Safari/iOS - store for future requests
  }
}
```
*(Billing fields may be null if not provided.)*

**Response Headers:**
- `X-Guest-Token: abc123...` (for browsers that support custom headers)

---

## 🔄 Key Differences Summary

| Aspect | Authenticated User | Guest User |
|--------|-------------------|------------|
| **Authentication** | JWT token (httpOnly cookie or Authorization header) | Guest token (multiple methods for Safari/iOS) |
| **Email Verification** | ✅ **Required** (403 if not verified) | ❌ Not required |
| **Rate Limiting** | 20 orders/hour (user ID-based) | 10 orders/hour (IP-based) |
| **Email/Phone** | **Required** (email can be prefilled from account) | ✅ **Required** in request body |
| **Billing Address** | Optional (snapshot if provided) | Optional (snapshot if provided) |
| **Billing Address Saving** | Can save new addresses (max 5) when provided | Cannot save addresses |
| **Guest Token in Response** | No | Yes (for Safari/iOS compatibility) |
| **Cart Persistence** | Permanent (until cleared) | Temporary (30 days expiry) |
| **Order History** | Accessible via `/my-orders` | Not accessible (no login) |

---

## 🔒 Security Features (Both Flows)

1. **Duplicate Order Detection**
   - Checks for similar orders within 5 minutes
   - Prevents accidental duplicate submissions
   - Returns 409 Conflict if duplicate detected

2. **Stock Validation**
   - Server-side stock checks (never trust client)
   - Atomic stock updates (transaction)
   - Prevents overselling

3. **Order Limits**
   - Max items per order
   - Max quantity per item
   - Max order value
   - Prevents abuse and fraud

4. **Fraud Detection Logging**
   - Logs suspicious patterns (multiple orders, high values)
   - Non-blocking (doesn't affect order creation)
   - Admin can review logs

5. **Rate Limiting**
   - Prevents spam/abuse
   - Different limits for authenticated vs guests
   - IP-based for guests, user ID-based for authenticated

---

## 📱 Safari/iOS Compatibility

Both flows support Safari/iOS through:

1. **Two-Cookie System**:
   - httpOnly cookies (primary method)
   - Authorization header fallback (for Safari)

2. **Guest Token Support**:
   - Multiple methods: Authorization header, X-Guest-Token header, query param, body
   - Token returned in response body (for Safari to store)
   - Token returned in X-Guest-Token header

3. **CORS Configuration**:
   - Credentials: true
   - Exposed headers: Set-Cookie
   - Proper origin handling

---

## 🎯 Success Criteria

Order creation is successful when:

1. ✅ All middleware passes (authentication, email verification, rate limiting, validation)
2. ✅ Stock is available for all items
3. ✅ Order limits are not exceeded
4. ✅ No duplicate order detected
5. ✅ Transaction completes successfully
6. ✅ Cart is cleared
7. ✅ Order is created with status "PENDING"
8. ✅ WebSocket events are emitted (non-blocking)
9. ✅ Response includes order details
10. ✅ Guest token included in response (if guest user)

---

## 🚨 Error Scenarios

### Authentication Errors
- **401 Unauthorized**: No token provided
- **401 Unauthorized**: Invalid/expired token
- **403 Forbidden**: Email not verified (authenticated users only)

### Validation Errors
- **400 Bad Request**: Missing required fields (email, phone, billing address for guests)
- **400 Bad Request**: Invalid data format
- **400 Bad Request**: Billing address required (authenticated users without default)

### Business Logic Errors
- **404 Not Found**: Product not found
- **400 Bad Request**: Insufficient stock
- **400 Bad Request**: Order limits exceeded
- **409 Conflict**: Duplicate order detected

### Rate Limiting
- **429 Too Many Requests**: Rate limit exceeded

### Server Errors
- **500 Internal Server Error**: Database transaction failed
- **500 Internal Server Error**: Unexpected error

---

## 📝 Notes

1. **Cart Clearing**: Cart is automatically cleared after successful order creation (both flows)

2. **Guest-to-User Conversion**: When a guest user registers/logs in, their cart and orders are automatically merged into their authenticated account

3. **Billing Address Snapshot**: All orders store a snapshot of the billing address at time of order (for historical accuracy, even if address is later deleted)

4. **Transaction Atomicity**: Order creation uses Prisma transactions to ensure all-or-nothing behavior (stock updates, order creation, cart clearing)

5. **Non-Blocking Operations**: Fraud detection logging and WebSocket events are async and don't block order creation
