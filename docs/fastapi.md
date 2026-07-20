# FastAPI integration

The runnable [FastAPI example](../examples/fastapi-api/) demonstrates list, create, and update requests with `Fyr.http`. Run `uvicorn main:app --reload` from that folder after installing its requirements.

Fyr works with any JSON API. This example exposes a basic endpoint that Fyr.http can call.

~~~py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class TodoCreate(BaseModel):
    title: str

@app.get("/api/todos")
async def list_todos():
    return [{"id": 1, "title": "Write docs", "done": False}]

@app.post("/api/todos")
async def create_todo(todo: TodoCreate):
    return {"id": 2, "title": todo.title, "done": False}
~~~

~~~js
const response = await Fyr.http.post("/api/todos", {
  title: "Ship app"
});

if (response.ok) {
  console.log(response.data);
}
~~~

If the frontend is hosted on another origin, configure FastAPI CORS with the exact frontend origin and only the methods and headers you need. Validate request models, authenticate users, and authorize every operation on the server.

For Fyr.action, implement POST endpoints beneath your configured action path, such as /_fyr/actions/todos.create. The handler receives a body with a data property and should return JSON.
