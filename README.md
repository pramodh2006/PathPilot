<div align="center">

# 🧭 PathPilot

### AI-Powered Career Execution Platform

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-path--pilot--roan.vercel.app-6c63ff?style=for-the-badge)](https://path-pilot-roan.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-PathPilot-181717?style=for-the-badge&logo=github)](https://github.com/pramodh2006/PathPilot)
[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

*Enter your career goal. Get a personalized, AI-generated day-by-day execution roadmap. Ship it.*

<br/>

[![View Live Demo](https://img.shields.io/badge/⚡%20Open%20PathPilot-Try%20it%20Now-6c63ff?style=for-the-badge)](https://path-pilot-roan.vercel.app/)

</div>

---

## 📌 Overview

PathPilot is a full-stack AI-powered career execution platform that turns vague career goals into structured, actionable roadmaps. Users define their goal, current skill level, daily availability, and target timeline — and Groq AI generates a personalized, phase-by-phase plan broken down to the day. Progress is tracked through daily task checkoffs, milestone unlocks, and a GitHub-style activity heatmap.

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register and login flow with token-based session management
- 🤖 **AI-Generated Roadmaps** — Groq LLM produces a personalized, day-by-day execution plan tailored to your goal, skill level, and timeline
- ✅ **Daily Task Execution** — Check off tasks as you complete them; progress persists per user in the database
- 📊 **GitHub-Style Activity Heatmap** — Visual representation of your daily consistency over time
- 🏁 **Phase & Milestone Tracking** — Roadmap structured into phases with locked/unlocked milestone progression
- ➕ **Extend Your Roadmap** — Generate AI-powered next phases when you reach the end of your current plan
- 📐 **Resizable Sidebar** — Drag-to-resize stats panel on desktop; slide-out drawer on mobile
- 📱 **Fully Responsive** — Optimized layout across all screen sizes
- 💾 **Persistent Storage** — Roadmaps and task state saved per user in a SQLite database

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-EF0082?style=for-the-badge&logo=framer&logoColor=white)

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

</div>

---

## 📸 Screenshots

### Onboarding — Set Your Goal

<img src="https://github.com/user-attachments/assets/97c0fdc9-8644-43bd-bb00-3559947dfff2" alt="PathPilot Onboarding" width="100%"/>

> Enter your career goal, skill level, daily hours, and target timeline. PathPilot feeds this directly to Groq AI to generate your roadmap.

<br/>

### Dashboard — Your Execution Hub

<img src="https://github.com/user-attachments/assets/2abf7844-2c2a-4487-bee0-aab42bdfb369" alt="PathPilot Dashboard" width="100%"/>

> Track daily tasks, view phase progress, monitor your activity heatmap, and unlock the next phase — all from one place.

---

## 🗂️ Repository Structure

```
PathPilot/
├── frontend/          # React 18 + TypeScript + Vite application
│   ├── src/
│   ├── public/
│   ├── .env           # VITE_API_URL
│   └── package.json
│
└── backend/           # Flask API + SQLite database
    ├── app.py
    ├── requirements.txt
    └── .env           # GROQ_API_KEY, JWT_SECRET_KEY
```

---

## ⚙️ Local Development

### Prerequisites

- Node.js 18+
- Python 3.9+
- A [Groq API key](https://console.groq.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/pramodh2006/PathPilot.git
cd PathPilot
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create your .env file (see Environment Variables below)
# Then start the development server
python app.py
```

The Flask API will be running at `http://127.0.0.1:5000`.

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create your .env file (see Environment Variables below)
# Then start the development server
npm run dev
```

The React app will be running at `http://localhost:5173`.

---

## 🔑 Environment Variables

### Backend — `/backend/.env`

```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com/) — used for AI roadmap generation |
| `JWT_SECRET_KEY` | A long, random secret string used to sign and verify JWT tokens |

### Frontend — `/frontend/.env`

```env
VITE_API_URL=http://127.0.0.1:5000
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Flask backend. Set to your Render deployment URL in production |

---

## 🚀 Deployment

PathPilot is deployed across two platforms:

**Frontend → Vercel**
- Connect your GitHub repo to [Vercel](https://vercel.com/)
- Set the root directory to `frontend`
- Add `VITE_API_URL` pointing to your live Render backend URL in Vercel's environment variable settings
- Vercel auto-deploys on every push to `main`

**Backend → Render**
- Create a new **Web Service** on [Render](https://render.com/)
- Set the root directory to `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `python app.py`
- Add `GROQ_API_KEY` and `JWT_SECRET_KEY` in Render's environment variable dashboard

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please keep PRs focused and well-described.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built by **Pramodh Kumar Vankayala** — [GitHub](https://github.com/pramodh2006/PathPilot) · [Live Demo](https://path-pilot-roan.vercel.app/)

</div>
