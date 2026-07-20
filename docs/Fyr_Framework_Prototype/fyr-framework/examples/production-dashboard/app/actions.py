from collections.abc import Callable
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import Task, User

Handler = Callable[[User, Session, dict[str, Any]], Any]
_registry: dict[str, Handler] = {}

def action(name: str):
    def decorator(handler: Handler):
        if name in _registry:
            raise RuntimeError(f"Duplicate action: {name}")
        _registry[name] = handler
        return handler
    return decorator

def get_action(name: str) -> Handler | None:
    return _registry.get(name)

@action("dashboard.stats")
def dashboard_stats(user: User, db: Session, data: dict[str, Any]):
    return {
        "tasks": db.scalar(select(func.count(Task.id))) or 0,
        "completed": db.scalar(select(func.count(Task.id)).where(Task.status == "done")) or 0,
        "users": db.scalar(select(func.count(User.id))) or 0,
        "runtime": "Python API + Fyr CDN + Rust WASM"
    }
