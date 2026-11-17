import { Analytics, EquityPoint, CalendarData } from '../types/analytics';
import { apiRequest } from './client.js';
import { apiData } from '../lib/queryCache.js';

const filters = (accountId?: string, stageId?: number) => {
  const params = new URLSearchParams();
  if (accountId) params.set('account_id', accountId);
  if (stageId !== undefined) params.set('stage_id', String(stageId));
  return params;
};

export const analyticsApi = {
  async getAnalytics(accountId?: string, stageId?: number, days = 30): Promise<Analytics> {
    const params = filters(accountId, stageId);
    params.set('days', String(days));
    const data = await apiRequest<Analytics>(`/analytics?${params}`, {}, 'Could not load performance statistics.');
    return apiData(['analytics', accountId, stageId, days], data);
  },
  async getEquityCurve(accountId?: string, stageId?: number, days = 30): Promise<EquityPoint[]> {
    const params = filters(accountId, stageId);
    params.set('days', String(days));
    const data = await apiRequest<EquityPoint[]>(`/analytics/equity?${params}`, {}, 'Could not load the equity curve.');
    return apiData(['equity-curve', accountId, stageId, days], data);
  },
  async getCalendarData(accountId?: string, stageId?: number, year?: number, month?: number): Promise<CalendarData> {
    const params = filters(accountId, stageId);
    if (year !== undefined) params.set('year', String(year));
    if (month !== undefined) params.set('month', String(month));
    const data = await apiRequest<CalendarData>(`/analytics/calendar?${params}`, {}, 'Could not load the trading calendar.');
    return apiData(['calendar-data', accountId, stageId, year, month], data);
  },
};
