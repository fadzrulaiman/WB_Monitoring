import prisma from '../utils/prisma.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

/**
 * Gets the profile of the currently authenticated user.
 * The user ID is retrieved from the JWT payload attached by the auth middleware.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Flatten the response for a cleaner API
    res.json({ ...user, role: user.role.name });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Define validation schema for user update
const updateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  roleId: z.string().min(1, { message: 'Role ID cannot be empty' }).optional(), // Use a more general string validation
});

/**
 * Gets a single user by ID. (Admin only)
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Updates a user's details. (Admin only)
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const validatedData = updateUserSchema.parse(req.body);

    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ message: 'Email is already in use by another account.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.flatten().fieldErrors });
    }
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Gets all available roles. (Admin only)
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Gets all users. (Admin only)
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search = '', page = '1', limit = '10' } = req.query;
    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const pageNum = Number.isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
    const limitNumBase = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit;
    const limitNum = Math.min(limitNumBase, 100);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { id: true, name: true } },
        },
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Flatten the role for a cleaner API response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      roleId: user.role.id,
    }));

    res.json({
      users: formattedUsers,
      totalPages: Math.ceil(totalUsers / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Deletes a user. (Admin only)
 * An admin cannot delete their own account via this endpoint.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user.userId;

  if (id === loggedInUserId) {
    return res.status(403).json({ message: 'Action forbidden: You cannot delete your own account.' });
  }

  try {
    // The delete operation will fail if the user doesn't exist,
    // which is handled by the catch block.
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    // Catches errors like "Record to delete not found."
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Could not delete user. The user may have already been deleted.' });
  }
};

// Define validation schema for user creation by an admin
const createUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  roleId: z.string().min(1, { message: 'A role is required' }),
});

/**
 * Creates a new user. (Admin only)
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, roleId },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { id: true, name: true } },
      },
    });

    const formattedUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role.name, roleId: newUser.role.id };

    res.status(201).json({ message: 'User created successfully', user: formattedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.flatten().fieldErrors });
    }
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
