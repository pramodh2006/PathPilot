from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
from planner.rules import apply_rules
from planner.scheduler import generate_schedule
from planner.progress import record_progress, load_progress

app = Flask(__name__)
CORS(app)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route("/healthcheck")
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

# === ROADMAPS ===
ROADMAPS_FILE = 'data/roadmaps.json'

def load_json(file_path, default=[]):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return default

def save_json(file_path, data):
    os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/roadmaps', methods=['GET'])
def get_roadmaps():
    return jsonify(load_json(ROADMAPS_FILE, []))

@app.route('/roadmaps', methods=['POST'])
def create_roadmap():
    data = request.get_json()
    roadmaps = load_json(ROADMAPS_FILE, [])
    roadmap_id = len(roadmaps) + 1
    name = data.get('name', 'New Roadmap')
    
    # ✅ DYNAMIC: Generate real plan via /plan endpoint
    goal = name.split()[0] if name else 'DSA'  # "AWS SDE" → "AWS"
    plan_response = {
        "goal": goal,
        "hours_per_day": 2,
        "exam_mode": False
    }
    
    # Call your existing planner
    rules = apply_rules(2, False)
    dynamic_plan = generate_schedule(goal, rules)
    
    new_roadmap = {
        "id": roadmap_id,
        "name": name,
        "created": "2026-02-01",
        "goal": goal,
        "plan": dynamic_plan,  # ✅ Real generated schedule
        "tasks": dynamic_plan.get('tasks', []),
        "progress_pct": 0
    }
    roadmaps.append(new_roadmap)
    save_json(ROADMAPS_FILE, roadmaps)
    return jsonify(new_roadmap), 201



@app.route('/roadmaps/<int:roadmap_id>', methods=['DELETE'])
def delete_roadmap(roadmap_id):
    roadmaps = load_json(ROADMAPS_FILE, [])
    roadmaps = [r for r in roadmaps if r['id'] != roadmap_id]
    save_json(ROADMAPS_FILE, roadmaps)
    return jsonify({"deleted": roadmap_id})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
