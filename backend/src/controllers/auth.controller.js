import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { RoleName } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import sendEmail from '../utils/email.js';
import { forgotPasswordTemplate } from '../emails/forgotPasswordTemplate.js';
import { z } from 'zod';

// --- Helpers ---
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const refreshTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
const maxRefreshTokenAttempts = 5;

// Centralized cookie options for consistency
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};
async function issueRefreshToken(user, { revokeTokenHash } = {}) {
  for (let attempt = 0; attempt < maxRefreshTokenAttempts; attempt++) {
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    try {
      if (revokeTokenHash) {
        await prisma.$transaction([
          prisma.refreshToken.update({ where: { tokenHash: revokeTokenHash }, data: { isRevoked: true } }),
          prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } }),
        ]);
      } else {
        await prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
      }

      return { refreshToken, tokenHash, expiresAt };
    } catch (error) {
      if (error?.code === 'P2002') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to issue refresh token after multiple attempts');
}

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

/**
 * Registers a new user.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // 1. Validate input
    registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    // Hash the password with a salt round of 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find the default 'USER' role, which was created by your seed script
    const userRole = await prisma.role.findUnique({
      where: { name: RoleName.USER },
    });

    if (!userRole) {
      // This is a server configuration error if the role isn't seeded
      return res.status(500).json({ message: 'Default user role not found' });
    }

    // Create the new user in the database
    await prisma.user.create({
      data: { name, email, password: hashedPassword, roleId: userRole.id },
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors
      return res.status(400).json({ message: 'Validation failed', errors: error.flatten().fieldErrors });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Generates a new access token using a refresh token.
 * Implements token rotation for enhanced security.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No refresh token provided' });
  }

  try {
    // Verify the refresh token signature
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Check that the presented refresh token exists and is not revoked/expired
    const presentedHash = hashToken(token);
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: presentedHash } });
    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt <= new Date()) {
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
      return res.status(403).json({ message: 'Forbidden: Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      // If user is not found, the token is for a deleted user. Invalidate it.
      await prisma.refreshToken.update({ where: { tokenHash: presentedHash }, data: { isRevoked: true } }).catch(() => {});
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
      return res.status(403).json({ message: 'Forbidden: User not found' });
    }

    // --- Token Rotation ---
    const newAccessToken = generateAccessToken(user);
    const { refreshToken: newRefreshToken } = await issueRefreshToken(user, { revokeTokenHash: presentedHash });
    const permissions = user.role.rolePermissions.map(rp => rp.permission.name);

    res.cookie('refreshToken', newRefreshToken, {
      ...refreshTokenCookieOptions,
      maxAge: refreshTtlMs,
    });

    // Also return the user object so frontend can repopulate its state
    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: permissions,
      },
    });
  } catch (error) {
    // If verification fails (e.g., expired or malformed token), clear the cookie
    console.error('Refresh token error:', error);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);
    return res.status(403).json({ message: 'Forbidden: Invalid or expired refresh token' });
  }
};

/**
 * Logs out the user by clearing the refresh token cookie.
 */
export const logout = (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const presentedHash = hashToken(token);
    // Best-effort revoke of the presented refresh token
    prisma.refreshToken.update({ where: { tokenHash: presentedHash }, data: { isRevoked: true } }).catch(() => {});
  }
  res.clearCookie('refreshToken', refreshTokenCookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Logs in a user.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      // Use a generic error message to prevent user enumeration attacks
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const permissions = user.role.rolePermissions.map(rp => rp.permission.name);

    const { refreshToken } = await issueRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      ...refreshTokenCookieOptions,
      maxAge: refreshTtlMs,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Initiates the password reset process for a user.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // To prevent user enumeration, we send a success response even if the user doesn't exist.
      console.log(`Password reset requested for non-existent user: ${email}`);
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // Generate the random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetTokenExpiresInMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES || '10', 10);
    const passwordResetExpires = new Date(Date.now() + resetTokenExpiresInMinutes * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    // Send it to user's email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Forgot your password? Click the link to reset your password: ${resetURL}\n\nThis link is valid for ${resetTokenExpiresInMinutes} minutes. If you didn't forget your password, please ignore this email!`;
    const htmlMessage = forgotPasswordTemplate({ userName: user.name, resetURL, resetTokenExpiresInMinutes });

    await sendEmail({
      email: user.email,
      subject: `Your password reset token (valid for ${resetTokenExpiresInMinutes} min)`,
      message,
      html: htmlMessage,
    });

    res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (error) {
    // In case of an error, we don't want to leak information.
    // We'll clear the reset fields for the user if they were set.
    const userToClear = await prisma.user.findUnique({ where: { email } });
    if (userToClear) {
      await prisma.user.update({
        where: { email },
        data: { passwordResetToken: null, passwordResetExpires: null },
      }).catch(err => console.error('Failed to clear reset token on error:', err));
    }
    console.error('FORGOT PASSWORD ERROR:', error);
    // Still send a generic success message to the client.
    res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
  }
};

/**
 * Resets a user's password using a valid token.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Define and use a Zod schema for password validation
  const resetPasswordSchema = z.object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  });

  // Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // 1. Validate input
    resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: hashedToken, passwordResetExpires: { gte: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null },
    });

    res.status(200).json({ message: 'Password has been reset successfully. Please log in.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.flatten().fieldErrors });
    } else {
      console.error('RESET PASSWORD ERROR:', error);
      res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
  }
};
















