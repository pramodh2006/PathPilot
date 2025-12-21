from flask import Flask, request, jsonify
from planner.rules import apply_rules
from planner.scheduler import generate_schedule



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


    plan = generate_schedule(goal, rules)

    return jsonify({
    "goal": goal,
    "constraints": rules,
    "plan": plan
})

