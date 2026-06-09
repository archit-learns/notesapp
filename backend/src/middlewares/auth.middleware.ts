import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-key-that-nobody-can-guess';

// Extend Express Request type definition so it can hold our decoded userId safely
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // 1. Get token from the standard Authorization header: "Bearer <TOKEN>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  try {
    // 2. Cryptographically verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // 3. Inject the safe, verified userId directly into the request object
    req.userId = decoded.userId;
    
    // 4. Pass control forward to the actual Controller method
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or Expired Token' });
  }
};