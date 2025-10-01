import { z } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Centralized error handler for the Express app.
 * Catches errors from route handlers and formats a consistent JSON response.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err); // Log the full error for debugging

  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: err.flatten().fieldErrors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({ message: 'Resource not found.' });
  }

  res.status(500).json({ message: err.message || 'Internal server error' });
};

export default errorHandler;