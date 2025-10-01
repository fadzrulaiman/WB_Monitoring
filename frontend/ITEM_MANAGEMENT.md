# Item Management Module

## Overview

The Item Management module provides a comprehensive interface for managing items in the system. It includes full CRUD (Create, Read, Update, Delete) operations with role-based access control.

## Features

### 🔐 Role-Based Access Control
- **Admin Users**: Full access to all CRUD operations
- **Normal Users**: Read-only access (view items only)

### 📋 Item Management Features
- **List View**: Table display with search and pagination
- **Detail View**: Comprehensive item information display
- **Create Items**: Modal form for adding new items
- **Edit Items**: In-place editing with modal forms
- **Delete Items**: Confirmation-based deletion
- **Search**: Real-time search by name and description
- **Pagination**: Efficient handling of large datasets

## API Integration

The module uses the centralized API service (`useItemsAPI`) that integrates with your existing authentication system:

### Endpoints Used
- `GET /api/items` - List all items with pagination/search
- `GET /api/items/:id` - Get single item details
- `POST /api/items` - Create new item (Admin only)
- `PUT /api/items/:id` - Update existing item (Admin only)
- `DELETE /api/items/:id` - Delete item (Admin only)

## Components

### Pages
- **ItemsPage** (`/items`) - Main listing page with table view
- **ItemDetailPage** (`/items/:id`) - Detailed view of individual items

### Components
- **CreateItemModal** - Reusable modal for create/edit operations
- **ConfirmationModal** - Reused for delete confirmations

### API Service
- **useItemsAPI** - Custom hook for all item-related API calls

## Navigation

The module is integrated into the main sidebar navigation:
- **Items** link appears for users with `READ_ITEMS` permission
- Automatically shows/hides based on user permissions

## Item Fields

Each item contains:
- **Name** (string, required) - Item name
- **Description** (string, required) - Detailed description
- **Quantity** (integer, non-negative) - Current stock quantity
- **Created/Updated** timestamps (auto-generated)

## UI Features

### Visual Indicators
- **Quantity Status**: Color-coded badges (green > 10, yellow 1-10, red 0)
- **Loading States**: Proper loading indicators during API calls
- **Error Handling**: User-friendly error messages
- **Success Notifications**: Confirmation messages for actions

### Responsive Design
- Mobile-friendly table layout
- Responsive grid for detail view
- Adaptive modal sizing

## Security

- **Authentication Required**: All routes protected
- **Permission-Based UI**: Actions only show for authorized users
- **API Validation**: Backend validates all inputs
- **CSRF Protection**: Uses existing authentication tokens

## Usage Examples

### For Admin Users
1. Navigate to "Items" in sidebar
2. Click "Create Item" to add new items
3. Use search to find specific items
4. Click "Edit" or "Delete" for item management
5. View detailed information by clicking item names

### For Normal Users
1. Navigate to "Items" in sidebar
2. Browse items using search and pagination
3. Click item names to view detailed information
4. No create/edit/delete actions available

## Integration Points

The module seamlessly integrates with:
- **Authentication System**: Uses existing auth context
- **Navigation**: Integrated sidebar with permission checks
- **API Layer**: Uses centralized axios instance
- **UI Components**: Reuses existing modal and form patterns
- **Routing**: Protected routes with role-based access 