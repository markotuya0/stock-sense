from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

log = structlog.get_logger()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 1. HSTS (Enforce HTTPS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # 2. Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 3. Prevent Clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # 4. Cross-Site Scripting (XSS) Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 5. Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 6. Basic Content Security Policy (Optional)
        # response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response
