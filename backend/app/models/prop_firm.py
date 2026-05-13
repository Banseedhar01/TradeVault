from beanie import Document
from pydantic import Field
from typing import Literal
from datetime import datetime

class PropFirm(Document):
    name: str
    market_type: Literal["forex", "futures"]
    platform: str
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "prop_firms"
        
    class Config:
        json_schema_extra = {
            "example": {
                "name": "FTMO",
                "market_type": "forex",
                "platform": "MT4",
                "notes": "Popular forex prop firm with good conditions"
            }
        }