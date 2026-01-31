from planner.task_state import load_task_state

def generate_schedule(goal, rules):
    """ 
    Stateful DSA planner for AWS SDE prep:
    - Loads task_state (skipped_count, status)
    - Generates max 30 days, bounded by topics
    - Skips topics with skipped_count >= 2 or status="paused"
    - No empty days
    """
    max_tasks = rules["max_tasks"]
    task_state = load_task_state()

    base_topics = ["Arrays", "Linked List", "Stacks", "Queues"]

    plan = {}
    scheduled_topics = set()
    day = 1
    topic_index = 0

    while topic_index < len(base_topics):
        day_key = f"Day {day}"
        plan[day_key] = []

        while (
            len(plan[day_key]) < max_tasks
            and topic_index < len(base_topics)
        ):
            topic = base_topics[topic_index]

            if (
                topic not in scheduled_topics
                and is_task_schedulable(topic, task_state)
            ):
                plan[day_key].append(topic)
                plan[day_key].append("2 problems")
                scheduled_topics.add(topic)
                topic_index += 1
            else:
                # Skip unschedulable topics (paused/over-skipped)
                topic_index += 1

        # Drop empty days
        if not plan[day_key]:
            del plan[day_key]
            break

        day += 1

    return plan

def is_task_schedulable(task_name, task_state, max_skips=2):
    state = task_state.get(task_name)
    if not state:
        return True
    if state.get("skipped_count", 0) >= max_skips:
        return False
    if state.get("status") == "paused":
        return False
    return True
