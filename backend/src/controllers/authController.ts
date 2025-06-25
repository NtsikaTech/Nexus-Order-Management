import { Request, Response } from 'express';
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { recordAuditLog } from '../services/auditLogService';
import Joi from 'joi';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = '7d';

const RESET_TOKEN_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET + '_reset' : 'changeme_reset';
const RESET_TOKEN_EXPIRES_IN = '1h';

const TWOFA_ENCRYPTION_KEY = process.env.TWOFA_ENCRYPTION_KEY || '';

function encrypt(text: string): string {
  if (!TWOFA_ENCRYPTION_KEY || TWOFA_ENCRYPTION_KEY.length < 32) throw new Error('Invalid 2FA encryption key');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(TWOFA_ENCRYPTION_KEY, 'utf8'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data: string): string {
  if (!TWOFA_ENCRYPTION_KEY || TWOFA_ENCRYPTION_KEY.length < 32) throw new Error('Invalid 2FA encryption key');
  const b = Buffer.from(data, 'base64');
  const iv = b.slice(0, 12);
  const tag = b.slice(12, 28);
  const encrypted = b.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(TWOFA_ENCRYPTION_KEY, 'utf8'), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  role: Joi.string().valid('ADMIN', 'CLIENT').required(),
  contactInfo: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  idNumber: Joi.string().allow('', null),
});

export const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  contactInfo: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  idNumber: Joi.string().allow('', null),
});

export const updateUserRoleSchema = Joi.object({
  userId: Joi.string().required(),
  newRole: Joi.string().valid('ADMIN', 'CLIENT').required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, name, role, contactInfo, address, idNumber } = req.body;
    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role,
        contactInfo,
        address,
        idNumber,
      },
    });
    // Optionally create a Client profile if role is CLIENT
    if (role === 'CLIENT') {
      await prisma.client.create({
        data: {
          userId: user.id,
        },
      });
    }
    await recordAuditLog(user.id, 'REGISTER', 'User', user.id, { username, email, role });
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });
    if (!user) {
      await recordAuditLog(null, 'LOGIN_FAIL', 'User', usernameOrEmail, { reason: 'User not found' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // TODO: Add 2FA check here if enabled
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password: _, ...userProfile } = user;
    await recordAuditLog(user.id, 'LOGIN', 'User', user.id, { usernameOrEmail });
    return res.json({ token, user: userProfile });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is handled client-side or with a denylist (not implemented here)
  return res.json({ message: 'Logged out' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.user is set by auth middleware
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...userProfile } = user;
    return res.json(userProfile);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user', error: err });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await recordAuditLog(null, 'FORGOT_PASSWORD', 'User', email, { result: 'No user found' });
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }
    const resetToken = jwt.sign({ userId: user.id }, RESET_TOKEN_SECRET, { expiresIn: RESET_TOKEN_EXPIRES_IN });
    // Send email (mock for now)
    // In production, use a real email service
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    // Mock email sending
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    await recordAuditLog(user.id, 'FORGOT_PASSWORD', 'User', user.id, { email });
    // Uncomment and configure below for real email sending
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetUrl}`,
    });
    */
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send reset email', error: err });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
    let payload: any;
    try {
      payload = jwt.verify(token, RESET_TOKEN_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    await recordAuditLog(user.id, 'RESET_PASSWORD', 'User', user.id, {});
    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err });
  }
};

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'NexusOrderManagement', secret);
    const qr = await qrcode.toDataURL(otpauth);
    // Encrypt secret before storing
    const encryptedSecret = encrypt(secret);
    await prisma.user.update({ where: { id: userId }, data: { twoFASecret: encryptedSecret } });
    await recordAuditLog(userId, 'SETUP_2FA', 'User', userId, {});
    return res.json({ secret, otpauth, qr });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to setup 2FA', error: err });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { token } = req.body;
    if (!userId || !token) return res.status(400).json({ message: 'Missing token or unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFASecret) return res.status(400).json({ message: '2FA not set up' });
    // Decrypt secret before checking
    let secret;
    try {
      secret = decrypt(user.twoFASecret);
    } catch (e) {
      return res.status(500).json({ message: 'Failed to decrypt 2FA secret' });
    }
    const isValid = authenticator.check(token, secret);
    if (!isValid) return res.status(400).json({ message: 'Invalid 2FA token' });
    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 5 }, () => Math.random().toString(36).slice(-10));
    await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: true, recoveryCodes } });
    await recordAuditLog(userId, 'VERIFY_2FA', 'User', userId, {});
    return res.json({ message: '2FA enabled', recoveryCodes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify 2FA', error: err });
  }
};

export const loginWith2FA = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password, token, recoveryCode } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });
    if (!user) {
      await recordAuditLog(null, 'LOGIN2FA_FAIL', 'User', usernameOrEmail, { reason: 'User not found' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordAuditLog(user.id, 'LOGIN2FA_FAIL', 'User', user.id, { reason: 'Invalid password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.twoFAEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }
    let twoFAOk = false;
    if (token && user.twoFASecret) {
      let secret;
      try {
        secret = decrypt(user.twoFASecret);
      } catch (e) {
        return res.status(500).json({ message: 'Failed to decrypt 2FA secret' });
      }
      twoFAOk = authenticator.check(token, secret);
    } else if (recoveryCode && user.recoveryCodes.includes(recoveryCode)) {
      // Remove used recovery code
      await prisma.user.update({
        where: { id: user.id },
        data: { recoveryCodes: user.recoveryCodes.filter((c) => c !== recoveryCode) },
      });
      twoFAOk = true;
    }
    if (!twoFAOk) {
      await recordAuditLog(user.id, 'LOGIN2FA_FAIL', 'User', user.id, { reason: 'Invalid 2FA token or recovery code' });
      return res.status(401).json({ message: 'Invalid 2FA token or recovery code' });
    }
    const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password: _, ...userProfile } = user;
    await recordAuditLog(user.id, 'LOGIN2FA', 'User', user.id, { usernameOrEmail });
    return res.json({ token: jwtToken, user: userProfile });
  } catch (err) {
    return res.status(500).json({ message: '2FA login failed', error: err });
  }
};

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { password } = req.body;
    if (!userId || !password) return res.status(400).json({ message: 'Missing password or unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid password' });
    await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: false, twoFASecret: null, recoveryCodes: [] } });
    await recordAuditLog(userId, 'DISABLE_2FA', 'User', userId, {});
    return res.json({ message: '2FA disabled' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to disable 2FA', error: err });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, email, contactInfo, address, idNumber } = req.body;
    if (!user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const existing = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!existing) return res.status(404).json({ message: 'User not found' });
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: { name, email, contactInfo, address, idNumber, updatedAt: new Date() },
    });
    // If client, update client info in related orders (for consistency)
    if (updated.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (client) {
        await prisma.order.updateMany({
          where: { clientId: client.id },
          data: { details: { ...updated } }, // Optionally update order details with new client info
        });
      }
    }
    await recordAuditLog(user.userId, 'UPDATE_PROFILE', 'User', user.userId, { name, email, contactInfo, address, idNumber });
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (admin.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { userId, newRole } = req.body;
    if (!userId || !newRole) return res.status(400).json({ message: 'userId and newRole are required' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const oldRole = user.role;
    if (oldRole === newRole) return res.status(400).json({ message: 'Role is already set to this value' });
    const updated = await prisma.user.update({ where: { id: userId }, data: { role: newRole, updatedAt: new Date() } });
    await recordAuditLog(admin.userId, 'USER_ROLE_CHANGE', 'User', userId, { oldRole, newRole });
    return res.json({ message: 'User role updated', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update user role', error: err });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (admin.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const deleted = await prisma.user.delete({ where: { id: userId } });
    await recordAuditLog(admin.userId, 'DELETE', 'User', userId, { deletedUser: { ...deleted, password: undefined } });
    const { password, ...userInfo } = deleted;
    return res.json({ message: 'User deleted', user: userInfo });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (admin.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const users = await prisma.user.findMany();
    const usersWithoutPasswords = users.map(({ password, ...u }) => u);
    return res.json({ users: usersWithoutPasswords });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err });
  }
}; 