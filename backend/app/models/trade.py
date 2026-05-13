from beanie import Document
from pydantic import Field
from typing import Literal, Optional
from datetime import datetime

class Trade(Document):
    account_id: str
    stage_id: Optional[int] = None
    date: str
    instrument: str
    direction: Literal["long", "short"]
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    size: float
    exit_price: Optional[float] = None
    pnl: float = 0.0
    status: Literal["open", "closed", "cancelled"] = "open"
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "trades"
        
    class Config:
        json_schema_extra = {
            "example": {
                "account_id": "507f1f77bcf86cd799439011",
                "stage_id": 0,
                "date": "2024-01-15",
                "instrument": "EURUSD",
                "direction": "long",
                "entry_price": 1.0950,
                "stop_loss": 1.0900,
                "take_profit": 1.1000,
                "size": 1.0,
                "exit_price": 1.0980,
                "pnl": 300.0,
                "status": "closed"
            }
        }