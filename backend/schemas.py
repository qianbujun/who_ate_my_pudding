from pydantic import BaseModel
from typing import List, Optional
import datetime

class UserCreate(BaseModel):
    invite_code: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class GameActionBase(BaseModel):
    action_type: str
    detail: str
    ap_cost: int

class GameActionResponse(GameActionBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class GameSessionResponse(BaseModel):
    id: int
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime]
    status: str
    current_ap: int
    actions: List[GameActionResponse] = []
    class Config:
        from_attributes = True

class PlayActionRequest(BaseModel):
    action_type: str
    target: str
    extra_input: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True
