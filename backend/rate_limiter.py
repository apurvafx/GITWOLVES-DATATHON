import time
from collections import defaultdict
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, global_limit_requests: int = 100, global_limit_seconds: int = 60):
        super().__init__(app)
        # Store request timestamps per IP
        # Format: {ip: [timestamp1, timestamp2, ...]}
        self.request_history = defaultdict(list)
        self.login_history = defaultdict(list)
        self.global_limit_requests = global_limit_requests
        self.global_limit_seconds = global_limit_seconds

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Only rate limit API requests (ignore static assets, websocket routes like /ws/...)
        if not path.startswith("/api") or request.method == "OPTIONS":
            return await call_next(request)

        ip = request.client.host if request.client else "127.0.0.1"
        current_time = time.time()

        # Enforce rate limit on login route: max 5 attempts per 15 min (900s)
        if path == "/api/auth/login":
            login_window = 900
            login_limit = 5
            
            # Clean up older timestamps outside the 15-minute window
            self.login_history[ip] = [t for t in self.login_history[ip] if current_time - t < login_window]
            
            if len(self.login_history[ip]) >= login_limit:
                retry_after = int(login_window - (current_time - self.login_history[ip][0]))
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": f"Too many login attempts. Please try again in {retry_after} seconds."},
                    headers={"Retry-After": str(retry_after)}
                )
            
            # Record the login attempt
            self.login_history[ip].append(current_time)
        else:
            # Enforce global rate limit on other endpoints
            self.request_history[ip] = [t for t in self.request_history[ip] if current_time - t < self.global_limit_seconds]
            
            if len(self.request_history[ip]) >= self.global_limit_requests:
                retry_after = int(self.global_limit_seconds - (current_time - self.request_history[ip][0]))
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please slow down."},
                    headers={"Retry-After": str(retry_after)}
                )
            
            self.request_history[ip].append(current_time)

        return await call_next(request)
