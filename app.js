const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 8080;

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

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Application running on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
