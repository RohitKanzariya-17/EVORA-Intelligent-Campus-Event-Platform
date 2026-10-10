import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 EventEase Server Running on port ${config.PORT}`);
      console.log(`🌐 Environment: ${config.NODE_ENV}`);
      console.log(`📡 URL: http://localhost:${config.PORT}`);
      console.log(`🛡️  Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`=========================================`);
    });

    const shutdown = () => {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Fatal error starting EventEase server:', error);
    process.exit(1);
  }
};

startServer();
