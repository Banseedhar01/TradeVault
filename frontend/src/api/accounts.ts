import { Account, Stage } from '../types/account';
import { ApiResponse } from './firms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Mock data fallback
const mockAccounts: Account[] = [
  {
    id: '1',
    firm_id: '1', // FTMO
    plan_name: 'FTMO Standard',
    account_size: 100000,
    platform: 'MT4',
    leverage: '1:100',
    current_stage: 1,
    stages: [
      {
        name: 'Phase 1',
        status: 'passed',
        profit_target: 10000,
        max_loss: 10000,
        max_daily_loss: 5000,
        min_trading_days: 4,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 10500,
        daily_loss_used: 0,
        days_traded: 8,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Phase 2',
        status: 'in_progress',
        profit_target: 5000,
        max_loss: 10000,
        max_daily_loss: 5000,
        min_trading_days: 4,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 2100,
        daily_loss_used: 800,
        days_traded: 3,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Live',
        status: 'pending',
        profit_target: 0,
        max_loss: 10000,
        max_daily_loss: 5000,
        min_trading_days: 0,
        profit_split: 80,
        on_demand_payout: true,
        current_pnl: 0,
        daily_loss_used: 0,
        days_traded: 0,
        created_at: new Date().toISOString(),
      },
    ],
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    firm_id: '2', // The5ers
    plan_name: 'Hyper',
    account_size: 6000,
    platform: 'MT5',
    leverage: '1:100',
    current_stage: 0,
    stages: [
      {
        name: 'Phase 1',
        status: 'in_progress',
        profit_target: 360,
        max_loss: 300,
        max_daily_loss: 240,
        min_trading_days: 3,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 120,
        daily_loss_used: 0,
        days_traded: 2,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Live',
        status: 'pending',
        profit_target: 0,
        max_loss: 300,
        max_daily_loss: 240,
        min_trading_days: 0,
        profit_split: 80,
        on_demand_payout: true,
        current_pnl: 0,
        daily_loss_used: 0,
        days_traded: 0,
        created_at: new Date().toISOString(),
      },
    ],
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    firm_id: '3', // Alpha Capital
    plan_name: 'Alpha Pro',
    account_size: 10000,
    platform: 'MT5',
    leverage: '1:100',
    current_stage: 0,
    stages: [
      {
        name: 'Phase 1',
        status: 'in_progress',
        profit_target: 800,
        max_loss: 800,
        max_daily_loss: 400,
        min_trading_days: 5,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 340,
        daily_loss_used: 180,
        days_traded: 3,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Phase 2',
        status: 'pending',
        profit_target: 500,
        max_loss: 800,
        max_daily_loss: 400,
        min_trading_days: 5,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 0,
        daily_loss_used: 0,
        days_traded: 0,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Live',
        status: 'pending',
        profit_target: 0,
        max_loss: 800,
        max_daily_loss: 400,
        min_trading_days: 0,
        profit_split: 80,
        on_demand_payout: true,
        current_pnl: 0,
        daily_loss_used: 0,
        days_traded: 0,
        created_at: new Date().toISOString(),
      },
    ],
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    firm_id: '4', // Apex Trader
    plan_name: '$50,000 Challenge',
    account_size: 50000,
    platform: 'Rithmic',
    leverage: '1:50',
    current_stage: 0,
    stages: [
      {
        name: 'Challenge',
        status: 'in_progress',
        profit_target: 3000,
        max_loss: 2500,
        max_daily_loss: 1000,
        min_trading_days: 5,
        profit_split: 80,
        on_demand_payout: false,
        current_pnl: 1200,
        daily_loss_used: 0,
        days_traded: 4,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Live',
        status: 'pending',
        profit_target: 0,
        max_loss: 2500,
        max_daily_loss: 1000,
        min_trading_days: 0,
        profit_split: 80,
        on_demand_payout: true,
        current_pnl: 0,
        daily_loss_used: 0,
        days_traded: 0,
        created_at: new Date().toISOString(),
      },
    ],
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const accountsApi = {
  async getAll(): Promise<Account[]> {
    try {
      const response = await fetch(`${API_BASE}/accounts`);
      const result: ApiResponse<Account[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch accounts');
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return mockAccounts;
    }
  },

  async create(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    const result: ApiResponse<Account> = await response.json();
    if (result.success && result.data) return result.data;
    throw new Error(result.error?.message || `Failed to create account (${response.status})`);
  },

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result: ApiResponse<Account> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to update account');
    } catch (error) {
      console.warn('API not available, returning mock data:', error);
      const existingAccount = mockAccounts.find(a => a.id === id);
      if (!existingAccount) throw new Error('Account not found');
      
      return {
        ...existingAccount,
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }
  },

  async updateStage(accountId: string, stageId: number, updates: Partial<Stage>): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE}/accounts/${accountId}/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result: ApiResponse<Account> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to update stage');
    } catch (error) {
      console.warn('API not available, returning mock data:', error);
      const existingAccount = mockAccounts.find(a => a.id === accountId);
      if (!existingAccount) throw new Error('Account not found');
      
      if (stageId >= existingAccount.stages.length) {
        throw new Error('Stage not found');
      }

      const updatedAccount = {
        ...existingAccount,
        stages: existingAccount.stages.map((stage, index) => 
          index === stageId ? { ...stage, ...updates } : stage
        ),
        updated_at: new Date().toISOString(),
      };
      
      return updatedAccount;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<{id: string}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete account');
      }
    } catch (error) {
      console.warn('API not available, mock deletion:', error);
    }
  },
};