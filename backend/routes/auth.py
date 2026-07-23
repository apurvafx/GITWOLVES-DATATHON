from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

SECRET_KEY = "ksp_crimepilot_super_secret_key"
ALGORITHM = "HS256"

# Mock User Accounts with specific roles
MOCK_USERS = {
    "investigator": {
        "username": "investigator",
        "name": "Manjunath IO",
        "role": "Investigator",
        "kgid": "KGID-KA99102",
        "password": "password123"
    },
    "analyst": {
        "username": "analyst",
        "name": "Anitha Analyst",
        "role": "Analyst",
        "kgid": "KGID-KA99144",
        "password": "password123"
    },
    "supervisor": {
        "username": "supervisor",
        "name": "SP Raghavendra",
        "role": "Supervisor",
        "kgid": "KGID-KA99182",
        "password": "password123"
    },
    "policymaker": {
        "username": "policymaker",
        "name": "DGP Kiran Kumar",
        "role": "Policymaker",
        "kgid": "KGID-KA90001",
        "password": "password123"
    }
}

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    name: str
    role: str
    kgid: str
    token: str

def create_jwt_token(data: dict, expires_delta: timedelta = timedelta(hours=8)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest):
    user = MOCK_USERS.get(request.username.lower())
    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    token_data = {
        "sub": user["username"],
        "role": user["role"],
        "kgid": user["kgid"],
        "name": user["name"]
    }
    token = create_jwt_token(token_data)
    
    return {
        "username": user["username"],
        "name": user["name"],
        "role": user["role"],
        "kgid": user["kgid"],
        "token": token
    }

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
