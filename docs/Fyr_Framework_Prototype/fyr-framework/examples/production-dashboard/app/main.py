from pathlib import Path
from typing import Any
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.orm import Session
from .actions import get_action
from .config import settings
from .database import Base, engine, get_db
from .models import Task, User
from .schemas import LoginInput, TaskInput, TaskUpdate
from .security import create_token, current_user, verify_password

BASE_DIR = Path(__file__).resolve().parent.parent
Base.metadata.create_all(engine)
app = FastAPI(title=settings.app_name, version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/fyr", StaticFiles(directory=BASE_DIR.parent.parent / "dist"), name="fyr")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

@app.get("/health")
def health():
    return {"status": "ok", "service": "fyr-dashboard"}

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {})

@app.post("/api/auth/login")
def login(payload: LoginInput, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    response.set_cookie("fyr_session", create_token(user), httponly=True, secure=settings.secure_cookies, samesite="lax", max_age=settings.token_minutes * 60)
    return serialize_user(user)

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("fyr_session")
    return {"success": True}

@app.get("/api/auth/me")
def me(user: User = Depends(current_user)):
    return serialize_user(user)

@app.get("/api/tasks")
def list_tasks(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Task).order_by(Task.created_at.desc())).all()
    return {"items": [serialize_task(row) for row in rows]}

@app.post("/api/tasks", status_code=201)
def create_task(payload: TaskInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    task = Task(title=payload.title.strip(), description=payload.description.strip(), priority=payload.priority, owner_id=user.id)
    db.add(task); db.commit(); db.refresh(task)
    return serialize_task(task)

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task: raise HTTPException(status_code=404, detail="Task not found")
    task.status = payload.status; db.commit(); db.refresh(task)
    return serialize_task(task)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task: raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task); db.commit()
    return {"success": True}

@app.post("/_fyr/actions/{name:path}")
def run_action(name: str, payload: dict[str, Any], user: User = Depends(current_user), db: Session = Depends(get_db)):
    handler = get_action(name)
    if not handler: raise HTTPException(status_code=404, detail="Action not found")
    return {"success": True, "data": handler(user, db, payload.get("data") or {})}

def serialize_user(user: User):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

def serialize_task(task: Task):
    return {"id": task.id, "title": task.title, "description": task.description, "status": task.status, "priority": task.priority, "created_at": task.created_at.isoformat()}
