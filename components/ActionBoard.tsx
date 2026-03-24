import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchTasks, updateTask, deleteTask, saveTask } from '../services/firebaseUtils';
import { Task } from '../types';
import { Check, Clock, Plus, Trash2, X, CalendarDays, ListChecks, Target, AlertCircle, Loader2, LayoutGrid } from 'lucide-react';

export const ActionBoard = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'canvas'>('list');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [zoom, setZoom] = useState(1);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(prev => Math.min(Math.max(0.5, prev - e.deltaY * 0.005), 3));
    }
  };

  const handleCanvasDoubleClick = async (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: 'New Imperative',
      completed: false,
      createdAt: Date.now(),
      tags: ['manual'],
      position: { x, y }
    };
    
    setTasks(prev => [...prev, newTask]);
    
    try {
      await saveTask(user?.uid || 'ghost', newTask);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Imperative Anchored.", icon: <Target size={14} /> } }));
    } catch (e) {
      console.error("Task persistence failed", e);
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const fetchedTasks = await fetchTasks(user?.uid || 'ghost');
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [user]);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      dueDate: newTaskDate || undefined,
      createdAt: Date.now(),
      platform: newTaskPlatform || undefined,
      tags: ['manual']
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setNewTaskDate('');
    setNewTaskPlatform('');
    
    try {
      await saveTask(user?.uid || 'ghost', newTask);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Imperative Anchored.", icon: <Target size={14} /> } }));
    } catch (e) {
      console.error("Task persistence failed", e);
    }
  };

  const handleTaskDragEnd = async (taskId: string, info: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Default center if no position exists
    const currentX = task.position?.x ?? 5000;
    const currentY = task.position?.y ?? 5000;
    
    const newPos = {
      x: currentX + info.offset.x / zoom,
      y: currentY + info.offset.y / zoom
    };
    
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, position: newPos } : t));
    try {
      await updateTask(user?.uid || 'ghost', taskId, { position: newPos });
    } catch (e) {
      console.error("Failed to update task position", e);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
    try {
      await updateTask(user?.uid || 'ghost', taskId, { completed: !currentStatus });
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setTasks(prev => prev.filter(t => t.id !== taskToDelete));
    const idToDelete = taskToDelete;
    setTaskToDelete(null);
    try {
      await deleteTask(user?.uid || 'ghost', idToDelete);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Imperative Purged.", icon: <Trash2 size={14} /> } }));
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });
  }, [tasks, filter]);

  const tasksByDate = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const sorted = [...filteredTasks].sort((a,b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    
    sorted.forEach(t => {
      const key = t.dueDate || 'Unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filteredTasks]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-stone-200 font-mono transition-colors duration-1000 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <AnimatePresence>
        {taskToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-sm w-full space-y-6 border border-stone-800">
              <div className="space-y-2">
                <h3 className="font-serif italic text-xl text-stone-200">Purge Imperative?</h3>
                <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">This action cannot be undone.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setTaskToDelete(null)} className="flex-1 py-3 text-stone-500 hover:text-stone-300 font-mono text-[9px] uppercase tracking-widest font-bold border border-stone-800 hover:border-stone-600 transition-all">Cancel</button>
                <button onClick={confirmDeleteTask} className="flex-1 py-3 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold transition-all">Confirm</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-6 md:p-12 pb-8 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-stone-800 relative z-20 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-500">
            <Target size={14} />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Action Board</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl italic tracking-tighter text-stone-100 leading-none">Strategic Imperatives.</h2>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button onClick={() => setViewMode('list')} className={`p-3 border rounded-sm transition-all ${viewMode === 'list' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}`} title="List View">
            <ListChecks size={16} />
          </button>
          <button onClick={() => setViewMode('calendar')} className={`p-3 border rounded-sm transition-all ${viewMode === 'calendar' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}`} title="Timeline View">
            <CalendarDays size={16} />
          </button>
          <button onClick={() => setViewMode('canvas')} className={`p-3 border rounded-sm transition-all ${viewMode === 'canvas' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}`} title="Canvas View">
            <LayoutGrid size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative z-10 overflow-hidden">
        {viewMode === 'canvas' ? (
          <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a]" onWheel={handleWheel}>
            <motion.div
              ref={canvasRef}
              drag
              dragConstraints={{ left: -5000, right: 5000, top: -5000, bottom: 5000 }}
              className="absolute w-[10000px] h-[10000px] left-[-5000px] top-[-5000px] cursor-grab active:cursor-grabbing"
              style={{ 
                backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                scale: zoom
              }}
              onDoubleClick={handleCanvasDoubleClick}
            >
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  drag
                  dragMomentum={false}
                  onDragEnd={(e, info) => handleTaskDragEnd(task.id, info)}
                  initial={{ 
                    x: task.position?.x ?? 5000 + Math.random() * 200, 
                    y: task.position?.y ?? 5000 + Math.random() * 200 
                  }}
                  style={{ position: 'absolute' }}
                  className={`w-64 p-4 border rounded-sm shadow-xl cursor-grab active:cursor-grabbing ${task.completed ? 'bg-stone-900/50 border-stone-800/50' : 'bg-[#111] border-stone-700 hover:border-emerald-500/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.completed); }} 
                      className={`mt-1 w-4 h-4 border rounded-sm flex items-center justify-center transition-all shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 hover:border-emerald-500'}`}
                    >
                      {task.completed && <Check size={12} className="text-black stroke-[3]" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-serif text-sm ${task.completed ? 'text-stone-600 line-through italic' : 'text-stone-200'}`}>
                        {task.text}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {task.dueDate && (
                          <span className="font-mono text-[8px] flex items-center gap-1 uppercase tracking-widest text-stone-500">
                            <Clock size={8} /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.platform && (
                          <span className="px-1.5 py-0.5 rounded-sm font-mono text-[7px] uppercase tracking-widest bg-stone-800 text-stone-400">
                            {task.platform}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }} 
                      className="text-stone-600 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-12 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Add Task Input */}
              <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-sm flex flex-col md:flex-row gap-4 items-center">
            <input 
              value={newTaskText} 
              onChange={e => setNewTaskText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="Define a new imperative..." 
              className="flex-1 w-full bg-transparent border-b border-stone-800 py-2 font-serif italic text-lg focus:outline-none focus:border-emerald-500 text-stone-300 placeholder:text-stone-700" 
            />
            <div className="flex w-full md:w-auto gap-4">
              <input 
                type="text" 
                value={newTaskPlatform} 
                onChange={e => setNewTaskPlatform(e.target.value)} 
                placeholder="Platform (e.g. TikTok)"
                className="w-1/2 md:w-32 bg-transparent border-b border-stone-800 py-2 font-mono text-[10px] uppercase tracking-widest focus:outline-none focus:border-emerald-500 text-stone-500 placeholder:text-stone-700"
              />
              <input 
                type="date" 
                value={newTaskDate} 
                onChange={e => setNewTaskDate(e.target.value)} 
                className="w-1/2 md:w-32 bg-transparent border-b border-stone-800 py-2 font-mono text-[10px] focus:outline-none focus:border-emerald-500 text-stone-500"
              />
              <button 
                onClick={handleAddTask} 
                disabled={!newTaskText.trim()} 
                className="px-4 py-2 bg-emerald-500 text-black rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold disabled:opacity-30 hover:bg-emerald-400 transition-colors flex items-center gap-2"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 border-b border-stone-800 pb-4">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-mono text-[10px] uppercase tracking-widest font-bold transition-colors ${filter === f ? 'text-emerald-500' : 'text-stone-600 hover:text-stone-400'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 flex justify-center"><Loader2 size={32} className="animate-spin text-stone-600" /></div>
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredTasks.map(task => (
                      <motion.div 
                        key={task.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group flex items-start gap-4 p-4 border rounded-sm transition-all ${task.completed ? 'bg-stone-900/30 border-stone-800/50' : 'bg-stone-900/80 border-stone-800 hover:border-emerald-500/30'}`}
                      >
                        <button 
                          onClick={() => toggleTask(task.id, task.completed)} 
                          className={`mt-1 w-5 h-5 border rounded-sm flex items-center justify-center transition-all shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 hover:border-emerald-500'}`}
                        >
                          {task.completed && <Check size={14} className="text-black stroke-[3]" />}
                        </button>
                        
                        <div className="flex-1 flex flex-col gap-2">
                          <span className={`font-serif text-lg transition-all ${task.completed ? 'text-stone-600 line-through italic' : 'text-stone-200'}`}>
                            {task.text}
                          </span>
                          
                          <div className="flex flex-wrap gap-3 items-center">
                            {task.dueDate && (
                              <span className={`font-mono text-[9px] flex items-center gap-1.5 uppercase tracking-widest ${task.completed ? 'text-stone-700' : 'text-stone-500'}`}>
                                <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.platform && (
                              <span className={`px-2 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-widest ${task.completed ? 'bg-stone-800/50 text-stone-600' : 'bg-stone-800 text-stone-400'}`}>
                                {task.platform}
                              </span>
                            )}
                            {task.tags?.map(tag => (
                              <span key={tag} className={`px-2 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-widest ${task.completed ? 'text-stone-700 border border-stone-800/50' : 'text-stone-500 border border-stone-800'}`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => setTaskToDelete(task.id)} 
                          className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredTasks.length === 0 && (
                    <div className="py-24 text-center opacity-30 border border-dashed border-stone-800 rounded-sm flex flex-col items-center justify-center gap-4">
                      <AlertCircle size={32} className="text-stone-500" />
                      <p className="font-serif italic text-lg text-stone-500">No imperatives found.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.keys(tasksByDate).length === 0 && (
                    <div className="py-24 text-center opacity-30 border border-dashed border-stone-800 rounded-sm flex flex-col items-center justify-center gap-4">
                      <CalendarDays size={32} className="text-stone-500" />
                      <p className="font-serif italic text-lg text-stone-500">Timeline Empty.</p>
                    </div>
                  )}
                  {Object.entries(tasksByDate).sort().map(([date, groupTasks]) => (
                    <div key={date} className="relative pl-8">
                      {/* Timeline line */}
                      <div className="absolute left-[11px] top-2 bottom-[-48px] w-px bg-stone-800 last:bottom-0" />
                      
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-stone-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      </div>
                      
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-500 mb-6 sticky top-0 bg-[#0a0a0a] py-2 z-10">
                        {date === 'Unscheduled' ? 'Backlog / Unscheduled' : new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      
                      <div className="space-y-4">
                        {groupTasks.map(task => (
                          <div key={task.id} className={`group flex items-start gap-4 p-4 border rounded-sm transition-all ${task.completed ? 'bg-stone-900/30 border-stone-800/50' : 'bg-stone-900/80 border-stone-800 hover:border-emerald-500/30'}`}>
                            <button 
                              onClick={() => toggleTask(task.id, task.completed)} 
                              className={`mt-1 w-5 h-5 border rounded-sm flex items-center justify-center transition-all shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 hover:border-emerald-500'}`}
                            >
                              {task.completed && <Check size={14} className="text-black stroke-[3]" />}
                            </button>
                            
                            <div className="flex-1 flex flex-col gap-2">
                              <span className={`font-serif text-lg transition-all ${task.completed ? 'text-stone-600 line-through italic' : 'text-stone-200'}`}>
                                {task.text}
                              </span>
                              
                              <div className="flex flex-wrap gap-3 items-center">
                                {task.platform && (
                                  <span className={`px-2 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-widest ${task.completed ? 'bg-stone-800/50 text-stone-600' : 'bg-stone-800 text-stone-400'}`}>
                                    {task.platform}
                                  </span>
                                )}
                                {task.tags?.map(tag => (
                                  <span key={tag} className={`px-2 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-widest ${task.completed ? 'text-stone-700 border border-stone-800/50' : 'text-stone-500 border border-stone-800'}`}>
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => setTaskToDelete(task.id)} 
                              className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}
  </div>
</div>
  );
};
