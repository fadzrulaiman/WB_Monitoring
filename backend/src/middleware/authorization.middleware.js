import prisma from '../utils/prisma.js';

/**
 * Creates a middleware function that checks if the authenticated user's role has the required permission.
 * This must be used AFTER the authenticateToken middleware.
 *
 * @param {import('@prisma/client').PermissionName} requiredPermission - The name of the permission required to access the route.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    // req.user is attached by the `authenticateToken` middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: User role not available.' });
    }

    const userRole = req.user.role;

    try {
      const permissionRecord = await prisma.rolePermission.findFirst({
        where: {
          role: { name: userRole },
          permission: { name: requiredPermission },
        },
      });

      if (!permissionRecord) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
      }

      next(); // User has the required permission
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error during permission check.' });
    }
  };
};