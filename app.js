const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    express.static(path.join(__dirname, 'public'), {
      etag: true,
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    }),
  );

  app.get('/healthz', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'cicd-enterprise-blueprint',
    });
  });

  return app;
}

module.exports = { createApp };
