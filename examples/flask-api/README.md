# Fyr Classroom (Flask)

A runnable mini classroom that demonstrates Fyr state, computed values, directives, forms, list rendering, UI notifications, and the HTTP client against a Flask JSON API.

## Run it

~~~powershell
cd examples/flask-api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
~~~

Open `http://127.0.0.1:5000`.

Switch between student and teacher demo views to submit, grade, create assignments, and post announcements. Data is in memory and resets when the Flask server restarts. It deliberately has no login, authorization, persistent storage, file uploads, or production security controls.
