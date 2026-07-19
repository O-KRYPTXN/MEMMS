import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { notFound } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import departmentsRoutes from './modules/departments/departments.routes.js';
import registrationRoutes from './modules/registrationRequests/registration.routes.js';
import faultReportsRoutes from './modules/faultReports/faultReports.routes.js';
import workOrdersRoutes from './modules/workOrders/workOrders.routes.js';
import devicesRoutes from './modules/devices/devices.routes.js';
import pmTasksRoutes from './modules/pmTasks/pmTasks.routes.js';

import reportsRoutes from './modules/reports/reports.routes.js';
import auditLogsRoutes from './modules/auditLogs/auditLogs.routes.js';
import alertsRoutes from './modules/alerts/alerts.routes.js';


// Load validated environment variables
import { env } from './config/env.js';
import { initSocket } from './socket/socket.server.js';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
})); // Allow your frontend to talk to this API and send cookies
app.use(express.json()); // Parse incoming JSON payloads
app.use(morgan('dev')); // Log API requests to the console
app.use(cookieParser()); // Parse cookies

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'MEMMS API is running!' });
});

// We will add our entity routes here later
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/fault-reports', faultReportsRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/pm-tasks', pmTasksRoutes);

app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/alerts', alertsRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});