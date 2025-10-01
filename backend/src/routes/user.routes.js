import { Router } from 'express';
import {
  getAllUsers,
  getProfile,
  getUserById,
  updateUser,
  getAllRoles,
  deleteUser,
  createUser,
} from '../controllers/user.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();
// Apply authentication middleware to all user routes
router.use(authenticate);

// GET /api/users/profile
router.get('/profile', checkPermission(PermissionName.READ_PROFILE), getProfile);

// --- Admin Only Routes ---

// Routes for /api/users
router.route('/')
  .get(checkPermission(PermissionName.READ_USERS), getAllUsers)
  .post(checkPermission(PermissionName.CREATE_USER), createUser);

// GET /api/users/roles (Admin only)
router.get('/roles', checkPermission(PermissionName.READ_USERS), getAllRoles);

// Routes for /api/users/:id
router.route('/:id')
  .get(checkPermission(PermissionName.READ_USERS), getUserById)
  .put(checkPermission(PermissionName.UPDATE_USER), updateUser)
  .delete(checkPermission(PermissionName.DELETE_USER), deleteUser);

export default router;