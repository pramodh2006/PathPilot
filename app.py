from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
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
    raise ValueError("GROQ_API_KEY is not set. Check your .env file or environment variables.")

client = Groq(api_key=GROQ_API_KEY)

def load_json(file_path, default=[]):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return default

def save_json(file_path, data):
    os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

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
    
    templates = load_json('data/templates.json', {})
    if goal in templates:
        template = templates[goal]
        # Use your scheduler to structure the tasks
        rules = apply_rules(hours, False)
        plan = generate_schedule(template['tasks'][0], rules)
        plan['milestones'] = template['milestones']
        plan['resources'] = template['resources']
        return jsonify({"goal": goal, "source": "template", "plan": plan})

    # 2. Use Groq AI for everything else
    try:
        prompt = f"""
        Act as a career coach. Create a JSON roadmap for a "{goal}" career ({hours} hours/day).
        Return ONLY valid JSON with this structure:
        {{
            "milestones": ["milestone1", "milestone2", "milestone3"],
            "tasks": ["Day 1: task...", "Day 2: task...", "Day 3: task...", "Day 4: task...", "Day 5: task...", "Day 6: task...", "Day 7: task..."],
            "resources": ["url1", "url2"]
        }}
        """
        
        chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": prompt}],
    model="llama-3.3-70b-versatile",  
    response_format={"type": "json_object"}
)

        
        ai_content = chat_completion.choices[0].message.content
        plan_data = json.loads(ai_content) # Parse the AI JSON
        
        return jsonify({
            "goal": goal, 
            "source": "groq_ai", 
            "plan": plan_data
        })

    except Exception as e:
        print("AI ERROR:", e)
        fallback_plan = {
            "milestones": [f"{goal.title()} Foundations", "Advanced Skills", "Job Prep"],
            "tasks": [f"Study {goal} basics", "Practice core concepts", "Build a portfolio project"],
            "resources": ["https://youtube.com", "https://coursera.org"]
        }
        return jsonify({"goal": goal, "source": "fallback", "plan": fallback_plan})


# --- ROADMAP & PROGRESS ROUTES ---
ROADMAPS_FILE = 'data/roadmaps.json'

@app.route('/roadmaps', methods=['GET'])
def get_roadmaps():
    return jsonify(load_json(ROADMAPS_FILE, []))

@app.route('/roadmaps', methods=['POST'])
def create_roadmap():
    data = request.get_json()
    roadmaps = load_json(ROADMAPS_FILE, [])
    
    new_roadmap = {
        "id": len(roadmaps) + 1,
        "name": data.get("name", "New Roadmap"),
        "goal": data.get("name", "General"),
        "progress": 0
    }
    roadmaps.append(new_roadmap)
    save_json(ROADMAPS_FILE, roadmaps)
    return jsonify(new_roadmap), 201
    
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
