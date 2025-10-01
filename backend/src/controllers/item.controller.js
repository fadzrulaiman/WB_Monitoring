import prisma from '../utils/prisma.js';
import { z } from 'zod';

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(255, { message: 'Name must be less than 255 characters' }),
  description: z.string().min(1, { message: 'Description is required' }).max(1000, { message: 'Description must be less than 1000 characters' }),
  quantity: z.number().int().min(0, { message: 'Quantity must be a non-negative integer' }),
});

const updateItemSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(255, { message: 'Name must be less than 255 characters' }).optional(),
  description: z.string().min(1, { message: 'Description is required' }).max(1000, { message: 'Description must be less than 1000 characters' }).optional(),
  quantity: z.number().int().min(0, { message: 'Quantity must be a non-negative integer' }).optional(),
});

/**
 * Gets all items with pagination and search functionality.
 * Accessible by Admin and User roles.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getAllItems = async (req, res) => {
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
            { description: { contains: search } },
          ],
        }
      : {};

    const [items, totalItems] = await prisma.$transaction([
      prisma.item.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      items,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    });
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Gets a single item by ID.
 * Accessible by Admin and User roles.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Creates a new item.
 * Admin only.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const createItem = async (req, res) => {
  try {
    const validatedData = createItemSchema.parse(req.body);

    const newItem = await prisma.item.create({
      data: validatedData,
    });

    res.status(201).json({ 
      message: 'Item created successfully', 
      item: newItem 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.flatten().fieldErrors 
      });
    }
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Updates an existing item.
 * Admin only.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const updateItem = async (req, res) => {
  const { id } = req.params;

  try {
    const validatedData = updateItemSchema.parse(req.body);

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: validatedData,
    });

    res.json({ 
      message: 'Item updated successfully', 
      item: updatedItem 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.flatten().fieldErrors 
      });
    }
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Deletes an item.
 * Admin only.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await prisma.item.delete({
      where: { id },
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 
