import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import financeRoutes from './routes/finance.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import membersRoutes from './routes/members.routes.js';

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://volnecashflow.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/members', membersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

export default app;
