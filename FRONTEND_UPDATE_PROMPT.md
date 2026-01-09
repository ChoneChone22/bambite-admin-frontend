# Frontend Admin Dashboard Update Prompt

## Overview
This document provides detailed instructions for updating the admin dashboard frontend to align with the latest backend API changes. The backend has undergone significant updates including new features for job management, category/option management, and improved product handling with image uploads.

## Prerequisites
- Postman collection file: `Bambite_Ecommerce_API.postman_collection.json`
- Backend API base URL: Configured via environment variable (typically `http://localhost:3000/api/v1` for development)
- Authentication: All admin routes require Bearer token authentication (stored in `adminToken` variable)

---

## 1. Category Management (NEW FEATURE)

### Overview
The product category system has been migrated from an enum to a dynamic Category table. Admins can now create, update, and manage categories dynamically.

### API Endpoints

#### Get Active Categories (Public - for dropdowns)
```
GET /api/v1/categories/active
```
**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Main Dish",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "products": 10
      }
    }
  ]
}
```

#### Get All Categories (Admin)
```
GET /api/v1/categories?status=active
```
**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)

#### Create Category (Admin)
```
POST /api/v1/categories
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Appetizers",
  "status": "active"  // optional, defaults to "active"
}
```

#### Update Category (Admin)
```
PUT /api/v1/categories/:id
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Updated Name",  // optional
  "status": "inactive"      // optional
}
```

#### Update Category Status Only (Admin)
```
PATCH /api/v1/categories/:id/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "status": "inactive"
}
```

#### Delete Category (Admin)
```
DELETE /api/v1/categories/:id
Authorization: Bearer {adminToken}
```

**Business Rules:**
- Category cannot be set to `inactive` or deleted if there are products with `stockQuantity > 0` in that category
- Error response: `400 Bad Request` with message: "Cannot deactivate category. There are X product(s) in stock associated with this category."

### UI Requirements
1. **Category Management Page:**
   - List all categories with status badges (Active/Inactive)
   - Show product count for each category
   - Create new category form
   - Edit category modal/form
   - Delete category with confirmation (check for products in stock)
   - Status toggle button/switch

2. **Category Selection in Product Forms:**
   - Replace hardcoded category dropdown with dynamic dropdown
   - Fetch active categories from `/api/v1/categories/active`
   - Display category name, show product count as helper text
   - Validate that selected category is active

---

## 2. Option Management (NEW FEATURE)

### Overview
Products can now have multiple options (e.g., Size: Small/Medium/Large, Color: Red/Blue/Green). Options are managed separately and can be assigned to products.

### API Endpoints

#### Get All Options (Admin)
```
GET /api/v1/options
Authorization: Bearer {adminToken}
```
**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "size",
      "displayName": "Size",
      "optionLists": ["small", "medium", "large"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "products": 5
      }
    }
  ]
}
```

#### Create Option (Admin)
```
POST /api/v1/options
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "size",                    // unique identifier (lowercase, no spaces)
  "displayName": "Size",             // user-friendly display name
  "optionLists": ["small", "medium", "large", "xlarge"]  // array of option values
}
```

#### Update Option (Admin)
```
PUT /api/v1/options/:id
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "size",                    // optional
  "displayName": "Product Size",     // optional
  "optionLists": ["s", "m", "l"]     // optional
}
```

#### Delete Option (Admin)
```
DELETE /api/v1/options/:id
Authorization: Bearer {adminToken}
```
**Note:** Deleting an option automatically removes it from all products (cascade delete).

### UI Requirements
1. **Option Management Page:**
   - List all options with their option lists
   - Show product count for each option
   - Create new option form with:
     - Name field (lowercase, no spaces, unique)
     - Display Name field
     - Option Lists (array input - allow adding/removing items)
   - Edit option modal/form
   - Delete option with confirmation

2. **Option Selection in Product Forms:**
   - Multi-select dropdown/checkboxes for options
   - Fetch all options from `/api/v1/options`
   - Display option name and displayName
   - Allow selecting multiple options (no duplicates)
   - Show selected options as chips/tags

---

## 3. Product Management Updates

### Critical Changes
1. **Category Field:** Changed from enum to `categoryId` (UUID string)
2. **Options Field:** New field `optionIds` (array of UUID strings)
3. **Image Upload:** Now uses `multipart/form-data` (see Image Upload section below)

### API Endpoints

#### Get All Products
```
GET /api/v1/products?page=1&limit=10&search=keyword&category={categoryId}&sortBy=createdAt&sortOrder=desc
```
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in name, description, ingredients
- `category` (optional): Filter by categoryId (UUID)
- `sortBy` (optional): Sort field (default: `createdAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Main Dish",
        "status": "active"
      },
      "ingredients": "Ingredient list",
      "price": 29.99,
      "stockQuantity": 100,
      "imageUrls": ["https://cloudinary.com/image1.jpg", "https://cloudinary.com/image2.jpg"],
      "productOptions": [
        {
          "id": "uuid",
          "option": {
            "id": "uuid",
            "name": "size",
            "displayName": "Size",
            "optionLists": ["small", "medium", "large"]
          }
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

#### Create Product (Admin)
```
POST /api/v1/products
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

Form Data:
- name: string (required)
- description: string (optional)
- categoryId: string (required, UUID)
- ingredients: string (optional)
- price: number (required)
- stockQuantity: number (required, default: 0)
- optionIds: string[] (optional, array of UUIDs)
- images: File[] (required, at least 1 image file)
```

**Important:** 
- Use `multipart/form-data` content type
- Field name for images must be `images` (plural)
- Multiple images can be uploaded at once
- `optionIds` should be sent as an array (check your HTTP client library's array handling)

**Example using FormData (JavaScript):**
```javascript
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('categoryId', 'uuid-here');
formData.append('price', '29.99');
formData.append('stockQuantity', '100');

// Option 1: Append each optionId separately (recommended)
if (productData.optionIds && productData.optionIds.length > 0) {
  productData.optionIds.forEach((id) => {
    formData.append('optionIds[]', id); // Use [] for array handling
  });
}

// Option 2: Send as JSON string (also supported)
// formData.append('optionIds', JSON.stringify(['option-uuid-1', 'option-uuid-2']));

// Option 3: Comma-separated string (also supported)
// formData.append('optionIds', 'option-uuid-1,option-uuid-2');

images.forEach((image) => {
  formData.append('images', image);
});
```

#### Update Product (Admin)
```
PUT /api/v1/products/:id
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

Form Data:
- name: string (optional)
- description: string (optional)
- categoryId: string (optional, UUID)
- ingredients: string (optional)
- price: number (optional)
- stockQuantity: number (optional)
- optionIds: string[] (optional, array of UUIDs)
- images: File[] (optional, new images to add)
- deleteOldImages: boolean (optional, default: false)
  - If `true`: Replace all existing images with new ones
  - If `false`: Add new images to existing ones
```

**Image Update Behavior:**
- If `images` provided and `deleteOldImages=false`: New images are added to existing ones
- If `images` provided and `deleteOldImages=true`: All old images are deleted, only new images remain
- If `images` not provided: Existing images remain unchanged

#### Delete Product (Admin)
```
DELETE /api/v1/products/:id
Authorization: Bearer {adminToken}
```

### UI Requirements

1. **Product List Page:**
   - Display products with category name (from nested `category` object)
   - Show product options as chips/tags
   - Filter by category (dropdown populated from active categories)
   - Search functionality
   - Pagination

2. **Create Product Form:**
   - **Category Selection:** Dropdown populated from `/api/v1/categories/active`
   - **Options Selection:** Multi-select dropdown/checkboxes populated from `/api/v1/options`
   - **Image Upload:**
     - File input with `multiple` attribute
     - Accept image files only (jpeg, jpg, png, webp)
     - Preview selected images before upload
     - Show upload progress
     - Display uploaded images after successful creation
   - **Form Fields:**
     - Name (required)
     - Description (optional, textarea)
     - Category (required, dropdown)
     - Ingredients (optional, textarea)
     - Price (required, number input)
     - Stock Quantity (required, number input, default: 0)
     - Options (optional, multi-select)
     - Images (required, file input, multiple)

3. **Edit Product Form:**
   - Pre-populate all fields including category and options
   - **Image Management:**
     - Display existing images with delete option
     - Allow adding new images
     - Toggle for "Replace all images" vs "Add to existing"
   - **Category:** Dropdown with current category selected
   - **Options:** Multi-select with current options selected

4. **Product Detail View:**
   - Display all product information
   - Show category name and status
   - Display all options with their option lists
   - Image gallery/carousel

---

## 4. Image Upload Implementation Details

### Technical Requirements

1. **Content Type:** `multipart/form-data`
2. **Field Name:** `images` (plural, required)
3. **File Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
4. **Max File Size:** 5MB per image (configured via `MAX_FILE_SIZE` env var)
5. **Multiple Files:** Supported (upload multiple images at once)

### Frontend Implementation Guide

#### Using Fetch API:
```javascript
const uploadProduct = async (productData, imageFiles) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('name', productData.name);
  formData.append('categoryId', productData.categoryId);
  formData.append('price', productData.price.toString());
  formData.append('stockQuantity', productData.stockQuantity.toString());
  
  // Add optional fields
  if (productData.description) {
    formData.append('description', productData.description);
  }
  if (productData.ingredients) {
    formData.append('ingredients', productData.ingredients);
  }
  
  // Add optionIds as array
  if (productData.optionIds && productData.optionIds.length > 0) {
    // Some libraries require JSON string, others handle arrays directly
    productData.optionIds.forEach((id) => {
      formData.append('optionIds[]', id); // or 'optionIds' depending on backend
    });
  }
  
  // Add image files
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });
  
  const response = await fetch('/api/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      // Don't set Content-Type header - browser will set it with boundary
    },
    body: formData,
  });
  
  return response.json();
};
```

#### Using Axios:
```javascript
import axios from 'axios';

const uploadProduct = async (productData, imageFiles) => {
  const formData = new FormData();
  
  // Add all fields (same as above)
  formData.append('name', productData.name);
  formData.append('categoryId', productData.categoryId);
  // ... other fields
  
  // Add images
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });
  
  const response = await axios.post('/api/v1/products', formData, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};
```

### Image Preview Component Example
```javascript
const ImageUpload = ({ onImagesChange }) => {
  const [previewUrls, setPreviewUrls] = useState([]);
  const [files, setFiles] = useState([]);
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    
    // Create preview URLs
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    
    onImagesChange(selectedFiles);
  };
  
  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviewUrls(newUrls);
    onImagesChange(newFiles);
  };
  
  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
      />
      <div className="image-preview-grid">
        {previewUrls.map((url, index) => (
          <div key={index} className="image-preview">
            <img src={url} alt={`Preview ${index + 1}`} />
            <button onClick={() => removeImage(index)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Error Handling
- **400 Bad Request:** Validation errors (missing required fields, invalid file type, file too large)
- **401 Unauthorized:** Missing or invalid authentication token
- **413 Payload Too Large:** Total upload size exceeds limit
- **500 Internal Server Error:** Server-side errors (Cloudinary upload failures, etc.)

---

## 5. Job Management Features (NEW)

### Overview
Complete job posting and application management system with interview scheduling.

### API Endpoints Summary

#### Place Tag Management
- `GET /api/v1/place-tags/active` - Get active place tags (Public)
- `GET /api/v1/place-tags` - Get all place tags (Admin)
- `POST /api/v1/place-tags` - Create place tag (Admin)
- `PUT /api/v1/place-tags/:id` - Update place tag (Admin)
- `PATCH /api/v1/place-tags/:id/status` - Update status (Admin)
- `DELETE /api/v1/place-tags/:id` - Delete place tag (Admin)

#### Job Post Management
- `GET /api/v1/job-posts` - Get all job posts (Public, with filters)
- `GET /api/v1/job-posts/:id` - Get job post by ID (Public)
- `POST /api/v1/job-posts` - Create job post (Admin)
- `PUT /api/v1/job-posts/:id` - Update job post (Admin)
- `DELETE /api/v1/job-posts/:id` - Delete job post (Admin)

#### Job Application Management
- `GET /api/v1/apply-jobs` - Get all applications (Admin, with filters)
- `GET /api/v1/apply-jobs/:id` - Get application by ID (Admin)
- `PATCH /api/v1/apply-jobs/:id/status` - Update status (Admin)
- `POST /api/v1/apply-jobs/:id/send-email` - Send email to applicant (Admin)
- `DELETE /api/v1/apply-jobs/:id` - Delete application (Admin)

#### Interview Management
- `GET /api/v1/interviews` - Get all interviews (Admin, with filters)
- `GET /api/v1/interviews/:id` - Get interview by ID (Admin)
- `GET /api/v1/interviews/by-apply-job/:applyJobId` - Get interview by application (Admin)
- `POST /api/v1/interviews` - Create interview (Admin, only for approved applications)
- `PUT /api/v1/interviews/:id` - Update interview (Admin)
- `DELETE /api/v1/interviews/:id` - Delete interview (Admin)

### UI Requirements for Job Management

1. **Place Tag Management Page:**
   - List all place tags with status
   - Create/Edit/Delete place tags
   - Status toggle (cannot deactivate if active job posts exist)

2. **Job Post Management Page:**
   - List all job posts with place tag, status
   - Create/Edit/Delete job posts
   - Complex form with:
     - Title
     - Place Tag selection
     - Tasks (object with title and descriptions array)
     - Required Qualifications (object with title and descriptions array)
     - Job Details (working hours, contract, salary, close date)

3. **Job Application Dashboard:**
   - List all applications with filters (status, job post, email)
   - View application details
   - Update status (pending/approved/rejected)
   - Send custom email to applicant (button with modal)
   - Delete application

4. **Interview Management:**
   - List all interviews with filters
   - Create interview (only for approved applications)
   - Form fields: meeting URL, meeting date, meeting time (UTC), notes
   - Update/Delete interviews

---

## 6. Validation Requirements

### Product Form Validation
- **Name:** Required, 2-200 characters
- **Category:** Required, must be active category UUID
- **Price:** Required, positive number
- **Stock Quantity:** Required, non-negative integer
- **Images:** Required (at least 1), valid image types, max 5MB each
- **Options:** Optional, array of valid option UUIDs (no duplicates)

### Category Form Validation
- **Name:** Required, 2-100 characters, unique
- **Status:** Optional, `active` or `inactive`

### Option Form Validation
- **Name:** Required, 2-100 characters, unique, lowercase, no spaces
- **Display Name:** Required, 2-100 characters
- **Option Lists:** Required, array with at least 1 item, each item 1-50 characters

---

## 7. Error Handling Best Practices

1. **Display user-friendly error messages:**
   - Parse error response: `error.response.data.message` or `error.message`
   - Show validation errors next to relevant form fields
   - Display general errors in toast/notification

2. **Handle rate limiting:**
   - Contact form and job application have rate limits
   - Show appropriate message: "Too many requests. Please try again after X minutes."

3. **Image upload errors:**
   - File size exceeded: "Image size must be less than 5MB"
   - Invalid file type: "Only JPEG, PNG, and WebP images are allowed"
   - Upload failure: "Failed to upload images. Please try again."

4. **Category/Option deletion errors:**
   - Show specific error: "Cannot delete category. There are X products in stock."

---

## 8. State Management Recommendations

1. **Categories:**
   - Fetch active categories on app load or when needed
   - Cache in state/context to avoid repeated API calls
   - Refresh when category is created/updated/deleted

2. **Options:**
   - Fetch all options when needed (product form, option management page)
   - Cache in state/context

3. **Products:**
   - Implement pagination state
   - Cache product list with filters
   - Refresh after create/update/delete operations

---

## 9. Testing Checklist

- [ ] Category CRUD operations work correctly
- [ ] Option CRUD operations work correctly
- [ ] Product creation with categoryId and optionIds
- [ ] Product image upload (single and multiple)
- [ ] Product image update (add, replace, delete)
- [ ] Category cannot be deactivated if products have stock
- [ ] Option deletion removes from products
- [ ] Form validations work correctly
- [ ] Error messages display properly
- [ ] Rate limiting shows appropriate messages
- [ ] Job management features work (if implementing)

---

## 10. Postman Collection Reference

The provided Postman collection (`Bambite_Ecommerce_API.postman_collection.json`) contains:
- All API endpoints with example requests
- Pre-configured authentication
- Request/response examples
- Collection variables for easy testing

**Key Variables:**
- `baseUrl`: API base URL
- `adminToken`: Admin authentication token
- `categoryId`: For testing category operations
- `optionId`: For testing option operations
- `productId`: For testing product operations

---

## 11. Additional Notes

1. **Authentication:**
   - All admin routes require Bearer token in Authorization header
   - Token format: `Bearer {token}`
   - Handle token expiration and refresh

2. **API Version:**
   - All endpoints are prefixed with `/api/v1`
   - Base URL: `{API_BASE_URL}/api/v1`

3. **Response Format:**
   - Success: `{ status: "success", data: {...}, message?: "..." }`
   - Error: `{ status: "error", message: "..." }`

4. **Pagination:**
   - Products endpoint returns paginated results
   - Use `meta` object for pagination controls
   - `meta.total` = total items
   - `meta.page` = current page
   - `meta.limit` = items per page

---

## Questions or Issues?

If you encounter any issues or need clarification:
1. Refer to the Postman collection for working examples
2. Check backend API documentation
3. Review error responses for specific validation messages
4. Test endpoints individually before integrating into UI

---

**Good luck with the implementation!** 🚀

