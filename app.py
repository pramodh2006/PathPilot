from flask import Flask, request, jsonify

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

    mock_plan = [
        {"day": 1, "task": "Revise programming fundamentals"},
        {"day": 2, "task": "Practice arrays and strings"},
        {"day": 3, "task": "Learn basic system design"},
        {"day": 4, "task": "Practice LeetCode problems"},
        {"day": 5, "task": "Build small feature"},
        {"day": 6, "task": "Review and revise"},
        {"day": 7, "task": "Weekly reflection"}
    ]

    return jsonify({
        "goal": goal,
        "hours_per_day": hours,
        "exam_mode": exam_mode,
        "plan": mock_plan
    })
