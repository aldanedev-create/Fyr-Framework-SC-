# Flask integration

Fyr consumes ordinary JSON endpoints. A minimal Flask API might look like this:

For a complete runnable version, see [the Fyr Classroom example](../examples/flask-api/) and its [walkthrough](classroom.md). It includes announcements, assignments, student submissions, teacher grading, validation, and UI state updates.

~~~py
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.get("/api/todos")
def list_todos():
    return jsonify([
        {"id": 1, "title": "Write docs", "done": False}
    ])

@app.post("/api/todos")
def create_todo():
    data = request.get_json()
    title = data["title"]
    return jsonify({"id": 2, "title": title, "done": False}), 201
~~~

~~~js
const response = await Fyr.http.get("/api/todos");
if (response.ok) {
  console.log(response.data);
}
~~~

Use server-side validation rather than trusting browser input. Configure CORS narrowly if the frontend is on another origin, and use a CSRF strategy for cookie-authenticated state changes.

Fyr.action works with Flask as well: add POST routes under your action prefix, read request.json.data, and return a JSON response.
