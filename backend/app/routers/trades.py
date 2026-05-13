from fastapi import APIRouter, HTTPException
from beanie import PydanticObjectId
from typing import Optional
from datetime import datetime

from app.models.trade import Trade
from app.models.account import Account
from app.models.daily_stats import DailyStats
from app.utils import serialize_doc, serialize_docs

router = APIRouter()


async def update_daily_stats(account_id: str, trade_date: str, stage_id: Optional[int] = None):
    try:
        trades = await Trade.find(
            Trade.account_id == account_id,
            Trade.date == trade_date,
            Trade.stage_id == stage_id,
            Trade.status == "closed"
        ).to_list()

        total_pnl = sum(trade.pnl for trade in trades)
        trade_count = len(trades)
        winning_trades = len([t for t in trades if t.pnl > 0])
        losing_trades = len([t for t in trades if t.pnl < 0])
        largest_win = max([t.pnl for t in trades if t.pnl > 0], default=0.0)
        largest_loss = min([t.pnl for t in trades if t.pnl < 0], default=0.0)

        daily_stat = await DailyStats.find_one(
            DailyStats.account_id == account_id,
            DailyStats.date == trade_date,
            DailyStats.stage_id == stage_id
        )

        if daily_stat:
            daily_stat.total_pnl = total_pnl
            daily_stat.trade_count = trade_count
            daily_stat.winning_trades = winning_trades
            daily_stat.losing_trades = losing_trades
            daily_stat.largest_win = largest_win
            daily_stat.largest_loss = largest_loss
            daily_stat.updated_at = datetime.now()
            await daily_stat.save()
        else:
            daily_stat = DailyStats(
                date=trade_date,
                account_id=account_id,
                stage_id=stage_id,
                total_pnl=total_pnl,
                trade_count=trade_count,
                winning_trades=winning_trades,
                losing_trades=losing_trades,
                largest_win=largest_win,
                largest_loss=largest_loss
            )
            await daily_stat.create()

        account = await Account.get(PydanticObjectId(account_id))
        if account and stage_id is not None and stage_id < len(account.stages):
            stage_trades = await Trade.find(
                Trade.account_id == account_id,
                Trade.stage_id == stage_id,
                Trade.status == "closed"
            ).to_list()
            account.stages[stage_id].current_pnl = sum(t.pnl for t in stage_trades)
            await account.save()

    except Exception as e:
        print(f"Error updating daily stats: {e}")


@router.get("/trades", response_model=dict)
async def get_trades():
    try:
        trades = await Trade.find_all().to_list()
        return {"success": True, "data": serialize_docs(trades)}
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.post("/trades", response_model=dict)
async def create_trade(trade: Trade):
    try:
        new_trade = await trade.create()
        if new_trade.status == "closed":
            await update_daily_stats(new_trade.account_id, new_trade.date, new_trade.stage_id)
        return {"success": True, "data": serialize_doc(new_trade)}
    except Exception as e:
        return {"success": False, "error": {"code": "CREATE_ERROR", "message": str(e)}}

@router.get("/trades/{trade_id}", response_model=dict)
async def get_trade(trade_id: PydanticObjectId):
    try:
        trade = await Trade.get(trade_id)
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        return {"success": True, "data": serialize_doc(trade)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.put("/trades/{trade_id}", response_model=dict)
async def update_trade(trade_id: PydanticObjectId, trade_data: dict):
    try:
        trade = await Trade.get(trade_id)
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        old_status = trade.status
        await trade.update({"$set": trade_data})
        updated_trade = await Trade.get(trade_id)
        if old_status != updated_trade.status and (old_status == "closed" or updated_trade.status == "closed"):
            await update_daily_stats(updated_trade.account_id, updated_trade.date, updated_trade.stage_id)
        return {"success": True, "data": serialize_doc(updated_trade)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "UPDATE_ERROR", "message": str(e)}}

@router.delete("/trades/{trade_id}", response_model=dict)
async def delete_trade(trade_id: PydanticObjectId):
    try:
        trade = await Trade.get(trade_id)
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        account_id = trade.account_id
        trade_date = trade.date
        stage_id = trade.stage_id
        was_closed = trade.status == "closed"
        await trade.delete()
        if was_closed:
            await update_daily_stats(account_id, trade_date, stage_id)
        return {"success": True, "data": {"id": str(trade_id)}}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "DELETE_ERROR", "message": str(e)}}
