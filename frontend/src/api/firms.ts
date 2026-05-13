import { PropFirm } from '../types/firm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Mock data fallback
const mockFirms: PropFirm[] = [
  {
    id: '1',
    name: 'FTMO',
    market_type: 'forex',
    platform: 'MT4',
    notes: 'Leading forex prop trading firm',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'The5ers',
    market_type: 'forex',
    platform: 'MT5',
    notes: 'Forex prop firm with good conditions',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Alpha Capital',
    market_type: 'futures',
    platform: 'MT5',
    notes: 'Professional futures prop trading firm',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Apex Trader',
    market_type: 'futures',
    platform: 'Rithmic',
    notes: 'Popular futures trading platform',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const firmsApi = {
  async getAll(): Promise<PropFirm[]> {
    try {
      const response = await fetch(`${API_BASE}/firms`);
      const result: ApiResponse<PropFirm[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch firms');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockFirms;
    }
  },

  async create(firm: Omit<PropFirm, 'id' | 'created_at' | 'updated_at'>): Promise<PropFirm> {
    try {
      const response = await fetch(`${API_BASE}/firms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firm),
      });
      const result: ApiResponse<PropFirm> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to create firm');
    } catch (error) {
      console.warn('API not available, returning mock data:', error);
      const newFirm: PropFirm = {
        ...firm,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newFirm;
    }
  },

  async update(id: string, updates: Partial<PropFirm>): Promise<PropFirm> {
    try {
      const response = await fetch(`${API_BASE}/firms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result: ApiResponse<PropFirm> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to update firm');
    } catch (error) {
      console.warn('API not available, returning mock data:', error);
      const existingFirm = mockFirms.find(f => f.id === id);
      if (!existingFirm) throw new Error('Firm not found');
      
      return {
        ...existingFirm,
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/firms/${id}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<{id: string}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete firm');
      }
    } catch (error) {
      console.warn('API not available, mock deletion:', error);
    }
  },
};