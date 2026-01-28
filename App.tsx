import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, BarChart, ListTodo, Briefcase, GraduationCap, User,
  CircleCheck, Trophy, Flame, Plus, Trash2, 
  ChevronLeft, ChevronRight, Sparkles, X, Lightbulb, 
  Calendar, Bell, Send, Cake, Gift, Star, 
  SunDim, DollarSign, Heart, AlertCircle, MapPin, ChevronDown, ChevronUp, Cloud, Check,
  CheckSquare, CirclePlus, Settings, Info, Globe, Github, Rocket, MousePointer2, FileCode, Folder, Key, ExternalLink, AlertTriangle, RefreshCw, Menu
} from 'lucide-react';
import { 
  Task, TaskStatus, Event, Transaction, BrainDump, 
  UserStats, View, TaskCategory, Birthday, Reminder, JournalEntry
} from './types';
import { organizeBrainDump } from './services/geminiService';

// --- CONSTANTS ---
const XP_LEVEL_THRESHOLD = 100;
const XP_PER_TASK = 10;

// --- UTILS ---
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getFullDateString = (dateStr: string) => {
  return new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- SUB-COMPONENTS ---

const NavItem = ({ id, icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex flex-col items-center gap-1 p-2 transition-all flex-1 rounded-2xl ${active ? 'text-black shadow-md bg-gray-50/50' : 'text-gray-300'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

const DayStrip = ({ selectedDate, onSelectDate }: any) => {
  const days = useMemo(() => {
    const d = new Date(selectedDate.replace(/-/g, '/'));
    const start = new Date(d);
    start.setDate(d.getDate() - 3);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  return (
    <div className="flex justify-between px-6 py-4">
      {days.map((date) => {
        const dStr = formatDate(date);
        const isActive = dStr === selectedDate;
        return (
          <button 
            key={dStr} 
            onClick={() => onSelectDate(dStr)}
            className="flex flex-col items-center gap-1 group"
          >
            <span className={`text-[10px] font-medium uppercase tracking-tighter ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isActive ? 'text-gray-900 font-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const TaskTimelineItem = ({ task, index, total, onToggle, isFirst }: any) => {
  const isFeatured = index === 0 && task.status !== TaskStatus.DONE;
  
  return (
    <div className="flex gap-4 min-h-[100px] relative">
      {/* Vertical Line Container */}
      <div className="flex flex-col items-center w-8">
        <div className={`w-0.5 flex-1 bg-gray-100 ${isFirst ? 'opacity-0' : ''}`} />
        <button 
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-black border-black text-white' : isFeatured ? 'bg-black border-black' : 'bg-white border-gray-200'}`}
        >
          {task.status === TaskStatus.DONE && <Check size={12} />}
        </button>
        <div className={`w-0.5 flex-1 bg-gray-100 ${index === total - 1 ? 'opacity-0' : ''}`} />
      </div>

      {/* Task Content Card */}
      <div className="flex-1 pb-8">
        <div className={`p-5 rounded-3xl transition-all relative ${isFeatured ? 'bg-[#FFD700] shadow-xl shadow-yellow-100' : 'bg-white'}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className={`text-lg font-black font-heading ${isFeatured ? 'text-gray-900' : 'text-gray-800'}`}>
                {task.text}
              </h3>
              {task.notes && (
                <p className={`text-xs font-medium leading-relaxed opacity-60 ${isFeatured ? 'text-gray-900' : 'text-gray-500'}`}>
                  {task.notes}
                </p>
              )}
            </div>
            <span className={`text-[10px] font-bold ${isFeatured ? 'text-gray-900' : 'text-gray-400'}`}>
              {index === 0 ? '8:15 AM' : index === 1 ? '11:15 AM' : '7:05 PM'}
            </span>
          </div>
          
          {isFeatured && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
              className="absolute bottom-4 right-4 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Check size={20} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('focusflow_tasks') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('focusflow_transactions') || '[]'));
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>(() => JSON.parse(localStorage.getItem('focusflow_braindumps') || '[]'));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => JSON.parse(localStorage.getItem('focusflow_journal') || '[]'));
  const [stats, setStats] = useState<UserStats>(() => JSON.parse(localStorage.getItem('focusflow_stats') || '{"xp":0,"level":1,"streak":1,"lastActive":"' + formatDate(new Date()) + '"}'));

  const [isOrganizing, setIsOrganizing] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');

  useEffect(() => {
    localStorage.setItem('focusflow_tasks', JSON.stringify(tasks));
    localStorage.setItem('focusflow_transactions', JSON.stringify(transactions));
    localStorage.setItem('focusflow_braindumps', JSON.stringify(brainDumps));
    localStorage.setItem('focusflow_journal', JSON.stringify(journalEntries));
    localStorage.setItem('focusflow_stats', JSON.stringify(stats));
  }, [tasks, transactions, brainDumps, journalEntries, stats]);

  const addXP = (amount: number) => {
    setStats(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      if (newXP >= XP_LEVEL_THRESHOLD) { newXP -= XP_LEVEL_THRESHOLD; newLevel += 1; }
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const addTask = (text: string, category: TaskCategory = 'General', date = selectedDate) => {
    if (!text.trim()) return;
    setTasks(prev => [{ id: crypto.randomUUID(), text, status: TaskStatus.TODO, date, category, xpAwarded: false, subtasks: [], notes: 'Discussion and planning' }, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status !== TaskStatus.DONE && !t.xpAwarded) {
          addXP(XP_PER_TASK);
          return { ...t, status: TaskStatus.DONE, xpAwarded: true };
        }
        return { ...t, status: t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE };
      }
      return t;
    }));
  };

  const handleOrganizeBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    setIsOrganizing(true);
    const result = await organizeBrainDump(brainDumpText);
    if (result && result.tasks) {
      result.tasks.forEach((t: any) => {
        addTask(t.text, (t.category as TaskCategory) || 'General');
      });
      setBrainDumpText('');
      setActiveView('home');
    }
    setIsOrganizing(false);
  };

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return (
          <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
            {/* Header Area */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center">
              <button className="p-2 text-gray-400 hover:text-black transition-colors">
                <ChevronLeft size={28} />
              </button>
              <button className="p-2 text-gray-400 hover:text-black transition-colors">
                <Menu size={28} />
              </button>
            </header>

            {/* Date Section */}
            <section className="px-8 mt-4 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-400">{getFullDateString(selectedDate)}</p>
                <h1 className="text-4xl font-black font-heading tracking-tighter text-gray-900">Today</h1>
              </div>
              <button 
                onClick={() => setIsQuickMemoOpen(true)}
                className="bg-black text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all"
              >
                <Plus size={18} /> Add Task
              </button>
            </section>

            {/* Day Picker */}
            <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-8 pb-32">
              {dayTasks.length > 0 ? (
                <div className="space-y-0">
                  {dayTasks.map((task, idx) => (
                    <TaskTimelineItem 
                      key={task.id} 
                      task={task} 
                      index={idx} 
                      total={dayTasks.length} 
                      onToggle={handleToggleTask}
                      isFirst={idx === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"><Plus size={32}/></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No tasks for this day</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'trackers':
        return (
          <div className="p-8 space-y-10 bg-white h-full overflow-y-auto pb-40 no-scrollbar app-container">
            <header className="flex justify-between items-center"><h2 className="text-3xl font-black font-heading uppercase tracking-tighter">Finance</h2></header>
            <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl">
              <span className="text-[10px] uppercase tracking-widest opacity-60">Total Balance</span>
              <h3 className="text-5xl font-black font-heading mt-2">${transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0).toLocaleString()}</h3>
            </div>
          </div>
        );
      case 'work':
      case 'school':
        return (
          <div className="p-8 pt-12 space-y-10 bg-white h-full app-container">
            <h2 className="text-4xl font-black font-heading uppercase tracking-tighter">{activeView}</h2>
          </div>
        );
      case 'me':
        return (
          <div className="p-8 pt-10 space-y-10 bg-white h-full app-container">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-4xl mb-2 border border-gray-100 shadow-md">💼</div>
              <h2 className="text-3xl font-black font-heading text-gray-800 uppercase tracking-tighter">Profile</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-orange-500 font-bold bg-orange-50 px-4 py-2 rounded-full border border-orange-100"><Flame size={18} fill="currentColor" /><span className="text-sm">{stats.streak}d</span></div>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-full border border-blue-100"><Trophy size={18} fill="currentColor" /><span className="text-sm">Lv. {stats.level}</span></div>
              </div>
            </div>
          </div>
        );
      case 'lists':
        return (
          <div className="p-8 bg-white h-full flex flex-col app-container">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black font-heading uppercase tracking-tighter">Brain Dump</h2><button onClick={handleOrganizeBrainDump} disabled={isOrganizing || !brainDumpText.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-black uppercase tracking-widest text-[10px] disabled:opacity-30">{isOrganizing ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />} AI Organize</button></div>
            <textarea value={brainDumpText} onChange={(e) => setBrainDumpText(e.target.value)} placeholder="Messy ideas..." className="w-full flex-1 bg-transparent border-none focus:ring-0 text-3xl font-medium text-gray-700 resize-none outline-none text-center" />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 overflow-x-hidden selection:bg-black selection:text-white">
      <main className="max-w-md mx-auto h-screen relative bg-white border-x border-gray-100 shadow-2xl overflow-hidden app-container">{renderView()}</main>
      
      {/* CAPTURE MODAL */}
      <div className={`fixed inset-0 z-[200] bg-white transition-all transform ${isQuickMemoOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="px-8 pt-12 flex justify-between items-center"><h2 className="text-3xl font-black font-heading uppercase">Add Task</h2><button onClick={() => setIsQuickMemoOpen(false)} className="p-3 text-gray-300 hover:text-black"><X size={28} /></button></header>
        <div className="px-8 flex-1 py-10">
          <textarea 
            autoFocus 
            className="w-full h-1/2 bg-transparent border-none text-2xl font-medium outline-none placeholder:text-gray-100" 
            placeholder="What needs to be done?" 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                addTask(e.currentTarget.value.trim());
                e.currentTarget.value = '';
                setIsQuickMemoOpen(false);
              }
            }}
          />
        </div>
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xs px-8">
          <button onClick={() => setIsQuickMemoOpen(false)} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[11px]">Save Task</button>
        </div>
      </div>

      <nav className="max-w-md mx-auto fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 flex justify-between px-2 pt-2 pb-8 z-50">
        <NavItem id="home" icon={Home} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <NavItem id="trackers" icon={BarChart} label="Money" active={activeView === 'trackers'} onClick={setActiveView} />
        <NavItem id="work" icon={Briefcase} label="Work" active={activeView === 'work'} onClick={setActiveView} />
        <NavItem id="school" icon={GraduationCap} label="School" active={activeView === 'school'} onClick={setActiveView} />
        <NavItem id="lists" icon={ListTodo} label="Dump" active={activeView === 'lists'} onClick={setActiveView} />
        <NavItem id="me" icon={User} label="Me" active={activeView === 'me'} onClick={setActiveView} />
      </nav>
    </div>
  );
};

export default App;