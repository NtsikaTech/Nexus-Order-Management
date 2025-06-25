import { Router } from 'express';
import { register, login, logout, getCurrentUser, forgotPassword, resetPassword, setup2FA, verify2FA, loginWith2FA, disable2FA, updateProfile, updateUserRole, deleteUser, getAllUsers } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validationMiddleware';
import { registerSchema, loginSchema, updateProfileSchema, updateUserRoleSchema, forgotPasswordSchema, resetPasswordSchema } from '../controllers/authController';
import { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middlewares/rateLimiters';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/login-2fa', loginWith2FA);
router.put('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.put('/role', authenticate, requireAdmin, validateBody(updateUserRoleSchema), updateUserRole);
router.delete('/user', authenticate, requireAdmin, deleteUser);
router.get('/users', authenticate, requireAdmin, getAllUsers);

export default router; 