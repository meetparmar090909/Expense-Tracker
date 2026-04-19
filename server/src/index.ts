import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import tripRoutes from './routes/trips';

dotenv.config();
connectDB();

const app = express();

app.use(cors({ 
  origin: true, // Allow all origins for debugging
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/trips', tripRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', message: '💰 Expense Tracker API Running!' }));

// 404 handler
app.use('*', (_, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

export default app;
