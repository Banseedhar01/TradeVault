import asyncio
from datetime import datetime, timedelta
import random
from beanie import PydanticObjectId

from app.database import database
from app.models.prop_firm import PropFirm
from app.models.account import Account, Stage
from app.models.trade import Trade
from app.models.daily_stats import DailyStats

async def seed_database():
    await database.connect_db()
    
    # Clear existing data
    await PropFirm.delete_all()
    await Account.delete_all()
    await Trade.delete_all()
    await DailyStats.delete_all()
    
    print("Creating prop firms...")
    
    # Create Futures firms
    alpha_capital = PropFirm(
        name="Alpha Capital",
        market_type="futures",
        platform="MT5",
        notes="Professional futures prop trading firm"
    )
    await alpha_capital.create()
    
    apex_trader = PropFirm(
        name="Apex Trader",
        market_type="futures", 
        platform="Rithmic",
        notes="Popular futures trading platform"
    )
    await apex_trader.create()
    
    # Create Forex firms
    ftmo = PropFirm(
        name="FTMO",
        market_type="forex",
        platform="MT4",
        notes="Leading forex prop trading firm"
    )
    await ftmo.create()
    
    the5ers = PropFirm(
        name="The5ers",
        market_type="forex",
        platform="MT5", 
        notes="Forex prop firm with good conditions"
    )
    await the5ers.create()
    
    print("Creating accounts with stages...")
    
    # Alpha Capital Account
    alpha_account = Account(
        firm_id=alpha_capital.id,
        plan_name="Alpha Pro",
        account_size=10000.0,
        platform="MT5",
        leverage="1:100",
        current_stage=0,
        stages=[
            Stage(
                name="Phase 1",
                status="in_progress",
                profit_target=800.0,
                max_loss=800.0,
                max_daily_loss=400.0,
                min_trading_days=5,
                profit_split=80.0,
                current_pnl=340.0,
                daily_loss_used=180.0,
                days_traded=3
            ),
            Stage(
                name="Phase 2", 
                status="pending",
                profit_target=500.0,
                max_loss=800.0,
                max_daily_loss=400.0,
                min_trading_days=5,
                profit_split=80.0
            ),
            Stage(
                name="Live",
                status="pending",
                profit_target=0.0,
                max_loss=800.0,
                max_daily_loss=400.0,
                profit_split=80.0,
                on_demand_payout=True
            )
        ]
    )
    await alpha_account.create()
    
    # Apex Trader Account
    apex_account = Account(
        firm_id=apex_trader.id,
        plan_name="$50,000 Challenge",
        account_size=50000.0,
        platform="Rithmic",
        leverage="1:50",
        current_stage=0,
        stages=[
            Stage(
                name="Challenge",
                status="in_progress",
                profit_target=3000.0,
                max_loss=2500.0,
                max_daily_loss=1000.0,
                min_trading_days=5,
                profit_split=80.0,
                current_pnl=1200.0,
                days_traded=4
            ),
            Stage(
                name="Live",
                status="pending",
                profit_target=0.0,
                max_loss=2500.0,
                max_daily_loss=1000.0,
                profit_split=80.0,
                on_demand_payout=True
            )
        ]
    )
    await apex_account.create()
    
    # FTMO Account
    ftmo_account = Account(
        firm_id=ftmo.id,
        plan_name="FTMO Standard",
        account_size=100000.0,
        platform="MT4",
        leverage="1:100",
        current_stage=1,
        stages=[
            Stage(
                name="Phase 1",
                status="passed",
                profit_target=10000.0,
                max_loss=10000.0,
                max_daily_loss=5000.0,
                min_trading_days=4,
                profit_split=80.0,
                current_pnl=10500.0,
                days_traded=8
            ),
            Stage(
                name="Phase 2",
                status="in_progress", 
                profit_target=5000.0,
                max_loss=10000.0,
                max_daily_loss=5000.0,
                min_trading_days=4,
                profit_split=80.0,
                current_pnl=2100.0,
                daily_loss_used=800.0,
                days_traded=3
            ),
            Stage(
                name="Live",
                status="pending",
                profit_target=0.0,
                max_loss=10000.0,
                max_daily_loss=5000.0,
                profit_split=80.0,
                on_demand_payout=True
            )
        ]
    )
    await ftmo_account.create()
    
    # The5ers Account
    the5ers_account = Account(
        firm_id=the5ers.id,
        plan_name="Hyper",
        account_size=6000.0,
        platform="MT5",
        leverage="1:100",
        current_stage=0,
        stages=[
            Stage(
                name="Phase 1",
                status="in_progress",
                profit_target=360.0,
                max_loss=300.0,
                max_daily_loss=240.0,
                min_trading_days=3,
                profit_split=80.0,
                current_pnl=120.0,
                days_traded=2
            ),
            Stage(
                name="Live",
                status="pending",
                profit_target=0.0,
                max_loss=300.0,
                max_daily_loss=240.0,
                profit_split=80.0,
                on_demand_payout=True
            )
        ]
    )
    await the5ers_account.create()
    
    print("Creating trades...")
    
    # Generate realistic trades
    accounts = [alpha_account, apex_account, ftmo_account, the5ers_account]
    futures_instruments = ["NQ", "ES", "MNQ", "MES", "CL", "GC"]
    forex_instruments = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "EURJPY"]
    
    trades_data = []
    
    # Generate trades for the last 30 days
    for i in range(30):
        trade_date = (datetime.now().date() - timedelta(days=i)).isoformat()
        
        # Randomly generate 0-3 trades per day
        num_trades = random.randint(0, 3)
        
        for _ in range(num_trades):
            account = random.choice(accounts)
            
            # Choose appropriate instruments based on firm type
            if account.firm_id in [alpha_capital.id, apex_trader.id]:
                instrument = random.choice(futures_instruments)
            else:
                instrument = random.choice(forex_instruments)
            
            direction = random.choice(["long", "short"])
            entry_price = random.uniform(1.0, 100.0)
            size = random.uniform(0.1, 2.0)
            
            # Generate realistic PnL (60% win rate)
            is_winner = random.random() < 0.6
            if is_winner:
                pnl = random.uniform(50, 500)
            else:
                pnl = random.uniform(-300, -50)
            
            exit_price = entry_price + (pnl / (size * 100))  # Simplified calculation
            
            trade = Trade(
                account_id=account.id,
                stage_id=account.current_stage,
                date=trade_date,
                instrument=instrument,
                direction=direction,
                entry_price=round(entry_price, 4),
                stop_loss=round(entry_price * (0.98 if direction == "long" else 1.02), 4),
                take_profit=round(entry_price * (1.02 if direction == "long" else 0.98), 4),
                size=round(size, 2),
                exit_price=round(exit_price, 4),
                pnl=round(pnl, 2),
                status="closed",
                notes="Automated seed trade"
            )
            trades_data.append(trade)
    
    # Batch create trades
    if trades_data:
        await Trade.insert_many(trades_data)
    
    print("Creating daily stats...")
    
    # Generate daily stats from trades
    for account in accounts:
        account_trades = [t for t in trades_data if t.account_id == account.id]
        
        # Group trades by date
        trades_by_date = {}
        for trade in account_trades:
            if trade.date not in trades_by_date:
                trades_by_date[trade.date] = []
            trades_by_date[trade.date].append(trade)
        
        # Create daily stats
        daily_stats = []
        for trade_date, day_trades in trades_by_date.items():
            total_pnl = sum(t.pnl for t in day_trades)
            winning_trades = len([t for t in day_trades if t.pnl > 0])
            losing_trades = len([t for t in day_trades if t.pnl < 0])
            largest_win = max([t.pnl for t in day_trades if t.pnl > 0], default=0.0)
            largest_loss = min([t.pnl for t in day_trades if t.pnl < 0], default=0.0)
            
            daily_stat = DailyStats(
                date=trade_date,
                account_id=account.id,
                stage_id=account.current_stage,
                total_pnl=round(total_pnl, 2),
                trade_count=len(day_trades),
                winning_trades=winning_trades,
                losing_trades=losing_trades,
                largest_win=round(largest_win, 2),
                largest_loss=round(largest_loss, 2)
            )
            daily_stats.append(daily_stat)
        
        if daily_stats:
            await DailyStats.insert_many(daily_stats)
    
    print("Database seeded successfully!")
    print(f"Created {len(await PropFirm.find_all().to_list())} firms")
    print(f"Created {len(await Account.find_all().to_list())} accounts") 
    print(f"Created {len(await Trade.find_all().to_list())} trades")
    print(f"Created {len(await DailyStats.find_all().to_list())} daily stats")

if __name__ == "__main__":
    asyncio.run(seed_database())