import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);

export default router;
