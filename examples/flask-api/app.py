"""A local, in-memory mini classroom API for the Fyr Flask example.

This intentionally has no authentication or database. It is a learning demo,
not a production-ready student records system.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)
store_lock = Lock()

COURSE = {
    "id": "cs-101",
    "name": "Computer Science Foundations",
    "code": "CS-101",
    "teacher": "Ms. Rivera",
    "period": "Period 3",
    "meeting": "Room 214 · Mon–Fri",
}

STUDENTS = [
    {"id": "malia", "name": "Malia Thompson", "initials": "MT"},
    {"id": "dev", "name": "Dev Patel", "initials": "DP"},
    {"id": "zoe", "name": "Zoe Martin", "initials": "ZM"},
]

ASSIGNMENTS: list[dict[str, Any]] = [
    {
        "id": "binary-search",
        "title": "Binary Search Lab",
        "topic": "Algorithms",
        "description": "Implement binary search and explain its time complexity.",
        "due": "2026-07-24",
        "points": 25,
        "status": "assigned",
        "submitted": False,
        "grade": None,
    },
    {
        "id": "data-ethics",
        "title": "Data Ethics Reflection",
        "topic": "Digital citizenship",
        "description": "Write a short reflection about responsible data collection.",
        "due": "2026-07-27",
        "points": 15,
        "status": "assigned",
        "submitted": False,
        "grade": None,
    },
    {
        "id": "html-checkpoint",
        "title": "HTML Checkpoint",
        "topic": "Web foundations",
        "description": "Build a semantic profile card using accessible HTML.",
        "due": "2026-07-18",
        "points": 20,
        "status": "returned",
        "submitted": True,
        "grade": 19,
    },
]

ANNOUNCEMENTS: list[dict[str, Any]] = [
    {
        "id": "welcome",
        "author": "Ms. Rivera",
        "message": "Welcome back! Start with the Binary Search Lab and ask questions in class tomorrow.",
        "created_at": "Today · 8:15 AM",
    },
    {
        "id": "office-hours",
        "author": "Ms. Rivera",
        "message": "Office hours are Wednesday after school in Room 214. Bring your algorithm questions.",
        "created_at": "Yesterday · 3:40 PM",
    },
]


def now_label() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%I:%M %p").lstrip("0")
    return f"Today · {timestamp}"


def assignment_or_404(assignment_id: str):
    assignment = next((item for item in ASSIGNMENTS if item["id"] == assignment_id), None)
    if assignment is None:
        return None, (jsonify({"error": "Assignment not found."}), 404)
    return assignment, None


def payload(required: tuple[str, ...] = ()) -> tuple[dict[str, Any] | None, Any | None]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({"error": "Expected a JSON object."}), 400)

    missing = [key for key in required if not str(data.get(key, "")).strip()]
    if missing:
        return None, (jsonify({"error": f"Missing required fields: {', '.join(missing)}."}), 400)
    return data, None


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/app.js")
def javascript():
    return send_from_directory(BASE_DIR, "app.js", mimetype="text/javascript")


@app.get("/styles.css")
def stylesheet():
    return send_from_directory(BASE_DIR, "styles.css", mimetype="text/css")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "fyr-classroom"})


@app.get("/api/classroom")
def classroom():
    with store_lock:
        return jsonify(
            {
                "course": COURSE,
                "students": STUDENTS,
                "assignments": ASSIGNMENTS,
                "announcements": ANNOUNCEMENTS,
                "today": date.today().isoformat(),
            }
        )


@app.post("/api/assignments")
def create_assignment():
    data, error = payload(("title", "topic", "due"))
    if error:
        return error

    try:
        points = int(data.get("points", 10))
    except (TypeError, ValueError):
        return jsonify({"error": "Points must be a number."}), 400

    if points < 1 or points > 100:
        return jsonify({"error": "Points must be between 1 and 100."}), 400

    with store_lock:
        assignment_id = f"assignment-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        assignment = {
            "id": assignment_id,
            "title": data["title"].strip(),
            "topic": data["topic"].strip(),
            "description": str(data.get("description", "No description provided.")).strip(),
            "due": data["due"].strip(),
            "points": points,
            "status": "assigned",
            "submitted": False,
            "grade": None,
        }
        ASSIGNMENTS.insert(0, assignment)
    return jsonify({"assignment": assignment}), 201


@app.post("/api/assignments/<assignment_id>/submit")
def submit_assignment(assignment_id: str):
    assignment, error = assignment_or_404(assignment_id)
    if error:
        return error

    with store_lock:
        assignment["submitted"] = True
        assignment["status"] = "submitted"
        assignment["submitted_at"] = now_label()
    return jsonify({"assignment": assignment})


@app.post("/api/assignments/<assignment_id>/grade")
def grade_assignment(assignment_id: str):
    data, error = payload(("grade",))
    if error:
        return error
    assignment, assignment_error = assignment_or_404(assignment_id)
    if assignment_error:
        return assignment_error

    try:
        grade = int(data["grade"])
    except (TypeError, ValueError):
        return jsonify({"error": "Grade must be a number."}), 400
    if grade < 0 or grade > assignment["points"]:
        return jsonify({"error": "Grade must be between 0 and the assignment points."}), 400

    with store_lock:
        assignment["grade"] = grade
        assignment["submitted"] = True
        assignment["status"] = "returned"
    return jsonify({"assignment": assignment})


@app.post("/api/announcements")
def create_announcement():
    data, error = payload(("message",))
    if error:
        return error

    with store_lock:
        announcement = {
            "id": f"announcement-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "author": "Ms. Rivera",
            "message": data["message"].strip(),
            "created_at": now_label(),
        }
        ANNOUNCEMENTS.insert(0, announcement)
    return jsonify({"announcement": announcement}), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)
