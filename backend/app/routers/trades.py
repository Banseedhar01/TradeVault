import logging
from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern

from app.models.trade import Trade
from app.models.account import Account
from app.models.daily_stats import DailyStats
from app.utils import serialize_doc, serialize_docs

router = APIRouter()
logger = logging.getLogger(__name__)


def closed_scope(trade):
    if trade.status != "closed":
        return None
    return (trade.account_id, trade.date, trade.stage_id)


async def validate_trade_account(trade, session):
    if not PydanticObjectId.is_valid(trade.account_id):
        raise HTTPException(400, "Select a valid account")
    account = await Account.get(PydanticObjectId(trade.account_id), session=session)
    if account is None:
        raise HTTPException(400, "The selected account no longer exists")
    if trade.stage_id is not None and not 0 <= trade.stage_id < len(account.stages):
        raise HTTPException(400, "Select a valid account stage")


async def update_daily_stats(account_id: str, trade_date: str, stage_id: Optional[int] = None, *, session=None):
    filters = {"account_id": account_id, "date": trade_date, "stage_id": stage_id}
    trades = await Trade.find({**filters, "status": "closed"}, session=session).to_list()
    daily_stat = await DailyStats.find_one(filters, session=session)
    if not trades:
        if daily_stat is not None:
            await daily_stat.delete(session=session)
    else:
        values = {
            "total_pnl": sum(t.pnl for t in trades),
            "trade_count": len(trades),
            "winning_trades": sum(t.pnl > 0 for t in trades),
            "losing_trades": sum(t.pnl < 0 for t in trades),
            "largest_win": max((t.pnl for t in trades if t.pnl > 0), default=0.0),
            "largest_loss": min((t.pnl for t in trades if t.pnl < 0), default=0.0),
            "updated_at": datetime.now(),
        }
        if daily_stat is None:
            await DailyStats(**filters, **values).create(session=session)
        else:
            await daily_stat.update({"$set": values}, session=session)

    account = await Account.get(PydanticObjectId(account_id), session=session)
    if account is not None:
        updates = {"updated_at": datetime.now()}
        if stage_id is not None and 0 <= stage_id < len(account.stages):
            stage_trades = await Trade.find(
                {"account_id": account_id, "stage_id": stage_id, "status": "closed"},
                session=session,
            ).to_list()
            updates[f"stages.{stage_id}.current_pnl"] = sum(t.pnl for t in stage_trades)
            updates[f"stages.{stage_id}.days_traded"] = len({t.date for t in stage_trades})
        # Touch the account even for unassigned-stage trades. Concurrent writes
        # to the same account then conflict and retry together with their stats.
        await account.update({"$set": updates}, session=session)


async def refresh_affected_stats(scopes, session):
    for scope in dict.fromkeys(scope for scope in scopes if scope is not None):
        await update_daily_stats(*scope, session=session)


async def trade_transaction(operation):
    client = Trade.get_motor_collection().database.client
    async with await client.start_session() as session:
        return await session.with_transaction(
            operation,
            read_concern=ReadConcern("snapshot"),
            write_concern=WriteConcern("majority"),
            max_commit_time_ms=10_000,
        )


def failed(operation):
    logger.exception("Trade %s failed", operation)
    return HTTPException(500, f"Could not {operation} the trade. Please retry.")


@router.get("/trades", response_model=dict)
async def get_trades():
    try:
        return {"success": True, "data": serialize_docs(await Trade.find_all().to_list())}
    except Exception:
        logger.exception("Could not load trades")
        raise HTTPException(500, "Could not load trades. Please retry.")


@router.post("/trades", response_model=dict)
async def create_trade(trade: Trade):
    payload = trade.model_dump(exclude={"id", "revision_id"})

    async def create(session):
        # A fresh instance is essential when with_transaction retries a callback.
        created = Trade(**payload)
        await validate_trade_account(created, session)
        await created.create(session=session)
        await refresh_affected_stats([closed_scope(created)], session)
        return {"success": True, "data": serialize_doc(created)}

    try:
        return await trade_transaction(create)
    except HTTPException:
        raise
    except Exception:
        raise failed("create")


@router.get("/trades/{trade_id}", response_model=dict)
async def get_trade(trade_id: PydanticObjectId):
    try:
        trade = await Trade.get(trade_id)
        if trade is None:
            raise HTTPException(404, "Trade not found")
        return {"success": True, "data": serialize_doc(trade)}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Could not load trade")
        raise HTTPException(500, "Could not load the trade. Please retry.")


@router.put("/trades/{trade_id}", response_model=dict)
async def update_trade(trade_id: PydanticObjectId, trade_data: dict):
    editable = set(Trade.model_fields) - {"id", "revision_id", "created_at", "updated_at"}
    if set(trade_data) - editable:
        raise HTTPException(422, "The trade update contains unsupported fields")

    async def update(session):
        original = await Trade.get(trade_id, session=session)
        if original is None:
            raise HTTPException(404, "Trade not found")
        before = closed_scope(original)
        try:
            updated = Trade.model_validate({**original.model_dump(), **trade_data, "updated_at": datetime.now()})
        except ValidationError as exc:
            raise HTTPException(422, [
                {"loc": error["loc"], "msg": error["msg"], "type": error["type"]}
                for error in exc.errors()
            ])
        await validate_trade_account(updated, session)
        await updated.replace(session=session)
        await refresh_affected_stats([before, closed_scope(updated)], session)
        return {"success": True, "data": serialize_doc(updated)}

    try:
        return await trade_transaction(update)
    except HTTPException:
        raise
    except Exception:
        raise failed("update")


@router.delete("/trades/{trade_id}", response_model=dict)
async def delete_trade(trade_id: PydanticObjectId):
    async def delete(session):
        trade = await Trade.get(trade_id, session=session)
        if trade is None:
            raise HTTPException(404, "Trade not found")
        before = closed_scope(trade)
        await trade.delete(session=session)
        await refresh_affected_stats([before], session)
        return {"success": True, "data": {"id": str(trade_id)}}

    try:
        return await trade_transaction(delete)
    except HTTPException:
        raise
    except Exception:
        raise failed("delete")
