export type Trade = {
  id: string;
  account_id: string;
  stage_id?: number;
  date: string;
  instrument: string;
  direction: 'long' | 'short';
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  size: number;
  exit_price?: number;
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}