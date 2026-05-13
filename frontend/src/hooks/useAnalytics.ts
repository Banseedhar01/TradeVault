import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';

export const useAnalytics = (accountId?: string, stageId?: number, days: number = 30) => {
  return useQuery({
    queryKey: ['analytics', accountId, stageId, days],
    queryFn: () => analyticsApi.getAnalytics(accountId, stageId, days),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: true,
  });
};

export const useEquityCurve = (accountId?: string, stageId?: number, days: number = 30) => {
  return useQuery({
    queryKey: ['equity-curve', accountId, stageId, days],
    queryFn: () => analyticsApi.getEquityCurve(accountId, stageId, days),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: true,
  });
};

export const useCalendarData = (accountId?: string, stageId?: number, year?: number, month?: number) => {
  return useQuery({
    queryKey: ['calendar-data', accountId, stageId, year, month],
    queryFn: () => analyticsApi.getCalendarData(accountId, stageId, year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};