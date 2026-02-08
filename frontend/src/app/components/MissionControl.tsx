import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Calendar, Clock, TrendingUp, CheckCircle2, 
  Flame, Activity, Lock, Plus, Pencil, X, Save
} from 'lucide-react';
import type { MissionData } from '../App';

interface MissionControlProps {
  missionData: MissionData;
  roadmap: any;
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
  status: 'completed' | 'current' | 'locked';
}

const storageKey = (goal: string) => `pathpilot:${goal.replace(/\s+/g, '_')}:v2`;

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
      const match = key.match(/d(\d+)-t/);
      if (match) {
        const d = parseInt(match[1]);
        dayCounts[d] = (dayCounts[d] || 0) + 1;
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

export default function MissionControl({ missionData, roadmap }: MissionControlProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [heatmapCells, setHeatmapCells] = useState<any[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const saved = loadState(missionData.goal);
    
    // 1. Parse Tasks
    let aiTasks: Task[] = [];
    if (roadmap?.plan) {
      const plan = roadmap.plan;
      let rawLines: string[] = [];
      if (Array.isArray(plan.tasks)) rawLines = plan.tasks;
      else if (typeof plan.tasks === 'object') rawLines = (Object.values(plan.tasks).flat() as string[]);

      const parseDuration = (txt: string) => {
        const match = txt.match(/(\d+(?:\.\d+)?)\s*(?:hour|min)/i);
        return match ? parseFloat(match[1]) : 1;
      };

      rawLines.forEach((line, idx) => {
        const dayMatch = line.match(/Day\s*(\d+):/i);
        const dayNum = dayMatch ? parseInt(dayMatch[1]) : (idx + 1);
        const cleanLine = line.replace(/Day\s*\d+:\s*/i, '');
        const segments = cleanLine.split(/(?<=\))\s*(?:and|,)\s*/).map(t => t.trim()).filter(Boolean);

        segments.forEach((seg, subIdx) => {
           aiTasks.push({
             id: `d${dayNum}-t${subIdx}`, 
             title: seg,
             duration: parseDuration(seg),
             completed: !!saved.completed[`d${dayNum}-t${subIdx}`],
             day: dayNum
           });
        });
      });
    }

    // 2. Merge Custom Tasks
    const allTasks = [...aiTasks];
    if (saved.customTasks) {
       saved.customTasks.forEach((ct: Task) => {
         ct.completed = !!saved.completed[ct.id];
         allTasks.push(ct);
       });
    }

    // 3. Calculate Progress (Local Variable)
    const doneCount = allTasks.filter(t => t.completed).length;
    const currentProgress = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

    // 4. Milestones (Using currentProgress)
    if (roadmap?.plan?.milestones) {
       const msList = roadmap.plan.milestones.map((m: string, i: number) => {
          let status: 'completed' | 'current' | 'locked' = 'locked';
          const count = roadmap.plan.milestones.length;
          const phaseSize = 100 / count;
          const threshold = (i + 1) * phaseSize;
          const prevThreshold = i * phaseSize;

          if (currentProgress >= threshold) status = 'completed';
          else if (currentProgress >= prevThreshold) status = 'current';
          if (i === 0 && status === 'locked') status = 'current';
          
          return { id: `ms-${i}`, title: m, description: `Phase ${i+1}`, status };
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
    
    // Also update milestones dynamically
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

  const toggleTask = (taskId: string) => {
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
    const isCustom = editingTaskId.startsWith('custom-');
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
    const newTask: Task = { id: `custom-${Date.now()}`, title: "New Task", duration: 1, completed: false, day: selectedDay };
    const saved = loadState(missionData.goal);
    saved.customTasks.push(newTask);
    saveState(missionData.goal, saved.completed, saved.customTasks);
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    updateStats(newTasks, saved.completed);
    setEditingTaskId(newTask.id); setEditValue(newTask.title);
  };

  const deleteTask = (taskId: string) => {
     if (!taskId.startsWith('custom-')) return; 
     const saved = loadState(missionData.goal);
     saved.customTasks = saved.customTasks.filter((t: Task) => t.id !== taskId);
     delete saved.completed[taskId];
     saveState(missionData.goal, saved.completed, saved.customTasks);
     const newTasks = tasks.filter(t => t.id !== taskId);
     setTasks(newTasks);
     updateStats(newTasks, saved.completed);
  };

  const todayTasks = tasks.filter(t => t.day === selectedDay);

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
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

      <div className="flex w-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-900/30 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center"><Target className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">PathPilot</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
             <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-2xl font-bold">{streak}</div><div className="text-xs text-zinc-500">Days Active</div></div>
             <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-2xl font-bold">{totalProgress}%</div><div className="text-xs text-zinc-500">Progress</div></div>
          </div>
          <div className="mb-8">
             <div className="flex items-center gap-2 text-zinc-400 mb-3"><Activity className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">Activity Log</span></div>
             <div className="grid grid-cols-7 gap-1 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                {heatmapCells.map((cell, i) => <div key={i} className={`w-full aspect-square rounded-sm ${cell.intensity} transition-colors duration-500`}/>)}
             </div>
          </div>
          
          {/* Header moved outside scrolling area to prevent overlap */}
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Mission Roadmap</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="relative space-y-0 ml-2">
               <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-zinc-800"></div>
               {milestones.map((m) => (
                 <div key={m.id} className="relative pl-10 pb-8 last:pb-0">
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 bg-black transition-colors ${m.status === 'completed' ? 'border-green-500/20 text-green-500' : m.status === 'current' ? 'border-indigo-500/20 text-indigo-500' : 'border-zinc-800 text-zinc-600'}`}>
                       {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : m.status === 'current' ? <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" /> : <Lock className="w-3 h-3" />}
                    </div>
                    <div className={m.status === 'locked' ? 'opacity-50 blur-[0.5px]' : 'opacity-100'}>
                       <h4 className="text-sm font-medium text-zinc-200">{m.title}</h4>
                       <span className="text-xs text-zinc-500">{m.description}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8"><h2 className="text-3xl font-bold mb-2">Today's Mission</h2><div className="text-zinc-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Day {selectedDay}</div></div>
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <button key={day} onClick={() => setSelectedDay(day)} className={`min-w-[4rem] h-16 rounded-xl border transition-all flex flex-col items-center justify-center ${selectedDay === day ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                    <span className="text-xs opacity-60">Day</span><span className="text-xl font-bold">{day}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3 mb-8">
                {todayTasks.map((task) => (
                  <div key={task.id} className="group flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors">
                     <button onClick={() => toggleTask(task.id)} className={`mt-1 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${task.completed ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                     </button>
                     <div className="flex-1">
                        {editingTaskId === task.id ? (
                           <div className="flex gap-2"><input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="bg-zinc-800 text-white px-2 py-1 rounded w-full border border-indigo-500/50 outline-none" /><button onClick={saveEdit} className="p-1 bg-indigo-500 rounded text-white"><Save className="w-4 h-4" /></button></div>
                        ) : (
                           <div className="flex justify-between items-start group">
                              <span onDoubleClick={() => startEditing(task)} className={`text-sm md:text-base cursor-text ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditing(task)} className="text-zinc-500 hover:text-indigo-400"><Pencil className="w-3.5 h-3.5" /></button>
                                {task.id.startsWith('custom-') && <button onClick={() => deleteTask(task.id)} className="text-zinc-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                           </div>
                        )}
                        <div className="mt-1 flex gap-2"><span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> {task.duration}h</span></div>
                     </div>
                  </div>
                ))}
              </div>
              <button onClick={addTask} className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Task</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
