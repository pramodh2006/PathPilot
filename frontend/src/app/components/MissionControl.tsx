import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Calendar, Clock, TrendingUp, CheckCircle2, Circle, 
  ChevronRight, ExternalLink, Flame, Award, MoreVertical,
  PlayCircle, PauseCircle, Settings
} from 'lucide-react';
import type { MissionData } from '../App';

interface MissionControlProps {
  missionData: MissionData;
  roadmap: any; // <--- The real plan from Flask
}

interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  day: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

export default function MissionControl({ missionData, roadmap }: MissionControlProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // --- PARSE REAL BACKEND DATA ---
  useEffect(() => {
    if (!roadmap || !roadmap.plan) return;

    const plan = roadmap.plan;

    // 1. Parse Tasks
    // Handle both Array format (AI) and Object format (Template)
    let rawTasks: string[] = [];
    if (Array.isArray(plan.tasks)) {
      rawTasks = plan.tasks;
    } else if (typeof plan.tasks === 'object') {
      rawTasks = Object.values(plan.tasks).flat() as string[];
    }

    const realTasks: Task[] = rawTasks.map((t, i) => ({
      id: `task-${i}`,
      title: t,
      duration: 1.5, // Default duration if not provided
      completed: false,
      day: 1 // Default to Day 1 for now (AI usually gives daily lists)
    }));

    // 2. Parse Milestones
    const realMilestones: Milestone[] = (plan.milestones || []).map((m: string, i: number) => ({
      id: `ms-${i}`,
      title: m,
      description: 'Key execution phase',
      progress: 0,
      totalTasks: Math.ceil(realTasks.length / (plan.milestones.length || 1)),
      completedTasks: 0
    }));

    setMilestones(realMilestones);
    setTasks(realTasks);
    setStreak(1); // Start with 1 day streak
    setTotalProgress(0);

  }, [roadmap]);

  // Toggle Task Logic
  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const newTasks = prev.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          if (newCompleted) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          }
          return { ...task, completed: newCompleted };
        }
        return task;
      });
      
      // Update Progress Stats
      const completedCount = newTasks.filter(t => t.completed).length;
      setTotalProgress(Math.round((completedCount / newTasks.length) * 100));
      
      return newTasks;
    });
  };

  const todayTasks = tasks; // Show all tasks for now (since AI gives a list)
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalHoursToday = todayTasks.reduce((sum, t) => sum + t.duration, 0);
  const completedHoursToday = todayTasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Celebration Effect */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1.5, rotate: 360 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 blur-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-zinc-900 flex flex-col bg-[#0A0A0A]">
          <div className="p-6 border-b border-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">PathPilot</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Active Mission</div>
              <div className="text-sm font-medium text-white">{missionData.goal}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-zinc-500">Streak</span>
                </div>
                <div className="text-lg font-semibold text-white">{streak} days</div>
              </div>
              <div className="px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-zinc-500">Progress</span>
                </div>
                <div className="text-lg font-semibold text-white">{totalProgress}%</div>
              </div>
            </div>
          </div>

          {/* Milestones List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Key Milestones</h3>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="font-medium text-white text-sm mb-1">{milestone.title}</div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2">Today's Mission</h1>
              <p className="text-zinc-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {todayTasks.length > 0 ? todayTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleTask(task.id)}
                  className={`group relative bg-zinc-900/50 hover:bg-zinc-900 border rounded-xl p-5 cursor-pointer transition-all ${
                    task.completed 
                      ? 'border-green-500/20 bg-green-500/5' 
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.completed ? 'bg-green-500 border-green-500' : 'border-zinc-700'
                    }`}>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-base font-medium ${task.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-zinc-500">Generating tasks...</div>
              )}
            </div>

            {/* Resources Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Recommended Resources</h2>
              <div className="grid grid-cols-2 gap-4">
                {(roadmap?.plan?.resources || []).map((url: string, index: number) => (
                  <a key={index} href={url} target="_blank" className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-indigo-400 hover:text-white truncate block">
                    {url}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
