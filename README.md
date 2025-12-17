# Bambite Frontend

Production-ready e-commerce frontend for Bambite Asian Cuisine delivery service.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Management**: Formik
- **Validation**: Yup
- **State Management**: React Hooks

## Project Structure

```
bambite-frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── loading.tsx          # Global loading state
│   ├── error.tsx            # Global error handler
│   └── not-found.tsx        # 404 page
├── src/
│   ├── types/               # TypeScript definitions
│   │   ├── api.ts          # API types (enums, models, requests/responses)
│   │   └── index.ts        # Central type exports
│   ├── lib/                 # Core utilities
│   │   ├── axios.ts        # Axios instance with interceptors
│   │   ├── config.ts       # Environment configuration
│   │   ├── utils.ts        # Helper functions
│   │   └── validations.ts  # Yup schemas
│   ├── services/            # API service layer
│   │   └── api.ts          # All API endpoints
│   └── hooks/               # Custom React hooks
│       └── index.ts        # useAuth, useProducts, useCart, etc.
├── public/                  # Static assets
├── .env.local              # Environment variables
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:3000/api/v1`

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file (already created):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
npm start
```

## Key Features

### 🔒 Authentication

- JWT token-based authentication
- Automatic token injection via Axios interceptors
- Protected routes and role-based access

### 📦 Type Safety

- Strict TypeScript configuration
- No `any` types allowed
- Comprehensive API response typing

### 🎨 Responsive Design

- Mobile-first Tailwind CSS approach
- Custom utility classes
- Consistent color scheme and theming

### 🔧 API Integration

- Centralized Axios configuration
- Request/response interceptors
- Automatic error handling
- Bearer token management from localStorage

### 📝 Form Management

- Formik for form state
- Yup validation schemas
- Type-safe form values

### 🖼️ Image Handling

- Single placeholder image: `https://placehold.co/600x400`
- Consistent product imagery across the app

## API Endpoints

All API calls are defined in `src/services/api.ts`:

- **Auth**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Products**: `/products` (CRUD operations)
- **Cart**: `/cart` (add, update, remove items)
- **Orders**: `/orders` (create, view, update status)
- **Staff**: `/staff` (management)
- **Inventory**: `/inventory` (logging)

## Type Definitions

### Enums

- `ProductCategory`: SOUP, SALAD, NOODLE, SNACK
- `OrderStatus`: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `InventoryReason`: PURCHASE, RESTOCK, DAMAGE, ADJUSTMENT

### Models

- `User`: User account information
- `Product`: Product details with category and pricing
- `CartItem`: Shopping cart items
- `Order`: Order with items and status
- `Staff`: Staff member information

## Custom Hooks

- `useAuth()`: Authentication state and methods
- `useProducts()`: Product listing with filters
- `useProduct()`: Single product details
- `useCart()`: Shopping cart management
- `useOrders()`: Order history
- `useOrder()`: Single order details

## Styling

Custom Tailwind utilities in `app/globals.css`:

- `.container-custom`: Responsive container
- `.btn-primary`: Primary button style
- `.btn-secondary`: Secondary button style
- `.input-field`: Form input style
- `.card`: Card component style

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
