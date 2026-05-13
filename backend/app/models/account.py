from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime

class Stage(BaseModel):
    name: str
    status: Literal["pending", "in_progress", "passed", "failed", "live"] = "pending"
    profit_target: float
    max_loss: float
    max_daily_loss: float
    min_trading_days: int = 0
    profit_split: float = 80.0
    on_demand_payout: bool = False
    current_pnl: float = 0.0
    daily_loss_used: float = 0.0
    days_traded: int = 0
    created_at: datetime = Field(default_factory=datetime.now)

class Account(Document):
    firm_id: str
    plan_name: str
    account_size: float
    platform: str = ""
    leverage: str = "1:100"
    current_stage: int = 0
    stages: List[Stage] = []
    fees: Optional[float] = None
    start_date: Optional[str] = None
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "accounts"
        
    class Config:
        json_schema_extra = {
            "example": {
                "firm_id": "507f1f77bcf86cd799439011",
                "plan_name": "FTMO Standard",
                "account_size": 100000.0,
                "platform": "MT4",
                "leverage": "1:100",
                "current_stage": 1,
                "stages": [
                    {
                        "name": "Phase 1",
                        "status": "passed",
                        "profit_target": 10000.0,
                        "max_loss": 10000.0,
                        "max_daily_loss": 5000.0,
                        "min_trading_days": 4,
                        "profit_split": 80.0,
                        "current_pnl": 10500.0
                    }
                ]
            }
        }