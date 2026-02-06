import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Target, GitBranch, Calendar, CheckCircle2 } from 'lucide-react';
import type { MissionData } from '../App';

interface GenerationExperienceProps {
  missionData: MissionData;
  onComplete: (backendData: any) => void;
}

const analysisSteps = [
  { label: 'Analyzing career requirements', icon: Target },
  { label: 'Mapping skill dependencies', icon: GitBranch },
  { label: 'Optimizing timeline', icon: Calendar },
  { label: 'Generating execution plan', icon: CheckCircle2 }
];

export default function GenerationExperience({ missionData, onComplete }: GenerationExperienceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // 1. Generate visual background nodes
  useEffect(() => {
    const generatedNodes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setNodes(generatedNodes);
  }, []);

  // 2. REAL BACKEND LOGIC + ANIMATION SYNC
  useEffect(() => {
    let isMounted = true;

    async function generatePlan() {
      try {
        // Step 0: Start "Analyzing"
        setCurrentStep(0);
        
        // Start the API call immediately
        const apiPromise = fetch('http://127.0.0.1:5000/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: missionData.goal,
            hours_per_day: missionData.hoursPerDay,
          })
        });

        // Step 1: Force a minimum wait for the first animation (so it doesn't flash too fast)
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (isMounted) setCurrentStep(1); // Mapping skill dependencies...

        // Step 2: Wait for the API to actually finish
        const response = await apiPromise;
        if (!response.ok) throw new Error("Backend Connection Failed");
        
        const data = await response.json();
        
        if (isMounted) setCurrentStep(2); // Optimizing timeline...
        await new Promise(resolve => setTimeout(resolve, 1000)); // Visual pause

        if (isMounted) setCurrentStep(3); // Generating execution plan...
        await new Promise(resolve => setTimeout(resolve, 1000)); // Final polish

        // DONE!
        if (isMounted) {
           // Pass the REAL data back to App.tsx
           onComplete(data);
        }

      } catch (error) {
        console.error("API Error:", error);
        alert("Error: Is your Flask Backend running on port 5000?");
      }
    }

    generatePlan();

    return () => { isMounted = false; };
  }, [missionData, onComplete]);

  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden flex items-center justify-center">
      {/* Animated Node Network (Unchanged) */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <radialGradient id="nodeGradient">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        
        {nodes.map((node) => (
          <motion.g key={node.id}>
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="3"
              fill="url(#nodeGradient)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="8"
              fill="none"
              stroke="url(#nodeGradient)"
              strokeWidth="1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                scale: [0, 2, 3]
              }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          </motion.g>
        ))}

        {/* Connecting Lines */}
        {nodes.slice(0, 15).map((node, i) => {
          const nextNode = nodes[(i + 1) % nodes.length];
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nextNode.x}%`}
              y2={`${nextNode.y}%`}
              stroke="url(#nodeGradient)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 4,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          );
        })}
      </svg>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center"
        >
          <Target className="w-8 h-8 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-semibold text-white mb-4"
        >
          Constructing Your Mission
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-zinc-400 mb-16"
        >
          AI analyzing {missionData.goal}
        </motion.p>

        {/* Analysis Steps */}
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const isActive = currentStep === index;
            const isComplete = currentStep > index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : isComplete
                    ? 'bg-zinc-900/50 border-zinc-800'
                    : 'bg-zinc-900/30 border-zinc-800/50'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : isComplete
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-800/50 text-zinc-600'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <span className={`flex-1 text-left text-sm font-medium transition-all ${
                  isActive || isComplete ? 'text-white' : 'text-zinc-600'
                }`}>
                  {step.label}
                </span>

                {/* Loading Indicator */}
                {isActive && (
                  <motion.div
                    className="flex gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-indigo-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          delay: i * 0.15,
                          repeat: Infinity
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Check Mark */}
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-sm text-zinc-500"
        >
          Connecting to Neural Core...
        </motion.div>
      </div>

      {/* Ambient Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
