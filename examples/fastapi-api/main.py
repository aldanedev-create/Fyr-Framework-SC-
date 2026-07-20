from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="Fyr FastAPI Example")
app.mount("/assets", StaticFiles(directory=BASE_DIR), name="assets")

items = [
    {"id": 1, "title": "Review the API contract", "priority": "high", "done": False},
    {"id": 2, "title": "Wire the Fyr client", "priority": "medium", "done": False},
]


class ItemInput(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    priority: str = "medium"


@app.get("/")
def index():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"ok": True, "framework": "FastAPI"}


@app.get("/api/items")
def list_items():
    return {"items": items}


@app.post("/api/items", status_code=201)
def create_item(payload: ItemInput):
    item = {"id": max((item["id"] for item in items), default=0) + 1, "title": payload.title.strip(), "priority": payload.priority, "done": False}
    items.insert(0, item)
    return {"item": item}


@app.patch("/api/items/{item_id}")
def toggle_item(item_id: int):
    item = next((item for item in items if item["id"] == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    item["done"] = not item["done"]
    return {"item": item}
