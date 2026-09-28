import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { sanitize } from './common/sanitize.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './common/errors.js';

// Import module routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import zonesRoutes from './modules/zones/zones.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import assetsRoutes from './modules/assets/assets.routes.js';
import inspectionsRoutes from './modules/inspections/inspections.routes.js';
import workordersRoutes from './modules/workorders/workorders.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import departmentsRoutes from './modules/departments/departments.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';

const app = express();

// 1. Request ID
app.use(requestId);

// 2. Helmet security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 3. CORS with credentials
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/i.test(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

// 4. Morgan HTTP Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req-id: :res[x-request-id]]'));
}

// 5. Global Rate Limiter
app.use(globalRateLimiter);

// 6. Express JSON body parser & cookie parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 7. Sanitize body, query, and params against NoSQL injection
app.use(sanitize);

// Health check endpoints
app.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/readyz', (req, res) => res.json({ status: 'ready' }));

// 8. API v1 Router assembly
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/users', usersRoutes);
apiV1.use('/zones', zonesRoutes);
apiV1.use('/departments', departmentsRoutes);
apiV1.use('/categories', categoriesRoutes);
apiV1.use('/assets', assetsRoutes);
apiV1.use('/', inspectionsRoutes);
apiV1.use('/work-orders', workordersRoutes);
apiV1.use('/', reportsRoutes);
apiV1.use('/media', mediaRoutes);
apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/audit', auditRoutes);
apiV1.use('/ai', aiRoutes);

app.use('/api/v1', apiV1);

// Static uploads serving
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR || 'uploads')));

// 9. 404 Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// 10. Central Error Handler
app.use(errorHandler);

export default app;
