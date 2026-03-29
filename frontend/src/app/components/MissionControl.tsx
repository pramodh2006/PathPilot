import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Calendar, Clock, TrendingUp, CheckCircle2, 
  Flame, Activity, Lock, Plus, Pencil, X, Save, RefreshCw, LogOut, BarChart2
} from 'lucide-react';
import type { MissionData } from '../App';

interface MissionControlProps {
  missionData: MissionData;
  roadmap: any;
  onLogout?: () => void;
}

interface Task {
  id: number | string;
  title: string;
  duration: number;
  completed: boolean;
  day: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
}

const storageKey = (goal: string) => `pathpilot:${goal.replace(/\s+/g, '_')}:v3`;

// Use environment variable for the backend API
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const loadState = (goal: string) => {
  try { 
    return JSON.parse(localStorage.getItem(storageKey(goal)) || '{"completed":{}, "customTasks":[]}'); 
  } catch { return { completed: {}, customTasks: [] }; }
};

const saveState = (goal: string, completed: any, customTasks: any[]) => {
  localStorage.setItem(storageKey(goal), JSON.stringify({ completed, customTasks }));
};

const getHeatmapData = (completedMap: any) => {
  const dayCounts: Record<string, number> = {};
  Object.keys(completedMap).forEach(key => {
    if (completedMap[key]) {
      const match = String(key).match(/d(\d+)-t/);
      if (match) {
        const d = parseInt(match[1]);
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      } else {
        dayCounts[1] = (dayCounts[1] || 0) + 1;
      }
    }
  });

  const cells = [];
  for (let i = 0; i < 28; i++) {
    const dayNum = i + 1; 
    const count = dayCounts[dayNum] || 0;
    let intensity = 'bg-zinc-900'; 
    if (count > 0) intensity = 'bg-green-900/60';
    if (count > 2) intensity = 'bg-green-600/80';
    if (count > 4) intensity = 'bg-green-500';
    cells.push({ dayNum, intensity });
  }
  return cells;
};

const parseTimelineToDays = (timeline: string): number => {
  if (!timeline) return 30;
  const lower = timeline.toLowerCase();
  const match = lower.match(/\d+/);
  if (!match) return 30;
  const num = parseInt(match[0]);
  if (lower.includes('month')) return num * 30;
  if (lower.includes('week')) return num * 7;
  if (lower.includes('day')) return num;
  return 30;
};

export default function MissionControl({ missionData, roadmap, onLogout }: MissionControlProps) {
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    let newWidth = e.clientX;
    if (newWidth < 280) newWidth = 280;
    if (newWidth > 600) newWidth = 600;
    setSidebarWidth(newWidth);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; 
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [heatmapCells, setHeatmapCells] = useState<any[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  const targetDays = Math.max(
    parseTimelineToDays(missionData?.targetTimeline || '30 days'),
    roadmap?.total_days || 0
  );

  useEffect(() => {
    const saved = loadState(missionData.goal);
    let aiTasks: Task[] = [];
    if (roadmap?.plan?.tasks) {
      aiTasks = roadmap.plan.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        duration: t.duration || 1.0,
        completed: !!saved.completed[t.id],
        day: t.day
      }));
    }

    const allTasks = [...aiTasks];
    if (saved.customTasks) {
      saved.customTasks.forEach((ct: Task) => {
        ct.completed = !!saved.completed[ct.id];
        allTasks.push(ct);
      });
    }

    const doneCount = allTasks.filter(t => t.completed).length;
    const currentProgress = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

    if (roadmap?.plan?.milestones) {
      const msList = roadmap.plan.milestones.map((m: string, i: number) => {
        const count = roadmap.plan.milestones.length;
        const phaseSize = 100 / count;
        const threshold = (i + 1) * phaseSize;
        const prevThreshold = i * phaseSize;
        let status: 'completed' | 'current' | 'locked' = 'locked';
        if (currentProgress >= threshold) status = 'completed';
        else if (currentProgress >= prevThreshold) status = 'current';
        if (i === 0 && status === 'locked') status = 'current';
        return { id: `ms-${i}`, title: m, description: `Phase ${i + 1}`, status };
      });
      setMilestones(msList);
    }

    setTasks(allTasks);
    setTotalProgress(currentProgress);
    setHeatmapCells(getHeatmapData(saved.completed));
    const activeDays = new Set(allTasks.filter(t => t.completed).map(t => t.day)).size;
    setStreak(activeDays);
  }, [roadmap, missionData.goal]);

  const updateStats = (currentTasks: Task[], completedMap: any) => {
    const doneCount = currentTasks.filter(t => t.completed).length;
    const progress = currentTasks.length ? Math.round((doneCount / currentTasks.length) * 100) : 0;
    setTotalProgress(progress);
    setHeatmapCells(getHeatmapData(completedMap));
    const activeDays = new Set(currentTasks.filter(t => t.completed).map(t => t.day)).size;
    setStreak(activeDays);

    if (milestones.length > 0) {
      setMilestones(prev => prev.map((m, i) => {
        const count = prev.length;
        const phaseSize = 100 / count;
        const threshold = (i + 1) * phaseSize;
        const prevThreshold = i * phaseSize;
        let status: 'completed' | 'current' | 'locked' = 'locked';
        if (progress >= threshold) status = 'completed';
        else if (progress >= prevThreshold) status = 'current';
        if (i === 0 && status === 'locked') status = 'current';
        return { ...m, status };
      }));
    }
  };

  const toggleTask = (taskId: string | number) => {
    const saved = loadState(missionData.goal);
    const newVal = !saved.completed[taskId];
    saved.completed[taskId] = newVal;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newVal } : t);
    setTasks(newTasks);
    saveState(missionData.goal, saved.completed, saved.customTasks);
    updateStats(newTasks, saved.completed);
    if (newVal) { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 2000); }
  };

  const startEditing = (task: Task) => { setEditingTaskId(task.id); setEditValue(task.title); };

  const saveEdit = () => {
    if (!editingTaskId) return;
    const isCustom = String(editingTaskId).startsWith('custom-');
    const saved = loadState(missionData.goal);
    let newTasks = [...tasks];
    if (isCustom) {
      saved.customTasks = saved.customTasks.map((t: Task) => t.id === editingTaskId ? { ...t, title: editValue } : t);
      newTasks = newTasks.map(t => t.id === editingTaskId ? { ...t, title: editValue } : t);
    } else {
      newTasks = newTasks.map(t => t.id === editingTaskId ? { ...t, title: editValue } : t);
    }
    setTasks(newTasks);
    if (isCustom) saveState(missionData.goal, saved.completed, saved.customTasks);
    setEditingTaskId(null);
  };

  const addTask = () => {
    const newTask: Task = { id: `custom-${Date.now()}`, title: 'New Task', duration: 1, completed: false, day: selectedDay };
    const saved = loadState(missionData.goal);
    saved.customTasks.push(newTask);
    saveState(missionData.goal, saved.completed, saved.customTasks);
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    updateStats(newTasks, saved.completed);
    setEditingTaskId(newTask.id);
    setEditValue(newTask.title);
  };

  const deleteTask = (taskId: string | number) => {
    if (!String(taskId).startsWith('custom-')) return;
    const saved = loadState(missionData.goal);
    saved.customTasks = saved.customTasks.filter((t: Task) => t.id !== taskId);
    delete saved.completed[taskId];
    saveState(missionData.goal, saved.completed, saved.customTasks);
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    updateStats(newTasks, saved.completed);
  };

  const highestDay = tasks.reduce((max, t) => Math.max(max, t.day), 0);
  const displayDays = Math.max(14, highestDay, targetDays);

  const generateNextPhase = async () => {
    if (!roadmap?.roadmap_id) return;
    setIsExtending(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/plan/extend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          roadmap_id: roadmap.roadmap_id,
          goal: missionData.goal,
          hours_per_day: missionData.hoursPerDay || 2,
          start_day: highestDay + 1,
          target_days: targetDays
        })
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
        }
        throw new Error("Failed to extend roadmap");
      }
      const data = await response.json();
      if (data.status === 'success' && data.new_tasks) {
        setTasks(prev => [...prev, ...data.new_tasks]);
      }
    } catch (err) {
      console.error('Failed to extend roadmap', err);
    } finally {
      setIsExtending(false);
    }
  };

  const todayTasks = tasks.filter(t => t.day === selectedDay);

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">PathPilot</span>
        </div>
        <div className="flex gap-2">
          {!isDesktop && (
            <button onClick={() => setIsMobileSidebarOpen(false)} className="text-zinc-500 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          )}
          {onLogout && isDesktop && (
            <button onClick={onLogout} className="text-zinc-500 hover:text-zinc-300 transition-colors p-2" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-2xl font-bold">{streak}</div>
          <div className="text-xs text-zinc-500">Days Active</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-2xl font-bold">{totalProgress}%</div>
          <div className="text-xs text-zinc-500">Progress</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-zinc-400 mb-3">
          <Activity className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Activity Log</span>
        </div>
        <div className="grid grid-cols-7 gap-1 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          {heatmapCells.map((cell, i) => (
            <div key={i} className={`w-full aspect-square rounded-sm ${cell.intensity} transition-colors duration-500`} />
          ))}
        </div>
      </div>

      <h3 className="text-sm font-medium text-zinc-300 mb-4">Mission Roadmap</h3>

      <div className="pr-2 pb-8">
        <div className="relative space-y-0 ml-2">
          <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-zinc-800"></div>
          {milestones.map((m) => (
            <div key={m.id} className="relative pl-10 pb-8 last:pb-0">
              <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 bg-black transition-colors ${m.status === 'completed' ? 'border-green-500/20 text-green-500' : m.status === 'current' ? 'border-indigo-500/20 text-indigo-500' : 'border-zinc-800 text-zinc-600'}`}>
                {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : m.status === 'current' ? <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" /> : <Lock className="w-3 h-3" />}
              </div>
              <div className={m.status === 'locked' ? 'opacity-50 blur-[0.5px]' : ''}>
                <h4 className="text-sm font-medium text-zinc-200">{m.title}</h4>
                <span className="text-xs text-zinc-500">{m.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isDesktop && onLogout && (
        <button onClick={onLogout} className="mt-auto mb-4 w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row md:h-screen md:overflow-hidden font-sans relative">
      
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 p-8 rounded-3xl flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-white">Task Complete!</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDesktop && (
        <div 
          className="flex flex-col border-r border-zinc-800 bg-zinc-900/30 p-6 h-full overflow-y-auto"
          style={{ width: sidebarWidth, flexShrink: 0 }}
        >
          <SidebarContent />
        </div>
      )}

      <AnimatePresence>
        {!isDesktop && isMobileSidebarOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-black flex flex-col p-6 overflow-y-auto"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {isDesktop && (
        <div 
          onMouseDown={handleMouseDown}
          className={`w-1 cursor-col-resize flex-shrink-0 transition-colors z-50 ${
            isDragging ? 'bg-indigo-500' : 'bg-zinc-800 hover:bg-zinc-600'
          }`}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
        
        {!isDesktop && (
          <div className="bg-zinc-900/50 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">PathPilot</span>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Stats & Roadmap
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Today's Mission</h2>
                <div className="text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Day {selectedDay} of {targetDays}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-sm text-zinc-400 mb-1">{tasks.filter(t => t.completed).length} / {tasks.length} tasks done</div>
                <div className="w-full sm:w-40 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${totalProgress}%` }}></div>
                </div>
              </div>
            </div>

            <div 
              className="flex gap-3 mb-8 overflow-x-auto pb-2" 
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
              
              {Array.from({ length: displayDays }, (_, i) => i + 1).map((day) => {
                const hasTasks = tasks.some(t => t.day === day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`min-w-[4rem] h-16 rounded-xl border transition-all flex flex-col items-center justify-center relative flex-shrink-0 ${
                      selectedDay === day
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-xs opacity-60">Day</span>
                    <span className="text-xl font-bold">{day}</span>
                    {hasTasks && selectedDay !== day && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 mb-8">
              {todayTasks.length === 0 ? (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-zinc-400 mb-4">No tasks generated for Day {selectedDay} yet.</p>
                  {selectedDay > highestDay && highestDay < targetDays && (
                    <button
                      onClick={generateNextPhase}
                      disabled={isExtending}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 mx-auto transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${isExtending ? 'animate-spin' : ''}`} />
                      {isExtending ? 'Generating...' : 'Generate Next Phase'}
                    </button>
                  )}
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div key={task.id} className="group flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-1 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-zinc-400'}`}
                    >
                      {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1">
                      {editingTaskId === task.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="bg-zinc-800 text-white px-2 py-1 rounded w-full border border-indigo-500/50 outline-none"
                          />
                          <button onClick={saveEdit} className="p-1 bg-indigo-500 rounded text-white flex-shrink-0">
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <span
                            onDoubleClick={() => startEditing(task)}
                            className={`text-sm md:text-base cursor-text ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}
                          >
                            {task.title}
                          </span>
                          <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                            <button onClick={() => startEditing(task)} className="text-zinc-500 hover:text-indigo-400">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {String(task.id).startsWith('custom-') && (
                              <button onClick={() => deleteTask(task.id)} className="text-zinc-500 hover:text-red-400">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 mt-2 rounded flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" /> {task.duration}h
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={addTask}
              className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task to Day {selectedDay}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}