import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../src/api/client.js';

test('successful empty database results remain empty', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: [] }));
  assert.deepEqual(await apiRequest('/accounts'), []);
});

test('legacy HTTP 200 error envelopes reject without exposing database internals', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    success: false, error: { code: 'FETCH_ERROR', message: 'private driver/connection detail' },
  }));
  await assert.rejects(apiRequest('/accounts', {}, 'Could not load accounts.'), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, 'FETCH_ERROR');
    assert.equal(error.message, 'Could not load accounts.');
    return true;
  });
});

test('HTTP failures cannot pass as success even if their JSON claims success', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: [] }, { status: 500 }));
  await assert.rejects(apiRequest('/trades'), error => error.status === 500);
});

test('validation errors identify the field without echoing submitted data', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: [
    { loc: ['body', 'pnl'], msg: 'Input should be a valid number', input: 'private input' },
  ] }, { status: 422 }));
  await assert.rejects(apiRequest('/trades', { method: 'POST' }), error => {
    assert.equal(error.message, 'pnl: Input should be a valid number');
    assert.ok(!error.message.includes('private input'));
    return true;
  });
});

test('HTML login/error pages and malformed success envelopes are rejected', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('<html>login</html>'));
  await assert.rejects(apiRequest('/firms'), error => error.code === 'INVALID_RESPONSE');
  fetch.mock.mockImplementation(async () => Response.json({ success: true }));
  await assert.rejects(apiRequest('/firms'), error => error.code === 'INVALID_RESPONSE');
});

test('failed deletes do not invoke mutation success or fabricate a saved result', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false, error: { code: 'DELETE_ERROR' } }));
  const client = new QueryClient();
  t.after(() => client.clear());
  let succeeded = false;
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () => apiRequest('/firms/example', { method: 'DELETE' }),
    onSuccess: () => { succeeded = true; },
  });
  await assert.rejects(mutation.execute());
  assert.equal(succeeded, false);
  assert.equal(mutation.state.status, 'error');
});

test('network failures do not retry writes or claim that they were not saved', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw Error('offline'); });
  await assert.rejects(apiRequest('/accounts', { method: 'POST' }), error => {
    assert.equal(error.code, 'NETWORK_ERROR');
    assert.match(error.message, /Could not confirm the change/);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
});

test('successful no-content deletes are supported', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  assert.equal(await apiRequest('/trades/example', { method: 'DELETE' }), undefined);
});

test('unreadable write responses require refreshing before another attempt', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>unexpected response</html>'));
  await assert.rejects(apiRequest('/accounts', { method: 'POST' }), error => {
    assert.equal(error.code, 'INVALID_RESPONSE');
    assert.match(error.message, /Could not confirm the change/);
    return true;
  });
});
