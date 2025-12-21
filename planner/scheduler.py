from planner.ai import generate_tasks_with_ai

def generate_schedule(goal, rules, skipped_tasks=None):
    plan = {}

    plan["Day 1"] = ["Arrays", "2 problems"]
    plan["Day 2"] = ["Linked List", "2 problems"]

    if skipped_tasks:
        plan["Day 2"].extend(skipped_tasks)

    return plan

