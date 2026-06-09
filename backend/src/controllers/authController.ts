import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  private authService = new AuthService();

  signup = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const result = await this.authService.signup(email, password);
      return res.status(201).json({ message: 'User created!', ...result });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS' || err.message === 'MISSING_FIELDS') {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Signup failed' });
    }
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const result = await this.authService.login(email, password);
      return res.json({ message: 'Login successful', ...result });
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') return res.status(400).json({ error: err.message });
      return res.status(500).json({ error: 'Login failed' });
    }
  };
}