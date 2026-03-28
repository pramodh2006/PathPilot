import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import GenerationExperience from './components/GenerationExperience';
import MissionControl from './components/MissionControl';
import Auth from './components/Auth'; // IMPORT AUTH

export type MissionData = {
  goal: string;
  currentLevel: string;
  hoursPerDay: number;
  targetTimeline: string;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null);
  const [started, setStarted] = useState(false);

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      if (user) setUsername(user);
    }
  }, []);

  const handleLoginSuccess = (token: string, user: string) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setStarted(false);
    setMissionData(null);
    setGeneratedRoadmap(null);
  };

  const handleStartMission = () => {
    setStarted(true);
  };

  const handleCompleteWizard = (data: MissionData) => {
    setMissionData(data);
    setIsGenerating(true);
  };

  const handleGenerationComplete = (roadmap: any) => {
    setIsGenerating(false);
    setGeneratedRoadmap(roadmap);
  };

  // 1. If not logged in, show Auth Screen
  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If logged in but hasn't clicked "Start", show Landing Page (now with Logout button!)
  if (!started) {
    return (
      <div className="relative">
        {/* Simple Logout Button on Landing Page */}
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 z-50 transition-colors"
        >
          Logout {username}
        </button>
        <LandingPage onStart={handleStartMission} />
      </div>
    );
  }

  // 3. Wizard Step
  if (!missionData) {
    return <OnboardingWizard onComplete={handleCompleteWizard} />;
  }

  // 4. Loading/Generation Screen
  if (isGenerating) {
    return (
      <GenerationExperience
        missionData={missionData}
        onComplete={handleGenerationComplete}
      />
    );
  }

  // 5. Final Dashboard
  return (
    <MissionControl 
      missionData={missionData} 
      roadmap={generatedRoadmap} 
      onLogout={handleLogout} // Pass logout down to mission control if you want
    />
  );
}