import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import blockAPI from './api/blockAPI';
import authRoutes from './routes/auth';
import coverLetterRoutes from './routes/coverLetter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 큰 요청 허용

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use(blockAPI);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});