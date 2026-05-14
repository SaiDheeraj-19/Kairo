import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import workspaceRoutes from './routes/workspace.routes';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';

dotenv.config();

// Ensure storage directory exists
const storageRoot = process.env.STORAGE_ROOT || '/tmp/kairo/workspaces';
if (!fs.existsSync(storageRoot)) {
  fs.mkdirSync(storageRoot, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    platform: 'Kairo', 
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', authMiddleware, workspaceRoutes);

app.listen(PORT, () => {
  console.log(`
  ✨ Kairo Orchestrator is live
  🚀 API: http://localhost:${PORT}
  🛠️  Docker: /var/run/docker.sock
  `);
});
