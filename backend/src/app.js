import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import itemRoutes from './routes/item.routes.js';
import ffbRoutes from './routes/ffb.routes.js';
import splitRoutes from './routes/split.routes.js';
import cpUpdateRoutes from './routes/cpupdate.routes.js';
import bargeRoutes from './routes/barge.routes.js';
import sqlExecuteRoutes from './routes/sqlexecute.routes.js';
import errorHandler from './middleware/error.middleware.js';

// Load environment variables so app setup can use them
dotenv.config();

const app = express();
const enableSqlExecutor = process.env.ENABLE_SQL_EXECUTOR === 'true';

// Support comma-separated list of allowed frontend origins
const rawOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(origin => origin.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const message = `Origin ${origin ?? '(unknown)'} not allowed by CORS`;
    return callback(new Error(message));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Core middlewares
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/ffb-reupload', ffbRoutes);
app.use('/api/split-so', splitRoutes);
app.use('/api/cp-update', cpUpdateRoutes);
app.use('/api/barge-update', bargeRoutes);

if (enableSqlExecutor) {
  app.use('/api/sqlexecute', sqlExecuteRoutes);
} else {
  app.use('/api/sqlexecute', (req, res) => {
    res.status(403).json({ error: 'SQL executor is disabled.' });
  });
}

// Global error handler (last)
app.use(errorHandler);

export default app;
