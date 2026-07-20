from sqlalchemy import select
from .database import Base, SessionLocal, engine
from .models import Task, User
from .security import hash_password

def run():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == "admin@fyr.dev"))
        if not user:
            user = User(name="Fyr Administrator", email="admin@fyr.dev", password_hash=hash_password("Admin123!"), role="admin")
            db.add(user); db.commit(); db.refresh(user)
        if not db.scalar(select(Task.id).limit(1)):
            db.add_all([
                Task(title="Publish Fyr CDN package", description="Build and publish a pinned version to npm.", priority="high", status="active", owner_id=user.id),
                Task(title="Add PostgreSQL migrations", description="Introduce Alembic before production deployment.", priority="medium", status="backlog", owner_id=user.id),
                Task(title="Verify Rust WASM engine", description="Run the browser compute module.", priority="low", status="done", owner_id=user.id),
            ])
            db.commit()
        print("Seed complete: admin@fyr.dev / Admin123!")
    finally:
        db.close()

if __name__ == "__main__": run()
