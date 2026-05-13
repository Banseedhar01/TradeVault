from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime

class DailyStats(Document):
    date: str
    account_id: str
    stage_id: Optional[int] = None
    total_pnl: float = 0.0
    trade_count: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "daily_stats"
        indexes = ["date", "account_id", ["date", "account_id"]]
        
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "account_id": "507f1f77bcf86cd799439011",
                "stage_id": 0,
                "total_pnl": 750.0,
                "trade_count": 3,
                "winning_trades": 2,
                "losing_trades": 1,
                "largest_win": 500.0,
                "largest_loss": -150.0
            }
        }