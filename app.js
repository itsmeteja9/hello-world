const express = require('express');

const app = express();
const port = Number(process.env.PORT) || 8080;

app.get('/', (_req, res) => {
  res.send('Hello from the GAR + Cloud Run CI/CD demo');
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Application running on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
