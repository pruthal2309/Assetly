import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connect.js';
import { ensureIndexes } from './db/indexes.js';
import { initJobs } from './jobs/index.js';
import fs from 'node:fs';
import path from 'node:path';

const startServer = async () => {
  try {
    // Ensure upload directory exists
    const uploadPath = path.resolve(env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    await connectDB();
    await ensureIndexes();
    initJobs();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Assetly Backend API server listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = async () => {
      console.log(' Shutting down server gracefully...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Server boot failure:', error.message);
    process.exit(1);
  }
};

startServer();
