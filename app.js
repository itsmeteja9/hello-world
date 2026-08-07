const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.get('/health-check', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'cicd-enterprise-blueprint',
    });
  });

  app.get('/test', (_req, res) => {
    res.json({ message: 'test works' });
  });

  app.use(
    express.static(path.join(__dirname, 'public'), {
      etag: true,
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    }),
  );

  // Catch-all for debugging
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}

module.exports = { createApp };
