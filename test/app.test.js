const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');

const { createApp } = require('../app');

async function startTestServer(t) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test('GET /healthz reports a healthy service', async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/healthz`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'cicd-enterprise-blueprint',
  });
});

test('GET / serves the CI/CD demo page', async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(baseUrl);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.match(body, /CI\/CD Pipeline Journey/);
});
