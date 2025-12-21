from flask import Flask, request, jsonify
from planner.rules import apply_rules
from planner.scheduler import generate_schedule
from planner.progress import record_progress
from planner.progress import get_skipped_tasks





app = Flask(__name__)

@app.route("/")
def health_check():
    return jsonify({"status": "PathPilot API running"})

@app.route("/plan", methods=["POST"])
def create_plan():
    data = request.get_json()

    goal = data.get("goal")
    hours = data.get("hours_per_day")
    exam_mode = data.get("exam_mode")
    rules = apply_rules(hours, exam_mode)

    skipped_tasks = get_skipped_tasks()
    plan = generate_schedule(goal, rules, skipped_tasks)


    return jsonify({
    "goal": goal,
    "constraints": rules,
    "plan": plan
})

@app.route("/progress", methods=["POST"])
def update_progress():
    data = request.get_json()

    day = data.get("day")
    completed_tasks = data.get("completed_tasks", [])
    skipped_tasks = data.get("skipped_tasks", [])

    entry = record_progress(day, completed_tasks, skipped_tasks)

    return jsonify({
        "message": "Progress recorded",
        "entry": entry
    })


