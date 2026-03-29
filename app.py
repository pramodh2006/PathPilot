from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
import re
import sqlite3
import jwt
import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
# Make sure these imports exist in your project, or comment them out if unused
# from planner.rules import apply_rules
# from planner.scheduler import generate_schedule
# from planner.progress import record_progress
from groq import Groq  
from dotenv import load_dotenv  

app = Flask(__name__)
CORS(app)
load_dotenv() 

# Setup Secrets and Keys
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY", "super-secret-pathpilot-key")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set.")

client = Groq(api_key=GROQ_API_KEY)
DB_PATH = 'pathpilot.db'

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # 2. Roadmaps Table (Linked to user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS roadmaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            goal TEXT NOT NULL,
            hours_per_day INTEGER,
            total_days INTEGER,
            current_day INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # 3. Tasks Table
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

# --- AUTHENTICATION MIDDLEWARE ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check headers for Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Decode the JWT token to find who is making the request
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db_connection()
            current_user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            conn.close()
            if not current_user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired!'}), 401

        # Pass the current user object to the protected route
        return f(current_user, *args, **kwargs)
    return decorated

# --- AUTHENTICATION ROUTES ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing fields!'}), 400

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                     (data['username'], data['email'], hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User created successfully!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username or Email already exists!'}), 409


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing fields!'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
    conn.close()

    if not user:
        return jsonify({'message': 'User not found!'}), 401

    if check_password_hash(user['password'], data['password']):
        # Create a token that lasts for 24 hours
        token = jwt.encode({
            'user_id': user['id'], 
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'token': token,
            'username': user['username']
        })

    return jsonify({'message': 'Incorrect password!'}), 401

# --- USER DATA ROUTE ---
@app.route("/user/roadmap", methods=["GET"])
@token_required
def get_user_roadmap(current_user):
    conn = get_db_connection()
    # Get the user's most recent roadmap
    roadmap = conn.execute(
        'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY id DESC LIMIT 1', 
        (current_user['id'],)
    ).fetchone()

    if not roadmap:
        conn.close()
        return jsonify({"has_roadmap": False})

    # Get all tasks for this roadmap
    tasks = conn.execute(
        'SELECT * FROM tasks WHERE roadmap_id = ? ORDER BY day_number ASC', 
        (roadmap['id'],)
    ).fetchall()
    
    conn.close()

    # Format the data to match what the frontend expects
    saved_tasks = []
    for t in tasks:
        saved_tasks.append({
            "id": t['id'],
            "day": t['day_number'],
            "title": t['title'],
            "completed": bool(t['completed']),
            "duration": t['duration']
        })

    return jsonify({
        "has_roadmap": True,
        "missionData": {
            "goal": roadmap['goal'],
            "hoursPerDay": roadmap['hours_per_day'],
            "targetTimeline": f"{roadmap['total_days']} days",
            "currentLevel": "Intermediate" # Default/fallback 
        },
        "roadmap": {
            "roadmap_id": roadmap['id'],
            "total_days": roadmap['total_days'],
            "plan": {
                "milestones": [f"Phase 1: {roadmap['goal']} Fundamentals"], # Placeholder milestone
                "tasks": saved_tasks
            }
        }
    })

# --- API ROUTES ---
@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route("/healthcheck")
def health_check():
    return jsonify({"status": "PathPilot API running 🚀"})


@app.route("/plan", methods=["POST"])
@token_required # SECURED: Only logged-in users can generate plans
def create_plan(current_user):
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

    # Cap initial generation at 30 days
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
        
        # Link this roadmap specifically to the user who requested it!
        cursor.execute(
            "INSERT INTO roadmaps (user_id, goal, hours_per_day, total_days) VALUES (?, ?, ?, ?)",
            (current_user['id'], goal, hours, days_count) 
        )
        roadmap_id = cursor.lastrowid

        saved_tasks = []
        for idx, task_str in enumerate(plan_data.get('tasks', [])):
            day_num = idx + 1
            clean_title = re.sub(r'^Day\s*\d+:\s*', '', task_str).strip()
            
            cursor.execute(
                "INSERT INTO tasks (roadmap_id, day_number, title, duration) VALUES (?, ?, ?, ?)",
                (roadmap_id, day_num, clean_title, 1.0) 
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

        return jsonify({
            "roadmap_id": roadmap_id,
            "goal": goal,
            "total_days": days_count,
            "tasks_generated": len(saved_tasks),
            "plan": {
                "milestones": plan_data.get('milestones', []),
                "tasks": saved_tasks 
            }
        })

    except Exception as e:
        print("AI ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)