import { Trade } from '../types/trade';
import { ApiResponse } from './firms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Mock data fallback
const mockTrades: Trade[] = [
  {
    id: '1',
    account_id: '1',
    stage_id: 1,
    date: '2024-01-15',
    instrument: 'EURUSD',
    direction: 'long',
    entry_price: 1.0950,
    stop_loss: 1.0900,
    take_profit: 1.1000,
    size: 1.0,
    exit_price: 1.0980,
    pnl: 300.0,
    status: 'closed',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    account_id: '1',
    stage_id: 1,
    date: '2024-01-14',
    instrument: 'GBPUSD',
    direction: 'short',
    entry_price: 1.2750,
    stop_loss: 1.2800,
    take_profit: 1.2700,
    size: 0.5,
    exit_price: 1.2720,
    pnl: 150.0,
    status: 'closed',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    account_id: '3',
    stage_id: 0,
    date: '2024-01-16',
    instrument: 'NQ',
    direction: 'long',
    entry_price: 16500.0,
    stop_loss: 16450.0,
    take_profit: 16600.0,
    size: 1.0,
    exit_price: 16580.0,
    pnl: 1600.0,
    status: 'closed',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    account_id: '4',
    stage_id: 0,
    date: '2024-01-17',
    instrument: 'ES',
    direction: 'short',
    entry_price: 4800.0,
    stop_loss: 4820.0,
    take_profit: 4750.0,
    size: 2.0,
    exit_price: 4760.0,
    pnl: 4000.0,
    status: 'closed',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const tradesApi = {
  async getAll(): Promise<Trade[]> {
    try {
      const response = await fetch(`${API_BASE}/trades`);
      const result: ApiResponse<Trade[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch trades');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockTrades;
    }
  },

  async create(trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade> {
    const response = await fetch(`${API_BASE}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    });
    const result: ApiResponse<Trade> = await response.json();
    if (result.success && result.data) return result.data;
    throw new Error(result.error?.message || `Failed to create trade (${response.status})`);
  },

  async update(id: string, updates: Partial<Trade>): Promise<Trade> {
    try {
      const response = await fetch(`${API_BASE}/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result: ApiResponse<Trade> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to update trade');
    } catch (error) {
      console.warn('API not available, returning mock data:', error);
      const existingTrade = mockTrades.find(t => t.id === id);
      if (!existingTrade) throw new Error('Trade not found');
      
      return {
        ...existingTrade,
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/trades/${id}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<{id: string}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete trade');
      }
    } catch (error) {
      console.warn('API not available, mock deletion:', error);
    }
  },
};