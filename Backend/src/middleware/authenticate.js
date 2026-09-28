import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { UnauthorizedError } from '../common/errors.js';

const userCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

export const clearUserCache = (userId) => {
  if (userId) userCache.delete(userId.toString());
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    const userId = decoded.sub;
    const now = Date.now();
    let cached = userCache.get(userId);

    if (!cached || now - cached.timestamp > CACHE_TTL_MS) {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new UnauthorizedError('User account not found');
      }
      cached = { user, timestamp: now };
      userCache.set(userId, cached);
    }

    const user = cached.user;

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is deactivated');
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedError('Session has expired due to security updates');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
