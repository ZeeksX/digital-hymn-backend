import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limiter';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.schema';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/google', authLimiter, validate({ body: googleAuthSchema }), AuthController.googleAuth);
router.post('/refresh', authLimiter, AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.get('/csrf-token', AuthController.getCsrfToken);

export default router;
