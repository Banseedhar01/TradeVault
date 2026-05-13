import { Analytics, EquityPoint, CalendarData } from '../types/analytics';
import { ApiResponse } from './firms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Mock data fallback
const mockAnalytics: Analytics = {
  total_trades: 25,
  win_rate: 64.0,
  total_pnl: 3250.0,
  avg_win: 285.0,
  avg_loss: -125.0,
  profit_factor: 2.28,
  avg_rr: 2.3,
  largest_win: 750.0,
  largest_loss: -280.0,
  consecutive_wins: 4,
  consecutive_losses: 2,
};

const mockEquityCurve: EquityPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const dailyPnl = Math.random() * 400 - 100; // -100 to 300
  
  return {
    date: date.toISOString().split('T')[0],
    balance: 1000 + (i * 50) + dailyPnl,
    daily_pnl: Math.round(dailyPnl * 100) / 100,
  };
});

const mockCalendarData: CalendarData = {};
for (let i = 0; i < 30; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateKey = date.toISOString().split('T')[0];
  
  const hasData = Math.random() > 0.3; // 70% chance of having trades
  if (hasData) {
    const tradeCount = Math.floor(Math.random() * 4) + 1;
    const winningTrades = Math.floor(tradeCount * 0.6);
    const losingTrades = tradeCount - winningTrades;
    const totalPnl = (winningTrades * 200) - (losingTrades * 100);
    
    mockCalendarData[dateKey] = {
      total_pnl: totalPnl,
      trade_count: tradeCount,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
    };
  }
}

export const analyticsApi = {
  async getAnalytics(accountId?: string, stageId?: number, days: number = 30): Promise<Analytics> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('account_id', accountId);
      if (stageId !== undefined) params.append('stage_id', stageId.toString());
      params.append('days', days.toString());
      
      const response = await fetch(`${API_BASE}/analytics?${params}`);
      const result: ApiResponse<Analytics> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch analytics');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockAnalytics;
    }
  },

  async getEquityCurve(accountId?: string, stageId?: number, days: number = 30): Promise<EquityPoint[]> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('account_id', accountId);
      if (stageId !== undefined) params.append('stage_id', stageId.toString());
      params.append('days', days.toString());
      
      const response = await fetch(`${API_BASE}/analytics/equity?${params}`);
      const result: ApiResponse<EquityPoint[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch equity curve');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockEquityCurve;
    }
  },

  async getCalendarData(accountId?: string, stageId?: number, year?: number, month?: number): Promise<CalendarData> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('account_id', accountId);
      if (stageId !== undefined) params.append('stage_id', stageId.toString());
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const response = await fetch(`${API_BASE}/analytics/calendar?${params}`);
      const result: ApiResponse<CalendarData> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch calendar data');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockCalendarData;
    }
  },
};