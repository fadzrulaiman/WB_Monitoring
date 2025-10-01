import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using a JWT access token.
 * It verifies the token from the Authorization header.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // Differentiate between an expired token and an invalid one for better client-side handling
      const message = err.name === 'TokenExpiredError' ? 'Forbidden: Token has expired' : 'Forbidden: Invalid token';
      return res.status(403).json({ message });
    }
    req.user = user; // Attach the decoded user payload (e.g., { userId, role }) to the request
    next();
  });
};