"""
Security Middleware for Smart Menu API
- Rate Limiting (DDoS Protection)
- Request Validation
- Security Headers
- IP Blocking
"""

import time
import hashlib
from collections import defaultdict
from typing import Dict, Callable, Optional
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os
import re

# ============================================================
# Rate Limiter
# ============================================================

class RateLimiter:
    """
    In-memory rate limiter with sliding window algorithm.
    For production, consider using Redis for distributed rate limiting.
    """

    def __init__(self):
        # Store: {identifier: [(timestamp, count), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        # Blocked IPs (temporary blocks)
        self.blocked_ips: Dict[str, float] = {}
        # Permanent blocklist (load from env or config)
        self.permanent_blocklist = set(
            os.getenv("BLOCKED_IPS", "").split(",")
        )

    def _clean_old_requests(self, identifier: str, window_seconds: int):
        """Remove requests older than the window"""
        current_time = time.time()
        self.requests[identifier] = [
            (ts, count) for ts, count in self.requests[identifier]
            if current_time - ts < window_seconds
        ]

    def is_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        # Check permanent blocklist
        if ip in self.permanent_blocklist:
            return True

        # Check temporary blocks
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            else:
                # Block expired, remove it
                del self.blocked_ips[ip]

        return False

    def block_ip(self, ip: str, duration_seconds: int = 3600):
        """Temporarily block an IP"""
        self.blocked_ips[ip] = time.time() + duration_seconds
        print(f"🚫 IP blocked: {ip} for {duration_seconds}s")

    def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit.

        Returns:
            (is_allowed, remaining_requests, retry_after_seconds)
        """
        current_time = time.time()

        # Clean old requests
        self._clean_old_requests(identifier, window_seconds)

        # Count requests in current window
        total_requests = sum(count for _, count in self.requests[identifier])

        if total_requests >= max_requests:
            # Calculate retry-after
            if self.requests[identifier]:
                oldest = min(ts for ts, _ in self.requests[identifier])
                retry_after = int(window_seconds - (current_time - oldest)) + 1
            else:
                retry_after = window_seconds
            return False, 0, retry_after

        # Add current request
        self.requests[identifier].append((current_time, 1))
        remaining = max_requests - total_requests - 1

        return True, remaining, 0


# Global rate limiter instance
rate_limiter = RateLimiter()


# ============================================================
# Rate Limit Configurations
# ============================================================

# Different rate limits for different endpoints
RATE_LIMITS = {
    # Authentication endpoints (strict)
    "/api/auth": {"requests": 10, "window": 60},  # 10 per minute
    "/api/login": {"requests": 5, "window": 60},   # 5 per minute

    # AI endpoints (expensive operations)
    "/api/image": {"requests": 20, "window": 60},  # 20 per minute
    "/api/translate": {"requests": 30, "window": 60},  # 30 per minute
    "/api/enhance": {"requests": 10, "window": 60},  # 10 per minute

    # Payment endpoints (strict)
    "/api/payment": {"requests": 10, "window": 60},  # 10 per minute
    "/api/stripe": {"requests": 20, "window": 60},   # 20 per minute

    # General API endpoints
    "/api/menu": {"requests": 60, "window": 60},   # 60 per minute
    "/api/orders": {"requests": 100, "window": 60}, # 100 per minute

    # Default for all other endpoints
    "default": {"requests": 100, "window": 60},    # 100 per minute
}


def get_rate_limit_for_path(path: str) -> dict:
    """Get rate limit config for a given path"""
    for prefix, config in RATE_LIMITS.items():
        if prefix != "default" and path.startswith(prefix):
            return config
    return RATE_LIMITS["default"]


# ============================================================
# Security Headers
# ============================================================

SECURITY_HEADERS = {
    # Prevent clickjacking
    "X-Frame-Options": "DENY",

    # Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    # Enable XSS filter
    "X-XSS-Protection": "1; mode=block",

    # Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    # Permissions policy (restrict browser features)
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",

    # Cache control for API responses
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


# ============================================================
# Input Sanitization
# ============================================================

# Patterns that might indicate malicious input
SUSPICIOUS_PATTERNS = [
    r'<script[^>]*>',           # XSS script tags
    r'javascript:',              # JavaScript protocol
    r'on\w+\s*=',               # Event handlers (onclick, onerror, etc.)
    r'data:text/html',          # Data URLs
    r'<!--.*-->',               # HTML comments (could hide malicious code)
    r'\x00',                    # Null bytes
    r'\.\./',                   # Path traversal
    r'%2e%2e%2f',              # URL encoded path traversal
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in SUSPICIOUS_PATTERNS]


def sanitize_input(value: str) -> str:
    """Basic input sanitization"""
    if not isinstance(value, str):
        return value

    # Check for suspicious patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(value):
            # Log and clean
            print(f"⚠️ Suspicious input detected: {value[:100]}...")
            value = pattern.sub('', value)

    # Remove null bytes
    value = value.replace('\x00', '')

    return value


def is_suspicious_request(request: Request, body: bytes) -> bool:
    """Check if request looks suspicious"""
    # Check for extremely large payloads
    if len(body) > 10 * 1024 * 1024:  # 10MB
        return True

    # Check body content for suspicious patterns
    try:
        body_str = body.decode('utf-8', errors='ignore')
        for pattern in COMPILED_PATTERNS:
            if pattern.search(body_str):
                return True
    except:
        pass

    return False


# ============================================================
# Rate Limiting Middleware
# ============================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check if IP is blocked
        if rate_limiter.is_blocked(client_ip):
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Access denied",
                    "message": "Your IP has been temporarily blocked due to suspicious activity"
                }
            )

        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health", "/api/health"]:
            response = await call_next(request)
            return response

        # Get rate limit config for this path
        config = get_rate_limit_for_path(request.url.path)

        # Create identifier (IP + path prefix for better granularity)
        path_prefix = "/".join(request.url.path.split("/")[:3])
        identifier = f"{client_ip}:{path_prefix}"

        # Check rate limit
        is_allowed, remaining, retry_after = rate_limiter.check_rate_limit(
            identifier,
            config["requests"],
            config["window"]
        )

        if not is_allowed:
            # Log rate limit hit
            print(f"⚠️ Rate limit exceeded: {client_ip} on {request.url.path}")

            # If they hit rate limit too many times, block them temporarily
            block_identifier = f"block_count:{client_ip}"
            rate_limiter.requests[block_identifier].append((time.time(), 1))
            block_count = sum(c for _, c in rate_limiter.requests[block_identifier])

            if block_count > 10:  # More than 10 rate limit hits
                rate_limiter.block_ip(client_ip, duration_seconds=3600)  # Block for 1 hour

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Please try again in {retry_after} seconds.",
                    "retry_after": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(config["requests"]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after)
                }
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(config["requests"])
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + config["window"])

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get real client IP, considering proxies"""
        # Check X-Forwarded-For header (set by proxies/load balancers)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP (original client)
            return forwarded.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        if request.client:
            return request.client.host

        return "unknown"


# ============================================================
# Security Headers Middleware
# ============================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value

        # Add request ID for tracing
        request_id = hashlib.md5(
            f"{time.time()}{request.client.host if request.client else 'unknown'}".encode()
        ).hexdigest()[:12]
        response.headers["X-Request-ID"] = request_id

        return response


# ============================================================
# Health Check Endpoint
# ============================================================

def add_health_check(app):
    """Add health check endpoint for monitoring"""

    @app.get("/health", tags=["System"])
    @app.get("/api/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "service": "smart-menu-api"
        }


# ============================================================
# Setup Function
# ============================================================

def setup_security(app):
    """Setup all security middleware"""

    # Add rate limiting
    app.add_middleware(RateLimitMiddleware)

    # Add security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Add health check
    add_health_check(app)

    print("✅ Security middleware configured:")
    print("   - Rate limiting enabled")
    print("   - Security headers enabled")
    print("   - Health check endpoint added")
