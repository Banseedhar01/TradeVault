export type Analytics = {
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  avg_rr: number;
  largest_win: number;
  largest_loss: number;
  consecutive_wins: number;
  consecutive_losses: number;
}

export type EquityPoint = {
  date: string;
  balance: number;
  daily_pnl: number;
}

export type CalendarData = {
  [date: string]: {
    total_pnl: number;
    trade_count: number;
    winning_trades: number;
    losing_trades: number;
  };
}