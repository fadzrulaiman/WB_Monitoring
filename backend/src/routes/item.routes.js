import { Router } from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all item routes
router.use(authenticate);

// GET /api/items - List all items (Admin and User can read)
router.get('/', checkPermission(PermissionName.READ_ITEMS), getAllItems);

// GET /api/items/:id - Get single item (Admin and User can read)
router.get('/:id', checkPermission(PermissionName.READ_ITEMS), getItemById);

// POST /api/items - Create new item (Admin only)
router.post('/', checkPermission(PermissionName.CREATE_ITEM), createItem);

// PUT /api/items/:id - Update item (Admin only)
router.put('/:id', checkPermission(PermissionName.UPDATE_ITEM), updateItem);

// DELETE /api/items/:id - Delete item (Admin only)
router.delete('/:id', checkPermission(PermissionName.DELETE_ITEM), deleteItem);

export default router; 