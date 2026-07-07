import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Errors } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  user: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw Errors.unauthorized('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw Errors.unauthorized('Invalid authorization header format');
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw Errors.unauthorized('Token has expired');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw Errors.unauthorized('Invalid token');
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
    } catch {
      // Token invalid or expired, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: 900 } // 15 minutes in seconds
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, email: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
  return jwt.sign(
    { userId, email },
    refreshSecret,
    { expiresIn: 604800 } // 7 days in seconds
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
  return jwt.verify(token, refreshSecret) as JwtPayload;
};
