import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/preview-proxy.js';

const backend = 'https://tradevault-api-git-develop-banseedhar01s-projects.vercel.app';

function setup(t, env = 'preview') {
  const saved = { ...process.env };
  process.env.VERCEL_ENV = env;
  process.env.PREVIEW_BACKEND_URL = backend;
  process.env.PREVIEW_BACKEND_BYPASS_SECRET = 'test-server-only-secret';
  t.after(() => { process.env = saved; });
  return {
    headers: {},
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

test('production cannot access the preview proxy', async t => {
  const response = setup(t, 'production');
  const fetch = t.mock.method(globalThis, 'fetch');
  await handler({ method: 'GET', url: '/api/accounts', headers: {} }, response);
  assert.equal(response.statusCode, 404);
  assert.equal(fetch.mock.callCount(), 0);
});

test('missing credentials fail closed', async t => {
  const response = setup(t);
  delete process.env.PREVIEW_BACKEND_BYPASS_SECRET;
  const fetch = t.mock.method(globalThis, 'fetch');
  await handler({ method: 'GET', url: '/api/accounts', headers: {} }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(fetch.mock.callCount(), 0);
});

test('JSON writes and queries reach only the configured backend', async t => {
  const response = setup(t);
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.href, `${backend}/api/trades?account_id=example`);
    assert.equal(options.method, 'POST');
    assert.equal(options.body, JSON.stringify({ instrument: 'EURUSD' }));
    assert.equal(options.headers['x-vercel-protection-bypass'], 'test-server-only-secret');
    assert.equal(options.headers.Cookie, undefined);
    return new Response(JSON.stringify({ success: true }), {
      status: 201, headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'private=cookie' },
    });
  });
  await handler({
    method: 'POST', url: '/api/trades?account_id=example',
    headers: { 'content-type': 'application/json', cookie: 'browser=cookie' },
    body: { instrument: 'EURUSD' },
  }, response);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(response.statusCode, 201);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['set-cookie'], undefined);
  assert.ok(!JSON.stringify(response).includes('test-server-only-secret'));
});

test('arbitrary and normalized traversal paths cannot reach the backend', async t => {
  const response = setup(t);
  const fetch = t.mock.method(globalThis, 'fetch');
  for (const url of ['/admin', '/api/accounts/../../admin', '/api/unknown']) {
    await handler({ method: 'GET', url, headers: {} }, response);
    assert.equal(response.statusCode, 404);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('health check uses the same protected development backend', async t => {
  const response = setup(t);
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url.href, `${backend}/health`);
    return Response.json({ success: true, data: { status: 'healthy' } });
  });
  await handler({ method: 'GET', url: '/api/health', headers: {} }, response);
  assert.equal(response.statusCode, 200);
});

test('nested rewritten paths preserve updates and query filters', async t => {
  const response = setup(t);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.href, `${backend}/api/accounts/example/stages/0?filter=active`);
    assert.equal(options.method, 'PUT');
    assert.equal(options.body, JSON.stringify({ status: 'passed' }));
    return Response.json({ success: true });
  });
  await handler({
    method: 'PUT',
    url: '/api/preview-proxy?__preview_path=accounts/example/stages/0&filter=active',
    query: { __preview_path: 'accounts/example/stages/0' },
    headers: { 'content-type': 'application/json' },
    body: { status: 'passed' },
  }, response);
  assert.equal(response.statusCode, 200);
});

test('backend authentication redirects and network failures stay JSON errors', async t => {
  const response = setup(t);
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    new Response(null, { status: 302, headers: { Location: 'https://vercel.com/login' } }));
  await handler({ method: 'GET', url: '/api/accounts', headers: {} }, response);
  assert.equal(response.statusCode, 502);
  assert.equal(response.headers.location, undefined);
  fetch.mock.mockImplementation(async () => { throw Error('test-server-only-secret'); });
  await handler({ method: 'GET', url: '/api/accounts', headers: {} }, response);
  assert.equal(response.statusCode, 502);
  assert.ok(!JSON.stringify(response).includes('test-server-only-secret'));
});
