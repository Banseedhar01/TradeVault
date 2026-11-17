import { Account, Stage } from '../types/account';
import { apiRequest } from './client.js';
import { apiData } from '../lib/queryCache.js';

export const accountsApi = {
  async getAll(): Promise<Account[]> {
    const data = await apiRequest<Account[]>('/accounts', {}, 'Could not load accounts.');
    return apiData(['accounts'], data);
  },
  async create(data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    return apiRequest('/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }, 'Could not create the account.');
  },
  async update(id: string, updates: Partial<Account>): Promise<Account> {
    return apiRequest(`/accounts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    }, 'Could not update the account.');
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/accounts/${id}`, { method: 'DELETE' }, 'Could not delete the account.');
  },

  async updateStage(accountId: string, stageId: number, updates: Partial<Stage>): Promise<Account> {
    return apiRequest(`/accounts/${accountId}/stages/${stageId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    }, 'Could not update the stage.');
  },
};
