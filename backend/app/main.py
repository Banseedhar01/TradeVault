from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mangum import Mangum

from app.database import database
from app.routers import firms, accounts, trades, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect_db()
    yield
    await database.close_db()

app = FastAPI(
    title="TradeVault API",
    description="Personal prop trading dashboard API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "https://tradevault-sexf.onrender.com",
        "https://trade-vault-six.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(firms.router, prefix="/api", tags=["firms"])
app.include_router(accounts.router, prefix="/api", tags=["accounts"])
app.include_router(trades.router, prefix="/api", tags=["trades"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])

@app.get("/health")
async def health_check():
    return {"success": True, "data": {"status": "healthy"}}

handler = Mangum(app)