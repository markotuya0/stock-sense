# StockSense — SECURITY.md
## Complete Security Reference for Development

> Read this before writing any auth, payment, or database code.
> Every rule here exists because the alternative causes real damage.

---

## Table of Contents

1. [Authentication Edge Cases](#1-authentication-edge-cases)
2. [JWT Token Security](#2-jwt-token-security)
3. [SQL Injection Prevention](#3-sql-injection-prevention)
4. [Input Validation Rules](#4-input-validation-rules)
5. [Paystack Payment Security](#5-paystack-payment-security)
6. [Rate Limiting — Every Endpoint](#6-rate-limiting)
7. [CORS and Headers](#7-cors-and-headers)
8. [Data Access Control](#8-data-access-control)
9. [AI Hallucination Guards](#9-ai-hallucination-guards)
10. [Secrets Management](#10-secrets-management)
11. [Error Handling Standards](#11-error-handling-standards)
12. [Pre-Launch Checklist](#12-pre-launch-checklist)

---

## 1. Authentication Edge Cases

### Every case must be handled explicitly

```python
# CASE 1: Login with email that doesn't exist
# ❌ WRONG — reveals which emails are registered
if not user:
    raise HTTPException(404, "Email not found")  # NEVER DO THIS

# ✅ CORRECT — same error for both wrong email AND wrong password
if not user or not verify_password(password, user.password_hash):
    raise HTTPException(401, "Invalid credentials")  # identical message

# TIMING ATTACK PREVENTION
# If user doesn't exist, bcrypt check is skipped — that's faster
# An attacker can time requests to detect valid emails
# Fix: always run bcrypt even when user doesn't exist
DUMMY_HASH = "$2b$12$dummy.hash.that.never.matches.any.real.password.123"
if not user:
    verify_password(password, DUMMY_HASH)  # waste the same time
    raise HTTPException(401, "Invalid credentials")

# CASE 2: Unverified email tries to login
if not user.is_verified:
    raise HTTPException(403, "Please verify your email before logging in")
    # Include: resend link option in response

# CASE 3: Banned/inactive user tries to login
if not user.is_active:
    raise HTTPException(403, "Account suspended. Contact support.")
    # Do NOT say "your account was banned" — say "contact support"

# CASE 4: Google OAuth user tries email login
if user and not user.password_hash:
    raise HTTPException(400, "This account uses Google sign-in. Click 'Sign in with Google'.")

# CASE 5: Email user tries Google OAuth with same email
# → Link accounts: add google_id to existing user, don't create duplicate
if existing_user and not existing_user.google_id:
    existing_user.google_id = google_sub
    db.commit()
    # Return tokens for existing user

# CASE 6: Verification link expired (>24 hours)
if token_data.expires_at < datetime.utcnow():
    raise HTTPException(400, "Verification link expired. Request a new one.")

# CASE 7: Verification link used twice
if token_record.used_at is not None:
    raise HTTPException(400, "This link has already been used.")

# CASE 8: Password reset while already logged in
# Allow it — user may have forgotten password and is logged in via refresh token
# But: invalidate ALL refresh tokens for this user after successful reset

# CASE 9: Admin deletes user while user is logged in
# Access tokens valid until 15min expiry — this is acceptable
# After expiry, middleware checks is_active=True → 403
# Don't try to invalidate all JWTs — it's complex and the 15min window is fine

# CASE 10: User signs up with already-registered email
# ❌ WRONG: raise HTTPException(409, "Email already registered")
# This tells attackers which emails exist in the system
# ✅ CORRECT: Return 201 with same message as successful signup
# Send "If this email is not registered, check your inbox" message
# (Same response either way — no information leakage)
```

---

## 2. JWT Token Security

### Token design rules

```python
# Access Token: 15 minutes, stored in memory only (never localStorage)
# Refresh Token: 30 days, stored as HttpOnly cookie, hashed in database

# CRITICAL: Store refresh token HASH in DB, not the token itself
# If DB is compromised, attacker can't use hashed tokens
import hashlib, secrets

def create_and_store_refresh_token(user_id: str, db) -> str:
    raw_token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    # Store hash in DB
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=30),
    ))
    db.commit()
    
    # Return raw token to client (never stored)
    return raw_token

def verify_refresh_token(raw_token: str, db) -> RefreshToken | None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.utcnow(),
    ).first()

# Set refresh token as HttpOnly cookie
def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,           # JavaScript cannot read this
        secure=True,             # HTTPS only
        samesite="strict",       # CSRF protection
        max_age=30 * 24 * 3600,  # 30 days in seconds
        path="/auth/refresh",    # Only sent to this endpoint
    )

# SECRET_KEY requirements
# Must be: secrets.token_hex(32)  — 64 character hex string
# Must NOT be: "my_secret", "password", any dictionary word
# Generate once: python -c "import secrets; print(secrets.token_hex(32))"
# Store in .env — never in code
```

---

## 3. SQL Injection Prevention

### The rule: NEVER raw SQL with user input

```python
# ❌ NEVER — SQL injection vulnerability
user_input = "admin'--"
query = f"SELECT * FROM users WHERE email = '{user_input}'"
# This executes: SELECT * FROM users WHERE email = 'admin'--'
# Returns ALL users — complete data breach

# ❌ NEVER — even with % formatting
query = "SELECT * FROM users WHERE email = '%s'" % user_email

# ✅ ALWAYS — SQLAlchemy ORM (injection impossible)
user = db.query(User).filter(User.email == user_email).first()

# ✅ IF you ever need raw SQL — use parameterised text()
from sqlalchemy import text
result = db.execute(
    text("SELECT id FROM users WHERE email = :email"),
    {"email": user_email}  # parameter binding — never string interpolation
)

# Database user permissions (set this in Supabase/PostgreSQL)
# The app user should have: SELECT, INSERT, UPDATE only
# NEVER: DROP, CREATE, TRUNCATE, ALTER
# This limits damage even if injection somehow occurs

# CI check — add this to deploy.yml to catch raw SQL
# grep -rn "f\"SELECT\|f\"INSERT\|f\"UPDATE\|f\"DELETE" . && exit 1
```

---

## 4. Input Validation Rules

### Every field has explicit constraints

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal, Optional
import re

class SignupRequest(BaseModel):
    email:     EmailStr                    # validates format
    password:  str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=100)

    @field_validator("password")
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("full_name")
    def name_sanitise(cls, v: str) -> str:
        # Prevent XSS via name field
        if re.search(r"[<>\"'\\x00-\\x1f]", v):
            raise ValueError("Name contains invalid characters")
        return v.strip()

class TradeRequest(BaseModel):
    symbol:   str      = Field(min_length=1, max_length=20, pattern=r"^[A-Z0-9.]+$")
    action:   Literal["BUY", "SELL"]
    quantity: float    = Field(gt=0, le=1_000_000)
    price:    float    = Field(gt=0, le=100_000_000)  # max ₦100M per unit
    platform: Optional[str] = Field(None, max_length=50)

class SearchRequest(BaseModel):
    q:     str = Field(min_length=1, max_length=50)
    limit: int = Field(default=10, ge=1, le=20)

class WatchlistRequest(BaseModel):
    symbol:   str = Field(min_length=1, max_length=20, pattern=r"^[A-Z0-9.]+$")
    market:   Literal["us", "ng", "crypto"]
    exchange: Optional[Literal["NYSE", "NASDAQ", "NGX"]] = None

class PriceAlertRequest(BaseModel):
    symbol:       str   = Field(min_length=1, max_length=20, pattern=r"^[A-Z0-9.]+$")
    market:       Literal["us", "ng"]
    condition:    Literal["above", "below"]
    target_price: float = Field(gt=0, le=100_000_000)
    currency:     Literal["NGN", "USD"] = "NGN"

# External data from APIs must also be validated
class StockDataInput(BaseModel):
    symbol:       str
    price:        float = Field(gt=0, le=500_000)   # >₦500k is suspicious
    change_pct:   float = Field(ge=-100, le=1000)   # -100% to +1000%
    volume:       Optional[float] = Field(None, ge=0)
    rsi:          Optional[float] = Field(None, ge=0, le=100)
    market:       Literal["us", "ng", "crypto"]
```

---

## 5. Paystack Payment Security

### Rules that must never be broken

```python
# RULE 1: ALWAYS verify webhook signature before processing
def verify_paystack_signature(payload: bytes, signature: str) -> bool:
    import hashlib, hmac
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        payload,
        hashlib.sha512,
    ).hexdigest()
    # Use compare_digest to prevent timing attacks
    return hmac.compare_digest(expected, signature)

# RULE 2: ALWAYS check idempotency before processing
# Paystack retries webhooks — same event can arrive multiple times
existing = db.query(PaymentEvent).filter(
    PaymentEvent.gateway_event_id == reference
).first()
if existing:
    return  # Already processed — NEVER process twice

# RULE 3: ALWAYS verify amount before activating subscription
EXPECTED_AMOUNTS_KOBO = {
    "pro_monthly":        1299900,
    "pro_annual":         11699900,
    "enterprise_monthly": 4999900,
    "enterprise_annual":  44999900,
}
actual_amount = data.get("amount", 0)
if actual_amount not in EXPECTED_AMOUNTS_KOBO.values():
    log.error("Amount mismatch — possible fraud attempt", actual=actual_amount)
    return  # Do NOT activate

# RULE 4: NEVER upgrade tier from callback URL alone
# The callback URL redirect is for UX only — not proof of payment
# Only activate subscription from webhook
# Frontend: show "Payment received — activating..." and poll /billing/status

# RULE 5: ALWAYS save email_token from subscription.create
# Without it, you CANNOT cancel via API — only via Paystack Dashboard manually
if not data.get("email_token"):
    log.error("CRITICAL: email_token missing from subscription.create",
              subscription_code=data.get("subscription_code"))

# RULE 6: Paystack amounts are in KOBO (not Naira)
# ₦12,999 = 1,299,900 kobo
# ALWAYS: amount_in_naira * 100 = amount_in_kobo
# NEVER: pass Naira directly to Paystack API

# RULE 7: Test keys vs Live keys
# sk_test_xxx → test environment only, test cards only
# sk_live_xxx → production only, real money
# NEVER use live keys in development
# NEVER commit either key to git

# EDGE CASE: Webhook arrives before DB transaction completes
# Solution: retry 3 times with 500ms delay before giving up
# Return 200 to Paystack — they will retry for 72 hours

# EDGE CASE: subscription.disable arrives but no matching subscription in DB
# Solution: log and return 200 — don't crash
# This can happen if webhook fires before subscription.create was processed
```

---

## 6. Rate Limiting

### Per-endpoint limits with slowapi

```python
# middleware/rate_limit.py

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
    default_limits=["100/minute"],
)

# Apply to specific endpoints:
# @limiter.limit("5/15minutes")   → POST /auth/login
# @limiter.limit("3/hour")        → POST /auth/signup
# @limiter.limit("3/hour")        → POST /auth/forgot-password
# @limiter.limit("60/minute")     → GET /signals
# @limiter.limit("5/hour")        → POST /billing/checkout
# @limiter.limit("3/day")         → POST /analysis/start (Pro users only)
```

### Rate limit table

| Endpoint | Limit | Window | Reason |
|---|---|---|---|
| POST /auth/login | 5 | per IP / 15 min | Brute force |
| POST /auth/signup | 3 | per IP / hour | Fake accounts |
| POST /auth/forgot-password | 3 | per email / hour | Email bombing |
| POST /auth/reset-password | 3 | per token | Token brute force |
| GET /auth/google | 10 | per IP / hour | OAuth abuse |
| GET /signals | 60 | per user / min | Scraping |
| POST /analysis/start | 3 | per user / day (Pro) | Cost control |
| POST /billing/checkout | 5 | per user / hour | Duplicate sessions |
| POST /billing/webhook | 1000 | per gateway IP / min | Legitimate webhooks |
| All other GET | 100 | per user / min | General protection |

---

## 7. CORS and Headers

```python
# Only allow your actual frontend domain
# NEVER: allow_origins=["*"]

ALLOWED_ORIGINS = [
    "https://stocksense.app",
    "https://www.stocksense.app",
]
if not settings.is_production:
    ALLOWED_ORIGINS.extend(["http://localhost:5173"])

# Security headers applied to every response:
"Strict-Transport-Security": "max-age=31536000; includeSubDomains"
"X-Content-Type-Options": "nosniff"
"X-Frame-Options": "DENY"
"X-XSS-Protection": "1; mode=block"
"Content-Security-Policy": "default-src 'self'"
"Referrer-Policy": "strict-origin-when-cross-origin"
"Permissions-Policy": "geolocation=(), microphone=(), camera=()"
# Remove Server and X-Powered-By headers (tech stack exposure)
```

---

## 8. Data Access Control

### Ownership checks — users can only see their own data

```python
# ❌ VULNERABLE — no ownership check
@router.delete("/portfolio/{holding_id}")
async def delete(holding_id: str, db=Depends(get_db)):
    holding = db.query(PortfolioHolding).filter_by(id=holding_id).first()
    db.delete(holding)  # ANY user can delete ANY holding!

# ✅ CORRECT — filter by both id AND user_id
@router.delete("/portfolio/{symbol}")
async def delete(
    symbol: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.symbol == symbol,
        PortfolioHolding.user_id == user.id,  # ownership enforced
    ).first()
    if not holding:
        raise HTTPException(404, "Not found")
        # Return 404 for BOTH "not found" and "not yours"
        # Never return 403 — this reveals the resource exists

# Apply this pattern to:
# portfolio_holdings, trades, watchlists, price_alerts, analysis_reports
# ALWAYS filter by user_id when querying user-owned data
```

---

## 9. AI Hallucination Guards

```python
# Layer 1 — Parse JSON from AI response
def parse_ai_response(raw: str) -> dict:
    if not raw or not raw.strip():
        raise ValueError("Empty AI response")
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1:
        raise ValueError("No JSON found in AI response")
    return json.loads(cleaned[start:end])

# Layer 2 — Pydantic schema validation
class AISignalResponse(BaseModel):
    signal:       Literal["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
    score:        float = Field(ge=0.1, le=9.9)
    price_target: float = Field(gt=0)
    confidence:   float = Field(ge=0.1, le=0.99)
    risk_score:   int   = Field(ge=1, le=10)

    @field_validator("score")
    def score_not_perfect(cls, v):
        if v == 10.0:
            raise ValueError("Score of 10.0 not allowed — no asset is perfect")
        return v

# Layer 3 — Business logic sanity checks
def sanity_check(signal: AISignalResponse, current_price: float) -> None:
    max_target = current_price * 2.0   # never >100% upside
    min_target = current_price * 0.4   # never >60% downside
    if signal.price_target > max_target:
        signal.price_target = max_target
        signal.score = min(signal.score, 6.0)
    if signal.price_target < min_target:
        signal.price_target = min_target
    # Recalculate upside_pct from actual numbers (don't trust AI's math)
    signal.upside_pct = round(
        (signal.price_target - current_price) / current_price * 100, 2
    )

# Banned phrases in AI output — reject if found
BANNED_PHRASES = [
    "guaranteed", "will definitely", "certain to rise",
    "cannot fail", "no risk", "100% accurate", "impossible to lose"
]
def check_banned_phrases(text: str) -> None:
    for phrase in BANNED_PHRASES:
        if phrase.lower() in text.lower():
            raise ValueError(f"AI used banned certainty phrase: '{phrase}'")
```

---

## 10. Secrets Management

### Non-negotiable rules

```
1. NEVER hardcode any secret in any file
   ❌ API_KEY = "sk_live_abc123"
   ✅ API_KEY = settings.PAYSTACK_SECRET_KEY

2. NEVER commit .env to git
   .env must be in .gitignore
   Verify: git status (should not show .env)

3. NEVER log secrets
   ❌ log.info("Using key", key=settings.PAYSTACK_SECRET_KEY)
   ✅ log.info("Paystack configured", has_key=bool(settings.PAYSTACK_SECRET_KEY))

4. SECRET_KEY generation
   python -c "import secrets; print(secrets.token_hex(32))"
   Must be 64 chars minimum. Must be random. Must not be a word.

5. Paystack test vs live keys
   NEVER use sk_live_ in development
   NEVER use sk_test_ in production
   Environment check: settings.ENVIRONMENT == "production"

6. Rotate keys every 90 days in production
   Update in .env (local) AND in Render/GitHub Secrets (production)
   Revoke old keys immediately after rotation

7. GitHub Secrets for CI/CD
   Never put secrets in workflow YAML files
   Always use ${{ secrets.SECRET_NAME }}
```

---

## 11. Error Handling Standards

```python
# Global exception handler
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    log.error("Unhandled exception",
              path=request.url.path,
              method=request.method,
              error=str(exc),
              traceback=traceback.format_exc())
    # NEVER return internal error details to client
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred. Please try again."}
    )

# HTTP status codes — use consistently
# 200 OK           — success
# 201 Created      — resource created
# 400 Bad Request  — client sent invalid data
# 401 Unauthorized — not logged in or token expired
# 403 Forbidden    — logged in but not allowed
# 404 Not Found    — resource doesn't exist OR doesn't belong to user
# 409 Conflict     — duplicate (e.g., already in watchlist)
# 422 Unprocessable — Pydantic validation failed
# 429 Too Many     — rate limit hit
# 500 Server Error — our bug
# 503 Unavailable  — dependency down

# Error response format — always consistent
{
    "error": "human-readable message",
    "code":  "MACHINE_READABLE_CODE",
    "details": {}  # optional, only for 422 validation errors
}
```

---

## 12. Pre-Launch Security Checklist

Run through every item before going live:

- [ ] SECRET_KEY is 64-char random hex — NOT a word or phrase
- [ ] DATABASE_URL password is strong and random
- [ ] All secrets are in `.env` or Render environment — zero secrets in code
- [ ] `.env` is in `.gitignore` — verified with `git status`
- [ ] Paystack webhook signature verification tested with real event
- [ ] PAYSTACK_SECRET_KEY is `sk_live_` (not `sk_test_`) in production
- [ ] CORS only allows stocksense.app domain — no wildcard `*`
- [ ] Rate limits tested — login blocks after 5 attempts
- [ ] Admin routes tested — return 403 for non-admin users
- [ ] Ownership test: user A cannot access user B's portfolio
- [ ] SQL injection test: `'; DROP TABLE users; --` in search → 422 not 500
- [ ] HTTPS enforced — HTTP redirects to HTTPS
- [ ] Security headers present — verify at securityheaders.com
- [ ] Error messages show generic text — no stack traces to users
- [ ] Budget guards active — `BUDGET_PLATFORM_DAILY_USD` set
- [ ] All environment variables present — app starts without errors
- [ ] `pytest tests/ -v` passes 100% before deploy

---

*StockSense SECURITY.md — v1.0.0*
