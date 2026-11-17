"""Integration tests against a dedicated local MongoDB replica set.

TEST_MONGODB_URI defaults to localhost:27018 with replicaSet=tradevault-tests.
Every test uses its own temporary database. Remote hosts are refused.
"""

import asyncio
import os
import unittest
import uuid
from urllib.parse import urlparse
from unittest.mock import patch

from beanie import PydanticObjectId, init_beanie
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.account import Account, Stage
from app.models.daily_stats import DailyStats
from app.models.prop_firm import PropFirm
from app.models.trade import Trade
from app.routers import trades as routes


class TradeStatisticsTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        uri = os.getenv('TEST_MONGODB_URI', 'mongodb://127.0.0.1:27018/?replicaSet=tradevault-tests')
        if urlparse(uri).hostname not in {'127.0.0.1', 'localhost', '::1'}:
            raise RuntimeError('Tests refuse remote databases')
        self.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10_000)
        self.database_name = 'tradevault_test_' + uuid.uuid4().hex
        self.database = self.client[self.database_name]
        await init_beanie(self.database, document_models=[PropFirm, Account, Trade, DailyStats])
        self.accounts = []
        for name in ['First', 'Second']:
            account = Account(firm_id=str(PydanticObjectId()), plan_name=name, account_size=10_000, stages=[
                Stage(name='Phase 1', profit_target=1000, max_loss=500, max_daily_loss=200),
                Stage(name='Phase 2', profit_target=500, max_loss=500, max_daily_loss=200),
            ])
            await account.create()
            self.accounts.append(account)

    async def asyncTearDown(self):
        await self.client.drop_database(self.database_name)
        self.client.close()

    async def create(self, *, account=None, stage=0, date='2026-11-15', pnl=100, status='closed'):
        account = account or self.accounts[0]
        result = await routes.create_trade(Trade(
            account_id=str(account.id), stage_id=stage, date=date, instrument='EURUSD',
            direction='long', entry_price=1.1, size=1, pnl=pnl, status=status,
        ))
        return PydanticObjectId(result['data']['id'])

    async def daily(self, account=None, stage=0, date='2026-11-15'):
        return await DailyStats.find_one({
            'account_id': str((account or self.accounts[0]).id), 'stage_id': stage, 'date': date,
        })

    async def assert_stage(self, account=None, stage=0, pnl=0, days=0):
        saved = await Account.get((account or self.accounts[0]).id)
        self.assertEqual(saved.stages[stage].current_pnl, pnl)
        self.assertEqual(saved.stages[stage].days_traded, days)

    async def test_closed_pnl_edit_recalculates_without_status_change(self):
        winner = await self.create(pnl=100)
        await self.create(pnl=-40)
        await routes.update_trade(winner, {'pnl': 250})
        daily = await self.daily()
        self.assertEqual((daily.total_pnl, daily.trade_count, daily.winning_trades, daily.losing_trades), (210, 2, 1, 1))
        self.assertEqual((daily.largest_win, daily.largest_loss), (250, -40))
        await self.assert_stage(pnl=210, days=1)

    async def test_date_stage_and_account_moves_refresh_both_locations(self):
        trade = await self.create()
        await routes.update_trade(trade, {'date': '2026-11-16'})
        self.assertIsNone(await self.daily())
        self.assertEqual((await self.daily(date='2026-11-16')).total_pnl, 100)
        await self.assert_stage(pnl=100, days=1)
        await routes.update_trade(trade, {'stage_id': 1})
        self.assertIsNone(await self.daily(date='2026-11-16'))
        await self.assert_stage()
        await self.assert_stage(stage=1, pnl=100, days=1)
        await routes.update_trade(trade, {'account_id': str(self.accounts[1].id)})
        self.assertIsNone(await self.daily(stage=1, date='2026-11-16'))
        await self.assert_stage(stage=1)
        await self.assert_stage(self.accounts[1], stage=1, pnl=100, days=1)

    async def test_status_transitions_and_last_trade_deletion_remove_ghost_days(self):
        trade = await self.create()
        await routes.update_trade(trade, {'status': 'open', 'pnl': 0})
        self.assertIsNone(await self.daily())
        await self.assert_stage()
        await routes.update_trade(trade, {'status': 'closed', 'pnl': -25})
        self.assertEqual((await self.daily()).total_pnl, -25)
        await self.assert_stage(pnl=-25, days=1)
        await routes.update_trade(trade, {'status': 'cancelled'})
        self.assertIsNone(await self.daily())
        await self.assert_stage()
        await routes.update_trade(trade, {'status': 'closed', 'pnl': 50})
        await routes.delete_trade(trade)
        self.assertIsNone(await self.daily())
        await self.assert_stage()

    async def test_distinct_trading_days_and_break_even_counts(self):
        await self.create(pnl=0)
        other = await self.create(date='2026-11-16', pnl=40)
        daily = await self.daily()
        self.assertEqual((daily.trade_count, daily.winning_trades, daily.losing_trades), (1, 0, 0))
        await self.assert_stage(pnl=40, days=2)
        await routes.delete_trade(other)
        await self.assert_stage(pnl=0, days=1)

    async def test_failed_create_rolls_back_trade_and_statistics(self):
        with patch.object(routes, 'update_daily_stats', side_effect=RuntimeError('test failure')):
            with self.assertRaises(HTTPException) as error:
                await self.create()
        self.assertEqual(error.exception.status_code, 500)
        self.assertEqual(await Trade.count(), 0)
        self.assertEqual(await DailyStats.count(), 0)
        await self.assert_stage()

    async def test_failed_second_location_update_rolls_back_every_change(self):
        trade = await self.create()
        recalculate = routes.update_daily_stats
        calls = 0

        async def fail_second(*args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError('test failure after old bucket updated')
            return await recalculate(*args, **kwargs)

        with patch.object(routes, 'update_daily_stats', side_effect=fail_second):
            with self.assertRaises(HTTPException):
                await routes.update_trade(trade, {'date': '2026-11-16', 'pnl': 500})
        saved = await Trade.get(trade)
        self.assertEqual((saved.date, saved.pnl), ('2026-11-15', 100))
        self.assertEqual((await self.daily()).total_pnl, 100)
        self.assertIsNone(await self.daily(date='2026-11-16'))
        await self.assert_stage(pnl=100, days=1)

    async def test_failed_delete_rolls_back_the_deletion(self):
        trade = await self.create()
        with patch.object(routes, 'update_daily_stats', side_effect=RuntimeError('test failure')):
            with self.assertRaises(HTTPException):
                await routes.delete_trade(trade)
        self.assertIsNotNone(await Trade.get(trade))
        self.assertEqual((await self.daily()).total_pnl, 100)

    async def test_invalid_moves_and_payloads_leave_original_unchanged(self):
        trade = await self.create()
        for updates, status in [({'stage_id': -1}, 400), ({'account_id': 'missing'}, 400), ({'pnl': 'invalid'}, 422), ({'id': 'replace-id'}, 422)]:
            with self.assertRaises(HTTPException) as error:
                await routes.update_trade(trade, updates)
            self.assertEqual(error.exception.status_code, status)
            self.assertEqual((await Trade.get(trade)).pnl, 100)
        self.assertEqual((await self.daily()).total_pnl, 100)

    async def test_concurrent_trades_do_not_duplicate_daily_statistics(self):
        ids = await asyncio.gather(*(self.create(pnl=10) for _ in range(5)))
        self.assertEqual(len(set(ids)), 5)
        self.assertEqual(await DailyStats.count(), 1)
        daily = await self.daily()
        self.assertEqual((daily.total_pnl, daily.trade_count), (50, 5))
        await self.assert_stage(pnl=50, days=1)


if __name__ == '__main__':
    unittest.main()
