from flask import Flask, request, jsonify, render_template
from planner.rules import apply_rules
from planner.scheduler import generate_schedule
from planner.progress import record_progress

app = Flask(__name__)

@app.route('/')
def dashboard():
  return render_template('dashboard.html')

@app.route("/healthcheck")  # Add /healthcheck
def health_check():
    return jsonify({"status": "PathPilot API running 🚀"})


@app.route("/plan", methods=["POST"])
def create_plan():
    data = request.get_json(force=True)

    goal = data.get("goal")
    hours = data.get("hours_per_day")
    exam_mode = data.get("exam_mode")

    rules = apply_rules(hours, exam_mode)

    plan = generate_schedule(goal, rules)

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

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
