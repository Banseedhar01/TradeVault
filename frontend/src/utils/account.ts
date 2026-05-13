import { Account } from '../types/account';

export type AccountStatus = 'active' | 'live' | 'failed' | 'passed' | 'pending';
export type StatusFilter  = 'all' | 'active' | 'closed';

export function deriveAccountStatus(account: Account): AccountStatus {
  const stages = account.stages;
  if (stages.some(s => s.status === 'live'))        return 'live';
  if (stages.some(s => s.status === 'failed'))      return 'failed';
  if (stages.some(s => s.status === 'in_progress')) return 'active';
  if (stages.some(s => s.status === 'passed'))      return 'passed';
  return 'pending';
}

export function matchesStatusFilter(account: Account, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  const s = deriveAccountStatus(account);
  if (filter === 'active') return s === 'active' || s === 'live';
  if (filter === 'closed') return s === 'failed' || s === 'passed';
  return true;
}
