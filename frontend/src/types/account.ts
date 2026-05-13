export type Stage = {
  name: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'live';
  profit_target: number;
  max_loss: number;
  max_daily_loss: number;
  min_trading_days: number;
  profit_split: number;
  on_demand_payout: boolean;
  current_pnl: number;
  daily_loss_used: number;
  days_traded: number;
  created_at: string;
}

export type Account = {
  id: string;
  firm_id: string;
  plan_name: string;
  account_size: number;
  platform: string;
  leverage: string;
  current_stage: number;
  stages: Stage[];
  fees?: number;
  start_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}