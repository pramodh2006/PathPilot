from planner.ai import generate_tasks_with_ai

def generate_schedule(goal, constraints):
    max_tasks = constraints["max_tasks"]
    intensity = constraints["intensity"]

    ai_tasks = generate_tasks_with_ai(goal, intensity)

    plan = []

    for day in range(1, 8):
        plan.append({
            "day": day,
            "tasks": ai_tasks[:max_tasks]
        })

    return plan
