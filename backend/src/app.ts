import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import requestRoutes from './routes/requestRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import billingSettingsRoutes from './routes/billingSettingsRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import { errorHandler } from './middlewares/errorHandler';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { authenticate, requireAdmin } from './middlewares/authMiddleware';
import { validateEnv } from './config/validateEnv';

dotenv.config();

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(helmet());

validateEnv();

// TODO: Add routes here
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing-settings', billingSettingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/docs', authenticate, requireAdmin, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

export default app; 