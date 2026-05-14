import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import workspaceRoutes from './routes/workspace.routes';

dotenv.config();

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
app.use('/api/workspaces', workspaceRoutes);

app.listen(PORT, () => {
  console.log(`
  ✨ Kairo Orchestrator is live
  🚀 API: http://localhost:${PORT}
  🛠️  Docker: /var/run/docker.sock
  `);
});
