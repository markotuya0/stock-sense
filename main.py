from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import structlog
import time

from config import settings
from routers import search, signals, analysis, payment, accuracy, portfolio, users, webhooks
from db.session import engine, Base
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limit import limiter

# Setup logger
log = structlog.get_logger()

# Initialize tables (Note: Use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockSense AI API", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Routes
# Auth router removed - Supabase handles authentication
# Keep router commented out in case needed for backward compatibility
# app.include_router(auth.router)
app.include_router(search.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")
app.include_router(analysis.router)
app.include_router(payment.router)
app.include_router(accuracy.router, prefix="/api/v1")
app.include_router(portfolio.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "StockSense AI API is online", "version": "0.2.0"}
