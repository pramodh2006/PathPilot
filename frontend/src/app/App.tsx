import { useState } from 'react';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import GenerationExperience from './components/GenerationExperience';
import MissionControl from './components/MissionControl';

type Screen = 'landing' | 'onboarding' | 'generating' | 'dashboard';

export interface MissionData {
  goal: string;
  currentLevel: string;
  hoursPerDay: number;
  targetTimeline: string;
  constraints: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  
  // NEW: State to hold the plan from Flask
  const [roadmap, setRoadmap] = useState<any>(null);

  const handleStart = () => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (data: MissionData) => {
    setMissionData(data);
    setCurrentScreen('generating');
  };

  // NEW: Handler receives data from GenerationExperience
  const handleGenerationComplete = (backendData: any) => {
    console.log("App received roadmap:", backendData); // Debug log
    setRoadmap(backendData);
    setCurrentScreen('dashboard');
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {currentScreen === 'landing' && <LandingPage onStart={handleStart} />}
      
      {currentScreen === 'onboarding' && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      
      {currentScreen === 'generating' && (
        <GenerationExperience 
           missionData={missionData!} 
           onComplete={handleGenerationComplete} 
        />
      )}
      
      {currentScreen === 'dashboard' && (
        <MissionControl 
           missionData={missionData!} 
           roadmap={roadmap} // PASS IT DOWN
        />
      )}
    </div>
  );
}
