from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.trade import Trade
from app.models.daily_stats import DailyStats
from app.models.account import Account

router = APIRouter()

@router.get("/analytics", response_model=dict)
async def get_analytics(
    account_id: Optional[str] = Query(None),
    stage_id: Optional[int] = Query(None),
    days: Optional[int] = Query(30)
):
    try:
        # Build query filters
        filters = {"status": "closed"}
        if account_id:
            filters["account_id"] = account_id
        if stage_id is not None:
            filters["stage_id"] = stage_id
        
        # Get trades from the last N days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        end_date_str = end_date.isoformat()
        start_date_str = start_date.isoformat()
        
        trades = await Trade.find(
            Trade.status == "closed",
            Trade.date >= start_date_str,
            Trade.date <= end_date_str,
            *[getattr(Trade, k) == v for k, v in filters.items() if k != "status"]
        ).to_list()
        
        if not trades:
            return {
                "success": True,
                "data": {
                    "total_trades": 0,
                    "win_rate": 0.0,
                    "total_pnl": 0.0,
                    "avg_win": 0.0,
                    "avg_loss": 0.0,
                    "profit_factor": 0.0,
                    "avg_rr": 0.0,
                    "largest_win": 0.0,
                    "largest_loss": 0.0,
                    "consecutive_wins": 0,
                    "consecutive_losses": 0
                }
            }
        
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl < 0]
        
        win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
        total_pnl = sum(t.pnl for t in trades)
        avg_win = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        gross_profit = sum(t.pnl for t in winning_trades)
        gross_loss = abs(sum(t.pnl for t in losing_trades))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Calculate average RR (simplified)
        avg_rr = abs(avg_win / avg_loss) if avg_loss != 0 else 0
        
        largest_win = max([t.pnl for t in trades], default=0.0)
        largest_loss = min([t.pnl for t in trades], default=0.0)
        
        # Calculate consecutive streaks (simplified)
        consecutive_wins = 0
        consecutive_losses = 0
        current_win_streak = 0
        current_loss_streak = 0
        
        for trade in sorted(trades, key=lambda x: x.date):
            if trade.pnl > 0:
                current_win_streak += 1
                consecutive_wins = max(consecutive_wins, current_win_streak)
                current_loss_streak = 0
            elif trade.pnl < 0:
                current_loss_streak += 1
                consecutive_losses = max(consecutive_losses, current_loss_streak)
                current_win_streak = 0
        
        return {
            "success": True,
            "data": {
                "total_trades": total_trades,
                "win_rate": round(win_rate, 2),
                "total_pnl": round(total_pnl, 2),
                "avg_win": round(avg_win, 2),
                "avg_loss": round(avg_loss, 2),
                "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else 0,
                "avg_rr": round(avg_rr, 2),
                "largest_win": round(largest_win, 2),
                "largest_loss": round(largest_loss, 2),
                "consecutive_wins": consecutive_wins,
                "consecutive_losses": consecutive_losses
            }
        }
    except Exception as e:
        return {"success": False, "error": {"code": "ANALYTICS_ERROR", "message": str(e)}}

@router.get("/analytics/equity", response_model=dict)
async def get_equity_curve(
    account_id: Optional[str] = Query(None),
    stage_id: Optional[int] = Query(None),
    days: Optional[int] = Query(30)
):
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        end_date_str = end_date.isoformat()
        start_date_str = start_date.isoformat()
        
        # Build filters
        filters = {}
        if account_id:
            filters["account_id"] = account_id
        if stage_id is not None:
            filters["stage_id"] = stage_id
        
        daily_stats = await DailyStats.find(
            DailyStats.date >= start_date_str,
            DailyStats.date <= end_date_str,
            *[getattr(DailyStats, k) == v for k, v in filters.items()]
        ).sort("date").to_list()
        
        equity_curve = []
        running_balance = 0.0
        
        # Create a complete date range
        current_date = start_date
        stats_by_date = {stat.date: stat.total_pnl for stat in daily_stats}
        
        while current_date <= end_date:
            current_date_str = current_date.isoformat()
            daily_pnl = stats_by_date.get(current_date_str, 0.0)
            running_balance += daily_pnl
            
            equity_curve.append({
                "date": current_date_str,
                "balance": round(running_balance, 2),
                "daily_pnl": round(daily_pnl, 2)
            })
            
            current_date += timedelta(days=1)
        
        return {"success": True, "data": equity_curve}
    except Exception as e:
        return {"success": False, "error": {"code": "EQUITY_ERROR", "message": str(e)}}

@router.get("/analytics/calendar", response_model=dict)
async def get_calendar_data(
    account_id: Optional[str] = Query(None),
    stage_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None)
):
    try:
        if not year:
            year = datetime.now().year
        if not month:
            month = datetime.now().month
        
        # Get first and last day of the month
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        start_date_str = f"{year}-{month:02d}-01"
        end_date_str = f"{year}-{month:02d}-{last_day:02d}"
        
        # Build filters
        filters = {}
        if account_id:
            filters["account_id"] = account_id
        if stage_id is not None:
            filters["stage_id"] = stage_id
        
        daily_stats = await DailyStats.find(
            DailyStats.date >= start_date_str,
            DailyStats.date <= end_date_str,
            *[getattr(DailyStats, k) == v for k, v in filters.items()]
        ).to_list()
        
        calendar_data = {}
        for stat in daily_stats:
            date_key = stat.date
            calendar_data[date_key] = {
                "total_pnl": round(stat.total_pnl, 2),
                "trade_count": stat.trade_count,
                "winning_trades": stat.winning_trades,
                "losing_trades": stat.losing_trades
            }
        
        return {"success": True, "data": calendar_data}
    except Exception as e:
        return {"success": False, "error": {"code": "CALENDAR_ERROR", "message": str(e)}}