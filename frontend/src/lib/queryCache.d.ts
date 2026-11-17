import type { QueryClient, QueryKey } from '@tanstack/react-query';

type CacheStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const MAX_CACHE_AGE: number;
export function apiData<T>(queryKey: QueryKey, data: T, isSample?: boolean): T;
export function cacheKey(scope: string): string;
export function restoreDashboardCache(
  client: QueryClient, storage: CacheStorage, scope: string, now?: number,
): boolean;
export function persistDashboardCache(
  client: QueryClient, storage: CacheStorage, scope: string, now?: number,
): void;
export function installDashboardCache(
  client: QueryClient, scope: string, storage?: CacheStorage,
): () => void;
