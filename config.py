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

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
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

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()
