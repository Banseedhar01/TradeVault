import { dehydrate, hydrate } from '@tanstack/react-query';

export const MAX_CACHE_AGE = 5 * 60 * 1000;
const VERSION = 1;
const RESOURCES = new Set(['firms', 'accounts', 'trades', 'analytics', 'equity-curve', 'calendar-data']);
const sampleQueries = new Set();

// Keep existing sample-data fallbacks in the UI, but never persist them as
// previously fetched database records. Keys match the corresponding hooks.
export function apiData(queryKey, data, isSample = false) {
  const key = JSON.stringify(queryKey);
  if (isSample) sampleQueries.add(key);
  else sampleQueries.delete(key);
  return data;
}

export const cacheKey = scope => `tradevault-dashboard:v${VERSION}:${scope}`;
const isDashboardQuery = query => Array.isArray(query.queryKey) && RESOURCES.has(query.queryKey[0]);
const isRecent = (timestamp, now) => Number.isFinite(timestamp) && timestamp <= now && now - timestamp < MAX_CACHE_AGE;

export function restoreDashboardCache(client, storage, scope, now = Date.now()) {
  const key = cacheKey(scope);
  try {
    const raw = storage.getItem(key);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (saved.version !== VERSION || saved.scope !== scope ||
        !isRecent(saved.savedAt, now) || !Array.isArray(saved.queries)) {
      storage.removeItem(key);
      return false;
    }
    const queries = saved.queries.filter(query =>
      isDashboardQuery(query) && typeof query.queryHash === 'string' &&
      query.state?.status === 'success' && query.state.data !== undefined &&
      !query.state.isInvalidated && isRecent(query.state.dataUpdatedAt, now));
    hydrate(client, { mutations: [], queries });
    // Data is available for the first render, but mounted cards immediately
    // revalidate it in the background even when their normal staleTime is long.
    client.invalidateQueries({ predicate: isDashboardQuery, refetchType: 'none' });
    return queries.length > 0;
  } catch {
    try { storage.removeItem(key); } catch { /* Storage can be disabled. */ }
    return false;
  }
}

export function persistDashboardCache(client, storage, scope, now = Date.now()) {
  const key = cacheKey(scope);
  try {
    if (client.isMutating()) {
      storage.removeItem(key);
      return;
    }
    const { queries } = dehydrate(client, {
      shouldDehydrateMutation: () => false,
      shouldDehydrateQuery: query => isDashboardQuery(query) &&
        query.state.status === 'success' && !query.state.isInvalidated &&
        isRecent(query.state.dataUpdatedAt, now) &&
        !sampleQueries.has(JSON.stringify(query.queryKey)),
    });
    if (!queries.length) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify({ version: VERSION, scope, savedAt: now, queries }));
  } catch {
    // Quota errors and private-browsing restrictions must not affect the app.
    try { storage.removeItem(key); } catch { /* Nothing else to clear. */ }
  }
}

export function installDashboardCache(client, scope, storage) {
  try {
    storage ??= window.sessionStorage;
    restoreDashboardCache(client, storage, scope);
  } catch {
    return () => {};
  }
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => persistDashboardCache(client, storage, scope), 100);
  };
  const unsubscribeQueries = client.getQueryCache().subscribe(event => {
    if (event.type === 'removed' || event.type === 'updated' &&
        ['success', 'invalidate', 'error'].includes(event.action.type)) schedule();
  });
  const unsubscribeMutations = client.getMutationCache().subscribe(event => {
    if (event.type !== 'updated') return;
    if (event.action.type === 'pending') {
      clearTimeout(timer);
      try { storage.removeItem(cacheKey(scope)); } catch { /* Storage can be disabled. */ }
    } else if (event.action.type === 'success' || event.action.type === 'error') {
      schedule();
    }
  });
  const flush = () => persistDashboardCache(client, storage, scope);
  if (typeof window !== 'undefined') window.addEventListener('pagehide', flush);
  return () => {
    clearTimeout(timer);
    unsubscribeQueries();
    unsubscribeMutations();
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', flush);
  };
}
