import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import GenerationExperience from './components/GenerationExperience';
import MissionControl from './components/MissionControl';
import Auth from './components/Auth';

export type MissionData = {
  goal: string;
  currentLevel: string;
  hoursPerDay: number;
  targetTimeline: string;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // <--- New Loading State
  
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null);
  const [started, setStarted] = useState(false);

  // Check for existing token and fetch user data on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    
    if (token) {
      setIsAuthenticated(true);
      if (user) setUsername(user);
      checkExistingRoadmap(token);
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const checkExistingRoadmap = async (token: string) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/user/roadmap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.has_roadmap) {
          // User has a saved roadmap! Load it directly and skip the start screen.
          setMissionData(data.missionData);
          setGeneratedRoadmap(data.roadmap);
          setStarted(true);
        }
      } else if (response.status === 401) {
        handleLogout(); // Token expired or invalid
      }
    } catch (error) {
      console.error("Failed to fetch existing roadmap", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLoginSuccess = (token: string, user: string) => {
    setIsAuthenticated(true);
    setUsername(user);
    setIsLoadingAuth(true);
    checkExistingRoadmap(token);
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

  // Show a blank dark screen while checking the database
  if (isLoadingAuth) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  // 1. If not logged in, show Auth Screen
  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If logged in but hasn't clicked "Start" AND has no saved data
  if (!started && !generatedRoadmap) {
    return (
      <LandingPage 
        onStart={handleStartMission} 
        onLogout={handleLogout}
        username={username}
      />
    );
  }

  // 3. Wizard Step
  if (started && !missionData && !generatedRoadmap) {
    return <OnboardingWizard onComplete={handleCompleteWizard} />;
  }

  // 4. Loading/Generation Screen
  if (isGenerating) {
    return (
      <GenerationExperience
        missionData={missionData!}
        onComplete={handleGenerationComplete}
      />
    );
  }

  // 5. Final Dashboard
  return (
    <MissionControl 
      missionData={missionData!} 
      roadmap={generatedRoadmap} 
      onLogout={handleLogout}
    />
  );
}