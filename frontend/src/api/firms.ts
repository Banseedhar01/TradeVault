import { PropFirm } from '../types/firm';
import { apiRequest } from './client.js';
import { apiData } from '../lib/queryCache.js';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const firmsApi = {
  async getAll(): Promise<PropFirm[]> {
    const data = await apiRequest<PropFirm[]>('/firms', {}, 'Could not load firms.');
    return apiData(['firms'], data);
  },
  async create(data: Omit<PropFirm, 'id' | 'created_at' | 'updated_at'>): Promise<PropFirm> {
    return apiRequest('/firms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }, 'Could not create the firm.');
  },
  async update(id: string, updates: Partial<PropFirm>): Promise<PropFirm> {
    return apiRequest(`/firms/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    }, 'Could not update the firm.');
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/firms/${id}`, { method: 'DELETE' }, 'Could not delete the firm.');
  },
};
