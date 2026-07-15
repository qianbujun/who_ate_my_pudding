import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt

import models, schemas
from database import engine, get_db
from game_service import LOCATIONS, CHARACTERS
from llm_service import ask_llm, evaluate_marisa_presence, ask_llm_stream

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Who Ate My Pudding Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_jwt")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.invite_code != "whoeat2026":
        raise HTTPException(status_code=400, detail="Invalid invite code")
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/game/history", response_model=List[schemas.GameSessionResponse])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(models.GameSession).filter(models.GameSession.user_id == current_user.id).order_by(models.GameSession.id.desc()).all()
    return sessions

@app.post("/api/game/start", response_model=schemas.GameSessionResponse)
def start_game(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # end previous playing sessions
    old_sessions = db.query(models.GameSession).filter(models.GameSession.user_id == current_user.id, models.GameSession.status == "playing").all()
    for s in old_sessions:
        s.status = "abandoned"
    
    session = models.GameSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.post("/api/game/action", response_model=schemas.GameActionResponse)
async def game_action(req: schemas.PlayActionRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.GameSession).filter(models.GameSession.user_id == current_user.id, models.GameSession.status == "playing").order_by(models.GameSession.id.desc()).first()
    if not session:
        raise HTTPException(status_code=400, detail="No active game")
    
    cost = 0
    result_text = ""
    win_flag = False
    lose_flag = False
    marisa_unlocked = False
    
    if req.action_type == "investigate":
        cost = 1
        loc = LOCATIONS.get(req.target)
        if not loc: raise HTTPException(status_code=400, detail="Invalid location")
        result_text = f"你调查了{loc['name']}。{loc['investigate']}"
        
    elif req.action_type == "investigate_cctv":
        loc = LOCATIONS.get(req.target)
        if not loc or not loc['has_cctv']: raise HTTPException(status_code=400, detail="Invalid location or no cctv")
        
        # Check if already investigated normal
        prev = db.query(models.GameAction).filter(models.GameAction.session_id == session.id, models.GameAction.action_type == "investigate", models.GameAction.detail.like(f"%{req.target}%")).first()
        cost = 2 if prev else 3
        
        if prev:
            result_text = f"你调查了{loc['name']}的监控。{loc['cctv']}"
        else:
            result_text = f"你调查了{loc['name']}及其监控。{loc['investigate']} {loc['cctv']}"
            
        if req.target in ["gate", "library"]:
            marisa_unlocked = True
            
    elif req.action_type == "ask_fixed":
        cost = 1
        char = CHARACTERS.get(req.target)
        if not char: raise HTTPException(status_code=400, detail="Invalid character")
        result_text = f"【{char['name']}】: {char['fixed_answer']}"
        
    elif req.action_type == "ask_llm":
        cost = 1
        char = CHARACTERS.get(req.target)
        if not char: raise HTTPException(status_code=400, detail="Invalid character")
        
        # get history of LLM chat for this character in this session
        history_actions = db.query(models.GameAction).filter(models.GameAction.session_id == session.id, models.GameAction.action_type == "ask_llm").all()
        history = []
        for ha in history_actions:
            detail_obj = json.loads(ha.detail)
            if detail_obj.get("target") == req.target:
                history.append({"question": detail_obj.get("question"), "answer": detail_obj.get("answer")})
        
        user_question = req.extra_input or ""
        llm_response = await ask_llm(char['name'], char['prompt'], user_question, history)
        result_text = f"【{char['name']}】: {llm_response}"
        
        marisa_unlocked = await evaluate_marisa_presence(llm_response)
        
        # Check break-defense
        if "布丁是我吃的" in llm_response and req.target == "marisa":
            win_flag = True
            
    elif req.action_type == "catch":
        cost = 2
        result_text = "你花费了精力，抓捕了魔理沙！现在可以盘问她了。"
        
    elif req.action_type == "guess":
        cost = 0
        if req.target == "marisa":
            result_text = "虽然魔理沙还在死鸭子嘴硬，但你根据种种线索直接将她拿下！【普通胜利】！"
            win_flag = True
        else:
            result_text = "你抓错了人，真凶逃之夭夭！【游戏失败】。"
            lose_flag = True
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    if session.current_ap < cost:
        raise HTTPException(status_code=400, detail="Not enough AP")
        
    session.current_ap -= cost
    
    # Record action
    detail_data = {
        "target": req.target,
        "text": result_text,
        "marisa_unlocked": marisa_unlocked
    }
    if req.action_type == "ask_llm":
        detail_data["question"] = req.extra_input
        detail_data["answer"] = result_text

    action = models.GameAction(
        session_id=session.id,
        action_type=req.action_type,
        detail=json.dumps(detail_data, ensure_ascii=False),
        ap_cost=cost
    )
    db.add(action)
    
    if win_flag:
        session.status = "win_logic" if req.action_type == "ask_llm" else "win_guess"
        session.end_time = datetime.utcnow()
    elif lose_flag:
        session.status = "lose_guess"
        session.end_time = datetime.utcnow()
        
    db.commit()
    db.refresh(action)
    return action

@app.post("/api/game/action_stream")
async def game_action_stream(req: schemas.PlayActionRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.GameSession).filter(models.GameSession.user_id == current_user.id, models.GameSession.status == "playing").order_by(models.GameSession.id.desc()).first()
    if not session:
        raise HTTPException(status_code=400, detail="No active game")
    
    if req.action_type != "ask_llm":
        raise HTTPException(status_code=400, detail="Only ask_llm is supported for streaming")
        
    cost = 1
    if session.current_ap < cost:
        raise HTTPException(status_code=400, detail="Not enough AP")
        
    char = CHARACTERS.get(req.target)
    if not char: raise HTTPException(status_code=400, detail="Invalid character")
    
    session.current_ap -= cost
    db.commit()
    
    history_actions = db.query(models.GameAction).filter(models.GameAction.session_id == session.id, models.GameAction.action_type == "ask_llm").all()
    history = []
    for ha in history_actions:
        detail_obj = json.loads(ha.detail)
        if detail_obj.get("target") == req.target:
            history.append({"question": detail_obj.get("question"), "answer": detail_obj.get("answer")})
            
    user_question = req.extra_input or ""
    
    async def generate():
        content_full = ""
        
        async for chunk in ask_llm_stream(char['name'], char['prompt'], user_question, history):
            if chunk.get("type") == "content":
                content_full += chunk["content"]
            yield json.dumps(chunk, ensure_ascii=False) + "\n"
            
        marisa_unlocked = await evaluate_marisa_presence(content_full)
        win_flag = "布丁是我吃的" in content_full and req.target == "marisa"
        result_text = f"【{char['name']}】: {content_full}"
        
        detail_data = {
            "target": req.target,
            "text": result_text,
            "marisa_unlocked": marisa_unlocked,
            "question": user_question,
            "answer": result_text
        }
        action = models.GameAction(
            session_id=session.id,
            action_type=req.action_type,
            detail=json.dumps(detail_data, ensure_ascii=False),
            ap_cost=cost
        )
        db.add(action)
        if win_flag:
            session.status = "win_logic"
            session.end_time = datetime.utcnow()
        db.commit()
        
        yield json.dumps({
            "type": "done",
            "marisa_unlocked": marisa_unlocked,
            "win_flag": win_flag,
            "result_text": result_text
        }, ensure_ascii=False) + "\n"
        
    return StreamingResponse(generate(), media_type="application/x-ndjson")
