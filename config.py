import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "StockSense AI"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    LOG_LEVEL: str = "INFO"
    FRONTEND_URL: str = Field(default="http://localhost:5173", env="FRONTEND_URL")

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # Supabase
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = Field(..., env="SUPABASE_SERVICE_KEY")

    # Cache (Upstash Redis)
    UPSTASH_REDIS_REST_URL: str = Field(..., env="UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN: str = Field(..., env="UPSTASH_REDIS_REST_TOKEN")

    # AI APIs
    GROQ_API_KEY: str = Field(..., env="GROQ_API_KEY")
    GOOGLE_API_KEY: str = Field(..., env="GOOGLE_API_KEY")

    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(..., env="TELEGRAM_BOT_TOKEN")
    TELEGRAM_PERSONAL_CHAT_ID: str = Field(..., env="TELEGRAM_PERSONAL_CHAT_ID")

    # Budget Guards (USD)
    BUDGET_PER_USER_DAILY_USD: float = 0.05
    BUDGET_PLATFORM_DAILY_USD: float = 10.0

    # Market Thresholds (Layer 1)
    US_PRICE_MIN: float = 1.0
    NGX_PRICE_MIN: float = 10.0
    MIN_VOLUME_RATIO: float = 0.5  # 50% of average
    MIN_MOMENTUM_US: float = 1.5   # 1.5%
    MIN_MOMENTUM_NGX: float = 1.0  # 1.0%

    # NGX Data Ingestion
    NGX_DATA_API_URL: Optional[str] = Field(default=None, env="NGX_DATA_API_URL")
    NGX_PRIMARY_SOURCE: str = Field(default="ngx_official", env="NGX_PRIMARY_SOURCE")
    NGX_FALLBACK_SOURCE: str = Field(default="africanfinancials", env="NGX_FALLBACK_SOURCE")
    NGX_SOURCE_TIMEOUT_SECONDS: int = Field(default=15, env="NGX_SOURCE_TIMEOUT_SECONDS")
    NGX_SOURCE_RETRY_COUNT: int = Field(default=2, env="NGX_SOURCE_RETRY_COUNT")

    # Payments (Paystack)
    PAYSTACK_SECRET_KEY: str = Field("sk_test_mock", env="PAYSTACK_SECRET_KEY")
    PAYSTACK_PUBLIC_KEY: str = Field("pk_test_mock", env="PAYSTACK_PUBLIC_KEY")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def REDIS_URL(self) -> str:
        """Construct Redis URL for rate limiting. Use Upstash in production, memory in dev."""
        if self.is_production:
            # Format: https://default:<token>@<host>:<port>
            # Upstash REST endpoint is like: https://xxxxx.upstash.io
            # For slowapi, we can use the token-based URL
            base = self.UPSTASH_REDIS_REST_URL.replace("https://", "").rstrip("/")
            return f"redis://default:{self.UPSTASH_REDIS_REST_TOKEN}@{base}:6379"
        return "memory://"

settings = Settings()
