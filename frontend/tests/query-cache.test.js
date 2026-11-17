import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  apiData, cacheKey, installDashboardCache, MAX_CACHE_AGE,
  persistDashboardCache, restoreDashboardCache,
} from '../src/lib/queryCache.js';

function storage() {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
}

function client(t) {
  const result = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => result.clear());
  return result;
}

test('cached cards render immediately while fresh data loads in the background', async t => {
  const store = storage();
  const first = client(t);
  const key = ['accounts', 'background'];
  first.setQueryData(key, [{ id: 'previous' }]);
  persistDashboardCache(first, store, 'preview|/api');

  const next = client(t);
  assert.equal(restoreDashboardCache(next, store, 'preview|/api'), true);
  let finish;
  const deferred = new Promise(resolve => { finish = resolve; });
  const observer = new QueryObserver(next, {
    queryKey: key, queryFn: () => deferred, staleTime: MAX_CACHE_AGE,
  });
  const stop = observer.subscribe(() => {});
  t.after(stop);
  assert.deepEqual(observer.getCurrentResult().data, [{ id: 'previous' }]);
  assert.equal(observer.getCurrentResult().isLoading, false);
  assert.equal(observer.getCurrentResult().isFetching, true);
  const pending = next.getQueryCache().find({ queryKey: key }).promise;
  finish([{ id: 'fresh' }]);
  await pending;
  assert.deepEqual(observer.getCurrentResult().data, [{ id: 'fresh' }]);
});

test('cache cannot cross environments or API URLs', t => {
  const store = storage();
  const first = client(t);
  first.setQueryData(['firms'], []);
  persistDashboardCache(first, store, 'preview|/api');
  const prod = client(t);
  assert.equal(restoreDashboardCache(prod, store, 'production|https://api.example/api'), false);
  assert.equal(restoreDashboardCache(prod, store, 'preview|https://other.example/api'), false);
  assert.equal(prod.getQueryData(['firms']), undefined);
});

test('expired snapshots and individually old results are discarded', t => {
  const store = storage();
  const first = client(t);
  const now = Date.now();
  first.setQueryData(['accounts'], [], { updatedAt: now });
  first.setQueryData(['trades'], [], { updatedAt: now - MAX_CACHE_AGE - 1 });
  persistDashboardCache(first, store, 'prod', now);
  const snapshot = JSON.parse(store.getItem(cacheKey('prod')));
  assert.deepEqual(snapshot.queries.map(q => q.queryKey), [['accounts']]);
  assert.equal(restoreDashboardCache(client(t), store, 'prod', now + MAX_CACHE_AGE), false);
  assert.equal(store.getItem(cacheKey('prod')), null);
});

test('sample responses are not stored even after structural sharing', t => {
  const store = storage();
  const first = client(t);
  const key = ['analytics', 'samples'];
  first.setQueryData(key, { total_trades: 1, total_pnl: 0 });
  first.setQueryData(key, apiData(key, { total_trades: 25, total_pnl: 0 }, true));
  persistDashboardCache(first, store, 'prod');
  assert.equal(store.getItem(cacheKey('prod')), null);
  first.setQueryData(key, apiData(key, { total_trades: 2, total_pnl: 0 }));
  persistDashboardCache(first, store, 'prod');
  assert.equal(JSON.parse(store.getItem(cacheKey('prod'))).queries.length, 1);
});

test('invalidated, failed, pending, and unrelated queries are not cached', async t => {
  const store = storage();
  const first = client(t);
  first.setQueryData(['accounts'], []);
  first.setQueryData(['private-unrelated-data'], { token: 'never-cache' });
  await first.invalidateQueries({ queryKey: ['accounts'], refetchType: 'none' });
  await assert.rejects(first.fetchQuery({ queryKey: ['trades'], queryFn: () => Promise.reject(Error('offline')) }));
  first.getQueryCache().build(first, { queryKey: ['equity-curve'] });
  persistDashboardCache(first, store, 'prod');
  assert.equal(store.getItem(cacheKey('prod')), null);
});

test('a write immediately clears persisted results and cannot persist stale data while pending', async t => {
  const store = storage();
  const first = client(t);
  const stop = installDashboardCache(first, 'prod', store);
  t.after(stop);
  first.setQueryData(['accounts'], [{ id: 'before-delete' }]);
  persistDashboardCache(first, store, 'prod');
  assert.ok(store.getItem(cacheKey('prod')));
  let finish;
  const mutation = first.getMutationCache().build(first, {
    mutationFn: () => new Promise(resolve => { finish = resolve; }),
    onSuccess: () => first.invalidateQueries({ queryKey: ['accounts'], refetchType: 'none' }),
  });
  const pending = mutation.execute();
  assert.equal(store.getItem(cacheKey('prod')), null);
  persistDashboardCache(first, store, 'prod');
  assert.equal(store.getItem(cacheKey('prod')), null);
  while (!finish) await Promise.resolve();
  finish();
  await pending;
  persistDashboardCache(first, store, 'prod');
  assert.equal(store.getItem(cacheKey('prod')), null);
});

test('corrupt, future-dated, and inaccessible storage never prevents startup', t => {
  const first = client(t);
  const store = storage();
  store.setItem(cacheKey('prod'), 'invalid-json');
  assert.equal(restoreDashboardCache(first, store, 'prod'), false);
  first.setQueryData(['firms'], [], { updatedAt: Date.now() + 60_000 });
  persistDashboardCache(first, store, 'prod');
  assert.equal(store.getItem(cacheKey('prod')), null);
  const denied = {
    getItem() { throw Error('storage disabled'); },
    setItem() { throw Error('quota exceeded'); },
    removeItem() { throw Error('storage disabled'); },
  };
  assert.doesNotThrow(() => restoreDashboardCache(first, denied, 'prod'));
  first.setQueryData(['firms'], []);
  assert.doesNotThrow(() => persistDashboardCache(first, denied, 'prod'));
});
