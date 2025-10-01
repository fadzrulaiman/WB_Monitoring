import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  const tokenId = randomUUID();
  return jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d', jwtid: tokenId }
  );
};

