# PathPilot 🚀

**AI-Powered Career Roadmap Generator**

PathPilot helps students and professionals achieve their career goals by generating personalized, day-by-day execution plans. Using Google Gemini 2.0 Flash, it creates adaptive schedules that track progress, streaks, and milestones.

![PathPilot Dashboard](https://github.com/pramodh2006/PathPilot/assets/placeholder-image.png)

## ✨ Features

- **AI-Generated Plans**: Custom daily schedules based on role, level, and timeline.
- **Mission Control**: Interactive dashboard with daily checklists and progress rings.
- **Activity Heatmap**: GitHub-style contribution graph to visualize momentum.
- **Smart Milestones**: Automatic phase unlocking as you complete tasks.
- **Edit & Adapt**: Add or modify tasks on the fly to suit your pace.
- **Persistent State**: Progress is saved automatically.

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Flask (Python) + Google Gemini AI
- **Deployment**: Ready for Vercel (Frontend) & Railway/Render (Backend)

---

## 🚀 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/pramodh2006/PathPilot.git
cd PathPilot

cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
# Create a .env file and add your GEMINI_API_KEY
python app.py

cd frontend
npm install
npm run dev
