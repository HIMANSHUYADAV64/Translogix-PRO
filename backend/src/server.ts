import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vehiclesRouter from './routes/vehicles';
import driversRouter from './routes/drivers';
import maintenanceRouter from './routes/maintenance';
import tyresRouter from './routes/tyres';
import tripsRouter from './routes/trips';
import paymentsRouter from './routes/payments';
import subscriptionsRouter from './routes/subscriptions';
import authRouter from './routes/auth';
import { startCronJobs, runSubscriptionReminders, runMaintenanceReminders, runInsuranceReminders } from './jobs/reminders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost',
        'https://localhost',
        'capacitor://localhost'
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/tyres', tyresRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/auth', authRouter);

// Vercel Serverless Cron Endpoint
app.get('/api/cron/reminders', async (req, res) => {
    // Vercel passes a CRON secret in the authorization header
    if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({ error: 'Unauthorized invocation' });
        return;
    }
    
    await Promise.all([
        runSubscriptionReminders(),
        runMaintenanceReminders(),
        runInsuranceReminders()
    ]);
    
    res.json({ success: true, message: 'Cron jobs executed successfully' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Only start server manually if not in Vercel Serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

        // Start local cron jobs
        startCronJobs();
    });
}

export default app;
