import json
import os
from datetime import datetime

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
    data = load_progress()

    entry = {
        "day": day,
        "completed_tasks": completed_tasks,
        "skipped_tasks": skipped_tasks,
        "timestamp": datetime.utcnow().isoformat()
    }

    data["history"].append(entry)
    save_progress(data)

    return entry

def get_skipped_tasks():
    data = load_progress()

    skipped = []
    for entry in data["history"]:
        skipped.extend(entry.get("skipped_tasks", []))

    return skipped
