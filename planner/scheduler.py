def generate_schedule(goal, constraints):
    """
    Generates a 7-day schedule based on constraints.
    """

    max_tasks = constraints["max_tasks"]

    base_tasks = [
        "Revise fundamentals",
        "Practice DSA problems",
        "Read core concepts",
        "Implement small coding task",
        "Review mistakes"
    ]

    plan = []

    for day in range(1, 8):
        day_tasks = base_tasks[:max_tasks]

        plan.append({
            "day": day,
            "tasks": day_tasks
        })

    return plan
