import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'kairo-secret-key';
// Mock user for MVP
const MOCK_USER = {
  id: '1',
  email: 'admin@kairo.dev',
  password: bcrypt.hashSync('admin123', 10),
};

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (email !== MOCK_USER.email) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, MOCK_USER.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: MOCK_USER.id, email: MOCK_USER.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({ token, user: { id: MOCK_USER.id, email: MOCK_USER.email } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async me(req: Request, res: Response) {
    // req.user will be populated by middleware
    res.json({ user: (req as any).user });
  }
}
