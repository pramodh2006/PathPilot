def apply_rules(hours_per_day, exam_mode):
    """
    Applies workload rules based on user constraints.
    """

    effective_hours = hours_per_day
    intensity = "normal"

    if exam_mode:
        effective_hours *= 0.6
        intensity = "low"

    if effective_hours < 2:
        max_tasks = 1
    elif effective_hours < 4:
        max_tasks = 2
    else:
        max_tasks = 3

    return {
        "effective_hours": round(effective_hours, 1),
        "max_tasks": max_tasks,
        "intensity": intensity
    }
