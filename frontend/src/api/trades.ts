import { Trade } from '../types/trade';
import { apiRequest } from './client.js';
import { apiData } from '../lib/queryCache.js';

export const tradesApi = {
  async getAll(): Promise<Trade[]> {
    const data = await apiRequest<Trade[]>('/trades', {}, 'Could not load trades.');
    return apiData(['trades'], data);
  },
  async create(data: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade> {
    return apiRequest('/trades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }, 'Could not create the trade.');
  },
  async update(id: string, updates: Partial<Trade>): Promise<Trade> {
    return apiRequest(`/trades/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    }, 'Could not update the trade.');
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/trades/${id}`, { method: 'DELETE' }, 'Could not delete the trade.');
  },
};
