# Fyr Classroom with Flask

[`examples/flask-api`](../examples/flask-api/) is a mini classroom application with a course stream, roster, assignment filtering, student submission, teacher grading, teacher assignment creation, and announcements.

## Run locally

~~~powershell
cd examples/flask-api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
~~~

Open `http://127.0.0.1:5000`.

## API surface

| Method and endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Basic health check. |
| `GET /api/classroom` | Course, roster, assignments, and announcements. |
| `POST /api/assignments` | Teacher creates an assignment. |
| `POST /api/assignments/:id/submit` | Student submits an assignment. |
| `POST /api/assignments/:id/grade` | Teacher returns a numeric grade. |
| `POST /api/announcements` | Teacher adds a stream announcement. |

The frontend uses `Fyr.http` and checks `response.ok` before replacing state. Array membership is updated with new arrays so `fyr-for` can reconcile the changed list.

## Production boundary

This is a local learning project, not a production Google Classroom replacement. A real school system needs identity integration, real role-based authorization on every endpoint, CSRF protection for cookie sessions, database migrations, encrypted backups, file scanning and storage controls, FERPA/privacy review, audit logs, rate limits, accessibility testing, monitoring, and a data-retention policy. The role switch in the UI is only a demo control—never trust it as authorization.
