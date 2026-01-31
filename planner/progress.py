import json
import os
from datetime import datetime
from planner.task_state import load_task_state, save_task_state

PROGRESS_FILE = "data/progress.json"

def load_progress():
    if not os.path.exists(PROGRESS_FILE):
        return {"history": []}

    with open(PROGRESS_FILE, "r") as f:
        return json.load(f)

def save_progress(data):
    os.makedirs("data", exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump(data, f, indent=2)

def record_progress(day, completed_tasks, skipped_tasks):
    progress = load_progress()
    task_state = load_task_state()

    for task in skipped_tasks:
        if task_state.get(task, {}).get("status") != "completed":  
            current = task_state.get(task, {"status": "pending", "skipped_count": 0})
            current["status"] = "skipped"   
            current["skipped_count"] = current.get("skipped_count", 0) + 1  
            task_state[task] = current      



    entry = {
        "day": day,
        "completed_tasks": completed_tasks,
        "skipped_tasks": skipped_tasks,
        "timestamp": datetime.utcnow().isoformat()
    }

    progress["history"].append(entry)

    save_progress(progress)
    save_task_state(task_state)

    return entry
