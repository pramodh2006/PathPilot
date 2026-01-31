import json
import os

TASK_STATE_FILE = "data/task_state.json"

DEFAULT_TASKS = {
    "Arrays": {"status": "pending", "skipped_count": 0},
    "Linked List": {"status": "pending", "skipped_count": 0},
    "Stacks": {"status": "pending", "skipped_count": 0},
    "Queues": {"status": "pending", "skipped_count": 0}
}


def load_task_state():
    if not os.path.exists(TASK_STATE_FILE):
        return DEFAULT_TASKS.copy()

    with open(TASK_STATE_FILE, "r") as f:
        return json.load(f)

def save_task_state(state):
    os.makedirs("data", exist_ok=True)
    with open(TASK_STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
