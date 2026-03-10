from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
import re
import sqlite3 # ADDED SQLITE
from planner.rules import apply_rules
from planner.scheduler import generate_schedule
from planner.progress import record_progress
from groq import Groq  
from dotenv import load_dotenv  

app = Flask(__name__)
CORS(app)
load_dotenv() 

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set.")

client = Groq(api_key=GROQ_API_KEY)
DB_PATH = 'pathpilot.db'

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Table for overall Roadmaps
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS roadmaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal TEXT NOT NULL,
            hours_per_day INTEGER,
            total_days INTEGER,
            current_day INTEGER DEFAULT 1
        )
    ''')
    # Table for individual Tasks linked to a Roadmap
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roadmap_id INTEGER,
            day_number INTEGER,
            title TEXT,
            duration REAL,
            completed BOOLEAN DEFAULT 0,
            FOREIGN KEY(roadmap_id) REFERENCES roadmaps(id)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route("/healthcheck")
def health_check():
    return jsonify({"status": "PathPilot API running 🚀"})

@app.route("/plan", methods=["POST"])
def create_plan():
    data = request.get_json(force=True)
    goal = data.get("goal", "dsa").lower()
    hours = data.get("hours_per_day", 2)
    timeline_str = data.get("targetTimeline", "1 month").lower()

    # Parse timeline
    days_count = 30
    num_match = re.search(r'\d+', timeline_str)
    num = int(num_match.group()) if num_match else 1
    if 'day' in timeline_str: days_count = num
    elif 'week' in timeline_str: days_count = 7 * num
    elif 'month' in timeline_str: days_count = 30 * num

    # Cap initial generation at 30 days to avoid Groq token limits. 
    # (We will add a route to generate the REST later)
    initial_generation_target = min(days_count, 30)

    try:
        prompt = (
            f'Act as an expert career coach. Create a JSON roadmap for a "{goal}" career ({hours} hours/day). '
            f'You MUST generate a daily task for exactly {initial_generation_target} days. '
            f'Return ONLY valid JSON with this exact structure: '
            f'{{"milestones": ["Phase 1: ...", "Phase 2: ..."], '
            f'"tasks": ["Day 1: [task]", "Day 2: [task]"], '
            f'"resources": ["url1"]}}'
        )

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )

        ai_content = chat_completion.choices[0].message.content
        plan_data = json.loads(ai_content)

        if 'tasks' in plan_data and len(plan_data['tasks']) > initial_generation_target:
            plan_data['tasks'] = plan_data['tasks'][:initial_generation_target]

        # --- SAVE TO DATABASE ---
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Create the roadmap entry
        cursor.execute(
            "INSERT INTO roadmaps (goal, hours_per_day, total_days) VALUES (?, ?, ?)",
            (goal, hours, days_count) # Notice we save total requested days_count here!
        )
        roadmap_id = cursor.lastrowid

        # 2. Parse and save tasks
        saved_tasks = []
        for idx, task_str in enumerate(plan_data.get('tasks', [])):
            day_num = idx + 1
            # Clean "Day X: " from string for clean DB storage
            clean_title = re.sub(r'^Day\s*\d+:\s*', '', task_str).strip()
            
            cursor.execute(
                "INSERT INTO tasks (roadmap_id, day_number, title, duration) VALUES (?, ?, ?, ?)",
                (roadmap_id, day_num, clean_title, 1.0) # Defaulting to 1hr for now
            )
            
            saved_tasks.append({
                "id": cursor.lastrowid,
                "day": day_num,
                "title": clean_title,
                "completed": False,
                "duration": 1.0
            })
            
        conn.commit()
        conn.close()

        # Return the new structured format including the DB Roadmap ID
        return jsonify({
            "roadmap_id": roadmap_id,
            "goal": goal,
            "total_days": days_count,
            "tasks_generated": len(saved_tasks),
            "plan": {
                "milestones": plan_data.get('milestones', []),
                "tasks": saved_tasks # We now return the clean DB tasks!
            }
        })

    except Exception as e:
        print("AI ERROR:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
