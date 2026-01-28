import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, BarChart3, ListTodo, Briefcase, GraduationCap, User,
  CheckCircle2, Trophy, Flame, Plus, Trash2, 
  ChevronLeft, ChevronRight, Sparkles, X, Lightbulb, 
  Calendar as CalendarIcon, Bell, Send, Cake, Gift, Star, 
  SunDim, DollarSign, Heart, AlertCircle, MapPin, ChevronDown, ChevronUp, Cloud, Check,
  SquareCheck, PlusCircle, Settings, Info, Download, Globe, Github, Rocket, MousePointer2, FileCode, Folder, Key, ExternalLink, AlertTriangle, RefreshCw
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

const getDayName = (dateStr: string) => {
  return new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long' });
};

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const HOLIDAYS: Record<string, { name: string; icon: React.ReactNode }> = {
  '2025-01-01': { name: 'New Year\'s Day', icon: <Sparkles size={14} /> },
  '2025-12-25': { name: 'Christmas Day', icon: <Gift size={14} /> },
};

const generateYearData = (year: number) => {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const days = [];
    const date = new Date(year, m, 1);
    while (date.getMonth() === m) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    months.push({
      name: new Date(year, m, 1).toLocaleDateString('en-US', { month: 'long' }),
      days
    });
  }
  return months;
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

const TimelineView = ({ onSelectDate, tasks, events, birthdays, onOpenReview, todayDate, view, scrollRef }: any) => {
  const currentYear = todayDate.getFullYear();
  const yearData = useMemo(() => generateYearData(currentYear), [currentYear]);
  const todayStr = formatDate(todayDate);

  useEffect(() => {
    const centerToday = () => {
      if (scrollRef.current) {
        const todayEl = scrollRef.current.querySelector('[data-today="true"]');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    };
    centerToday();
    const timeout = setTimeout(centerToday, 100);
    return () => clearTimeout(timeout);
  }, [view, scrollRef]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 no-scrollbar">
      <div className="flex flex-col items-center gap-10 pb-40">
        {yearData.map((month) => (
          <div key={month.name} className="w-full flex flex-col items-center gap-6">
            <h2 className="text-5xl font-black font-heading text-gray-100 uppercase tracking-tighter text-center select-none w-full my-8">
              {month.name}
            </h2>
            <div className="w-full space-y-6">
              {month.days.map((date) => {
                const dateStr = formatDate(date);
                const isToday = dateStr === todayStr;
                const isPast = date < todayDate && !isToday;
                const hasActivity = tasks.some((t: Task) => t.date === dateStr) || events.some((e: Event) => e.date === dateStr);
                const isSunday = date.getDay() === 0;
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const holiday = HOLIDAYS[dateStr];
                const bday = birthdays.find((b: any) => b.date === dateStr.slice(5));

                return (
                  <React.Fragment key={dateStr}>
                    <div 
                      className={`flex flex-col items-center transition-all cursor-pointer group ${isPast ? 'opacity-70' : 'opacity-100'}`} 
                      onClick={() => onSelectDate(dateStr)}
                      data-today={isToday}
                    >
                      <div className="h-6 flex items-center justify-center mb-1">
                        {holiday ? <div className="text-orange-500">{holiday.icon}</div> : bday ? <div className="text-pink-500"><Cake size={18}/></div> : null}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isToday ? 'text-[#10b981]' : 'text-gray-300'}`}>{dayName}</span>
                      <div className="relative">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center font-heading text-2xl font-bold transition-all border ${isToday ? 'bg-[#10b981] text-white border-none shadow-xl shadow-emerald-200 scale-110 z-10' : isPast ? 'bg-gray-50 text-gray-300 border-gray-100 shadow-sm' : 'bg-white text-gray-800 border-gray-100 group-hover:border-black shadow-md'}`}>
                          {isToday ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black uppercase mb-[-4px] leading-tight">{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                              <span>{date.getDate()}</span>
                            </div>
                          ) : (
                            date.getDate()
                          )}
                          {hasActivity && !isToday && <div className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full border-2 border-white" />}
                        </div>
                        {isToday && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-50 text-[#10b981] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            Today
                          </div>
                        )}
                      </div>
                    </div>
                    {isSunday && (
                      <div className="w-full max-w-[200px] mx-auto my-4">
                        <button onClick={(e) => { e.stopPropagation(); onOpenReview(date); }} className={`w-full bg-white border border-dashed border-gray-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group shadow-sm ${isPast ? 'opacity-80' : ''}`}>
                          <BarChart3 size={14} className="group-hover:rotate-12 transition-transform" /><span className="text-[11px] font-black uppercase tracking-widest">Weekly Review</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [dailyMode, setDailyMode] = useState<'log' | 'journal'>('log');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [expandedTrId, setExpandedTrId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // States
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('focusflow_tasks') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('focusflow_transactions') || '[]'));
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>(() => JSON.parse(localStorage.getItem('focusflow_braindumps') || '[]'));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => JSON.parse(localStorage.getItem('focusflow_journal') || '[]'));
  const [stats, setStats] = useState<UserStats>(() => JSON.parse(localStorage.getItem('focusflow_stats') || '{"xp":0,"level":1,"streak":1,"lastActive":"' + formatDate(new Date()) + '"}'));

  const [isOrganizing, setIsOrganizing] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickMoneyDesc, setQuickMoneyDesc] = useState('');

  const [checklist, setChecklist] = useState(() => JSON.parse(localStorage.getItem('focusflow_checklist') || '{"github":false,"vercel":false,"apiKey":false,"install":false}'));

  useEffect(() => {
    localStorage.setItem('focusflow_checklist', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('focusflow_tasks', JSON.stringify(tasks));
    localStorage.setItem('focusflow_transactions', JSON.stringify(transactions));
    localStorage.setItem('focusflow_braindumps', JSON.stringify(brainDumps));
    localStorage.setItem('focusflow_journal', JSON.stringify(journalEntries));
    localStorage.setItem('focusflow_stats', JSON.stringify(stats));

    setIsSyncing(true);
    const syncTimer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(syncTimer);
  }, [tasks, transactions, brainDumps, journalEntries, stats]);

  const addXP = (amount: number) => {
    setStats(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      if (newXP >= XP_LEVEL_THRESHOLD) { newXP -= XP_LEVEL_THRESHOLD; newLevel += 1; }
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const jumpToToday = () => {
    if (timelineScrollRef.current) {
      const todayEl = timelineScrollRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleResetData = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete everything locally. This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const addTask = (text: string, category: TaskCategory = 'General', date = selectedDate || formatDate(now)) => {
    if (!text.trim()) return;
    setTasks(prev => [{ id: crypto.randomUUID(), text, status: TaskStatus.TODO, date, category, xpAwarded: false, subtasks: [], notes: '' }, ...prev]);
  };

  const addTransaction = (description: string, date = selectedDate || formatDate(now)) => {
    if (!description.trim()) return;
    setTransactions(prev => [{ id: crypto.randomUUID(), amount: 0, description: description.trim(), type: 'expense', date, category: 'General', notes: '' }, ...prev]);
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
        const cat = (t.category as TaskCategory) || 'General';
        setTasks(prev => [...prev, { id: crypto.randomUUID(), text: t.text, status: TaskStatus.TODO, date: formatDate(now), category: cat, xpAwarded: false, subtasks: [], notes: '' }]);
      });
      setBrainDumps(p => [{ id: crypto.randomUUID(), content: brainDumpText, timestamp: Date.now() }, ...p]);
      setBrainDumpText('');
      setActiveView('home');
    }
    setIsOrganizing(false);
  };

  const dayOfYear = getDayOfYear(now);
  const yearProgress = (dayOfYear / 365) * 100;

  const renderView = () => {
    switch (activeView) {
      case 'home':
        if (selectedDate) {
          const dayTransactions = transactions.filter(t => t.date === selectedDate);
          const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const dayBalance = dayIncome - dayExpense;
          const dayJournal = journalEntries.find(j => j.date === selectedDate) || { date: selectedDate, grateful: ['', '', ''], thoughts: '' };
          const dayTasks = tasks.filter(t => t.date === selectedDate);
          
          return (
            <div className="flex flex-col h-full bg-[#F9FAFB] animate-in slide-in-from-right duration-300">
              <header className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
                <button onClick={() => { setSelectedDate(null); setDailyMode('log'); }} className="p-3 text-gray-300 hover:text-black hover:bg-white rounded-full transition-all active:scale-90"><ChevronLeft size={24} /></button>
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-4">
                     <button onClick={() => {
                       const current = new Date(selectedDate.replace(/-/g, '/'));
                       current.setDate(current.getDate() - 1);
                       setSelectedDate(formatDate(current));
                     }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-black transition-colors"><ChevronLeft size={20}/></button>
                     <h2 className="text-2xl font-black font-heading text-gray-800 tracking-tight uppercase">{getDayName(selectedDate)}</h2>
                     <button onClick={() => {
                       const current = new Date(selectedDate.replace(/-/g, '/'));
                       current.setDate(current.getDate() + 1);
                       setSelectedDate(formatDate(current));
                     }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-black transition-colors"><ChevronRight size={20}/></button>
                   </div>
                   <div className="flex items-center justify-center gap-2 text-gray-400 mt-1">
                    <CalendarIcon size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{getFullDateString(selectedDate)}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`} />
                </div>
              </header>

              <div className="flex justify-center gap-8 mb-4 border-b border-gray-100 mx-8 shrink-0">
                <button onClick={() => setDailyMode('log')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${dailyMode === 'log' ? 'text-black' : 'text-gray-300'}`}>
                  Daily Log {dailyMode === 'log' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                </button>
                <button onClick={() => setDailyMode('journal')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${dailyMode === 'journal' ? 'text-black' : 'text-gray-300'}`}>
                  Journal {dailyMode === 'journal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40">
                {dailyMode === 'log' ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50/50">
                      <div className="flex items-center gap-3 text-gray-800 mb-6"><SquareCheck size={22} /><h3 className="text-lg font-bold font-heading">To-Do</h3></div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 py-2 px-1 group border-b border-gray-50 mb-2">
                          <Plus size={18} className="text-gray-300 shrink-0" />
                          <input type="text" value={quickTaskText} onChange={(e) => setQuickTaskText(e.target.value)} placeholder="Add task" className="flex-1 bg-transparent border-none p-0 text-[15px] font-medium text-gray-700 placeholder:text-gray-300 outline-none focus:ring-0" onKeyDown={(e) => { if (e.key === 'Enter' && quickTaskText.trim()) { addTask(quickTaskText.trim(), 'General', selectedDate!); setQuickTaskText(''); } }} />
                        </div>
                        <div className="space-y-1">
                          {dayTasks.map(task => (
                            <div key={task.id} className="group">
                              <div className="flex items-center gap-3 py-2">
                                <div onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="flex-1 cursor-pointer h-8 flex items-center">
                                  {expandedTaskId === task.id ? (
                                    <input autoFocus className="flex-1 bg-transparent border-none p-0 text-[15px] font-medium text-gray-700 outline-none" value={task.text} onClick={(e) => e.stopPropagation()} onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? {...t, text: e.target.value} : t))} />
                                  ) : (
                                    <span className={`text-[15px] font-medium ${task.status === TaskStatus.DONE ? 'text-gray-300 line-through' : 'text-gray-700'}`}>{task.text}</span>
                                  )}
                                </div>
                                <button onClick={() => handleToggleTask(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-black border-black text-white' : 'border-gray-200'}`}>
                                  {task.status === TaskStatus.DONE && <CheckCircle2 size={14} />}
                                </button>
                              </div>
                              {expandedTaskId === task.id && (
                                <div className="mt-2 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                                   <textarea className="w-full bg-transparent border-none text-sm text-gray-600 outline-none h-24 resize-none leading-relaxed" placeholder="Notes..." value={task.notes || ''} onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? {...t, notes: e.target.value} : t))} />
                                   <button onClick={() => { if(window.confirm('Delete task?')) { setTasks(p => p.filter(t => t.id !== task.id)); setExpandedTaskId(null); } }} className="text-gray-300 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50/50">
                      <div className="flex items-center gap-3 text-gray-800 mb-6"><DollarSign size={22} /><h3 className="text-lg font-bold font-heading">Money</h3></div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 py-2 px-1 border-b border-gray-50 mb-2">
                          <Plus size={18} className="text-gray-300" />
                          <input type="text" value={quickMoneyDesc} onChange={(e) => setQuickMoneyDesc(e.target.value)} placeholder="Add transaction" className="flex-1 bg-transparent border-none text-[15px] font-medium text-gray-700 placeholder:text-gray-300 outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && quickMoneyDesc.trim()) { addTransaction(quickMoneyDesc.trim(), selectedDate!); setQuickMoneyDesc(''); } }} />
                        </div>
                        <div className="space-y-1">
                          {dayTransactions.map(tr => (
                            <div key={tr.id}>
                              <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setExpandedTrId(expandedTrId === tr.id ? null : tr.id)}>
                                <span className="flex-1 text-[15px] font-medium text-gray-700">{tr.description}</span>
                                <span className={`text-[15px] font-bold ${tr.type === 'income' ? 'text-emerald-500' : 'text-gray-800'}`}>{tr.type === 'income' ? '+' : '-'}${tr.amount}</span>
                              </div>
                              {expandedTrId === tr.id && (
                                <div className="mt-2 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner grid grid-cols-2 gap-4">
                                  <input type="number" className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold" value={tr.amount === 0 ? '' : tr.amount} placeholder="0" onChange={(e) => setTransactions(prev => prev.map(t => t.id === tr.id ? {...t, amount: parseFloat(e.target.value) || 0} : t))} />
                                  <div className="flex bg-white rounded-xl p-1 border border-gray-100 h-[38px]">
                                    <button onClick={() => setTransactions(prev => prev.map(t => t.id === tr.id ? {...t, type: 'expense'} : t))} className={`flex-1 rounded-lg text-[10px] font-black uppercase ${tr.type === 'expense' ? 'bg-red-500 text-white' : 'text-gray-300'}`}>Exp</button>
                                    <button onClick={() => setTransactions(prev => prev.map(t => t.id === tr.id ? {...t, type: 'income'} : t))} className={`flex-1 rounded-lg text-[10px] font-black uppercase ${tr.type === 'income' ? 'bg-emerald-500 text-white' : 'text-gray-300'}`}>Inc</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-gray-50 mt-4 flex justify-between items-center"><span className="text-[13px] font-black uppercase text-gray-800 tracking-tighter">Day Balance</span><span className={`text-xl font-black ${dayBalance >= 0 ? 'text-gray-800' : 'text-red-400'}`}>${dayBalance.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-50/50 min-h-[550px] flex flex-col mb-10">
                    <div className="flex items-center gap-3 mb-8 text-black opacity-40"><Heart size={20} fill="currentColor" /><h3 className="text-lg font-bold font-heading">Reflection</h3></div>
                    <div className="space-y-6">
                      <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">3 Gratitudes:</p>
                      {[0, 1, 2].map(i => (
                        <input key={i} value={dayJournal.grateful[i] || ''} onChange={e => {
                          const newG = [...dayJournal.grateful]; newG[i] = e.target.value;
                          const updatedEntries = journalEntries.filter(j => j.date !== selectedDate);
                          setJournalEntries([...updatedEntries, { ...dayJournal, grateful: newG }]);
                        }} placeholder="..." className="w-full border-b border-gray-50 focus:border-black py-2 outline-none text-sm font-medium" />
                      ))}
                      <div className="pt-10">
                        <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mb-4">Thoughts:</p>
                        <textarea value={dayJournal.thoughts} onChange={e => {
                          const updatedEntries = journalEntries.filter(j => j.date !== selectedDate);
                          setJournalEntries([...updatedEntries, { ...dayJournal, thoughts: e.target.value }]);
                        }} placeholder="Write freely..." className="w-full min-h-[300px] bg-transparent border-none text-sm font-medium text-gray-600 resize-none outline-none leading-relaxed" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full bg-white overflow-hidden relative app-container">
            <header className="p-8 pt-12 pb-4 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <h1 className="text-6xl font-black font-heading text-gray-800 tracking-tighter uppercase">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</h1>
                <div className="flex items-center gap-2 text-gray-400">
                  <SunDim size={18} className="text-orange-400" /><span className="text-xs font-black uppercase tracking-widest">CLEAR</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={jumpToToday} className="w-16 h-16 bg-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 hover:scale-110 active:scale-95 transition-transform"><CalendarIcon size={30} fill="currentColor" /></button>
                <button onClick={() => setIsQuickMemoOpen(true)} className="w-16 h-16 bg-yellow-400 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-yellow-100 hover:scale-110 active:scale-95 transition-transform"><Lightbulb size={32} fill="currentColor" /></button>
              </div>
            </header>
            <TimelineView scrollRef={timelineScrollRef} todayDate={now} onSelectDate={setSelectedDate} tasks={tasks} events={[]} birthdays={[]} view={activeView} />
          </div>
        );
      case 'work':
      case 'school':
        const category: TaskCategory = activeView === 'work' ? 'Work' : 'School';
        const filteredTasks = tasks.filter(t => t.category === category);
        return (
          <div className="p-8 pt-12 space-y-10 bg-white h-full overflow-y-auto pb-40 no-scrollbar app-container">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black font-heading uppercase tracking-tighter">{activeView} Space</h2>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Productivity Zone</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeView === 'work' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                {activeView === 'work' ? <Briefcase size={24} /> : <GraduationCap size={24} />}
              </div>
            </header>
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
               <div className="flex items-center gap-3 border-b border-gray-200/50 pb-4">
                 <PlusCircle size={20} className="text-gray-400" />
                 <input type="text" placeholder={`Add ${activeView} task...`} className="bg-transparent border-none text-sm font-bold outline-none flex-1" onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value.trim()) { addTask(e.currentTarget.value.trim(), category); e.currentTarget.value = ''; }}} />
               </div>
               <div className="space-y-3">
                 {filteredTasks.length === 0 ? (
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] text-center py-10">Empty Space</p>
                 ) : (
                   filteredTasks.map(task => (
                     <div key={task.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                       <button onClick={() => handleToggleTask(task.id)} className={`w-5 h-5 rounded-lg border-2 shrink-0 ${task.status === TaskStatus.DONE ? 'bg-black border-black text-white' : 'border-gray-200'}`}>
                         {task.status === TaskStatus.DONE && <CheckCircle2 size={12} />}
                       </button>
                       <span className={`text-sm font-bold flex-1 ${task.status === TaskStatus.DONE ? 'text-gray-300 line-through' : 'text-gray-700'}`}>{task.text}</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        );
      case 'me':
        return (
          <div className="p-8 pt-10 space-y-10 bg-white h-full overflow-y-auto pb-40 no-scrollbar app-container">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-4xl mb-2 border border-gray-100 shadow-md">💼</div>
              <h2 className="text-3xl font-black font-heading text-gray-800 uppercase tracking-tighter">Entrepreneur Profile</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-orange-500 font-bold bg-orange-50 px-4 py-2 rounded-full border border-orange-100"><Flame size={18} fill="currentColor" /><span className="text-sm">{stats.streak}d</span></div>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-full border border-blue-100"><Trophy size={18} fill="currentColor" /><span className="text-sm">Lv. {stats.level}</span></div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3"><span>XP Level Progress</span><span>{stats.xp}%</span></div>
               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden"><div className="bg-black h-full transition-all duration-500" style={{ width: `${stats.xp}%` }} /></div>
            </div>
            <div className="space-y-6 pt-6">
              <div className="flex justify-between items-center px-2"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Launch Checklist</h3><button onClick={() => setIsHelpOpen(true)} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1"><Info size={12} /> Instructions</button></div>
              <div className="grid gap-3">
                {[
                  { id: 'github', label: 'Push to Root', icon: Github, color: 'bg-gray-100', desc: 'No subfolders in repo' },
                  { id: 'apiKey', label: 'Set API_KEY', icon: Settings, color: 'bg-purple-50', desc: 'Add key to Vercel Envs' },
                ].map(item => (
                  <button key={item.id} onClick={() => setChecklist((p: any) => ({ ...p, [item.id]: !p[item.id] }))} className={`bg-white p-5 rounded-3xl border flex items-center gap-4 ${checklist[item.id] ? 'border-emerald-200 opacity-60' : 'border-gray-50 shadow-sm'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${checklist[item.id] ? 'bg-emerald-500 text-white' : item.color}`}><item.icon size={20}/></div>
                    <div className="flex-1 text-left"><p className={`text-sm font-bold ${checklist[item.id] ? 'text-emerald-700' : 'text-gray-800'}`}>{item.label}</p><p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{item.desc}</p></div>
                  </button>
                ))}
              </div>
              <button onClick={handleResetData} className="w-full bg-white border border-red-50 text-red-400 p-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"><RefreshCw size={14}/> Reset All Local Data</button>
            </div>
          </div>
        );
      case 'trackers':
        return (
          <div className="p-8 space-y-10 bg-white h-full overflow-y-auto pb-40 no-scrollbar app-container">
            <header className="flex justify-between items-center"><h2 className="text-3xl font-black font-heading uppercase tracking-tighter">Finance Tracker</h2><div className="flex items-center gap-2 text-emerald-500"><Cloud size={16} /><Check size={12} /></div></header>
            <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl border border-gray-900">
              <span className="text-[10px] uppercase tracking-widest opacity-60">Total Balance</span>
              <h3 className="text-5xl font-black font-heading mt-2">${transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0).toLocaleString()}</h3>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Recent Activity</span>
              {transactions.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-3xl shadow-sm">
                  <div><span className="font-bold text-sm text-gray-700 block">{t.description}</span><span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{t.date}</span></div>
                  <span className={`font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-gray-800'}`}>{t.type === 'income' ? '+' : '-'}${t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'lists':
        return (
          <div className="p-8 bg-white h-full flex flex-col app-container">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black font-heading uppercase tracking-tighter">Brain Dump</h2><button onClick={handleOrganizeBrainDump} disabled={isOrganizing || !brainDumpText.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-black uppercase tracking-widest text-[10px] disabled:opacity-30">{isOrganizing ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />} {isOrganizing ? 'Organizing...' : 'AI Organize'}</button></div>
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
        <header className="px-8 pt-12 flex justify-between items-center"><h2 className="text-3xl font-black font-heading uppercase">Quick Memo</h2><button onClick={() => setIsQuickMemoOpen(false)} className="p-3 text-gray-300 hover:text-black"><X size={28} /></button></header>
        <div className="px-8 flex-1 py-10"><textarea autoFocus className="w-full h-1/2 bg-transparent border-none text-2xl font-medium outline-none placeholder:text-gray-100" placeholder="Capture thought..." /></div>
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xs px-8"><button onClick={() => setIsQuickMemoOpen(false)} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[11px]">Save Memory</button></div>
      </div>

      {/* SETUP GUIDE */}
      <div className={`fixed inset-0 z-[300] bg-white flex flex-col items-center transition-all transform ${isHelpOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="w-full max-w-md px-8 pt-12 pb-6 flex justify-between items-center"><h2 className="text-2xl font-black font-heading uppercase tracking-tighter">Setup Instructions</h2><button onClick={() => setIsHelpOpen(false)} className="p-3 text-gray-300 hover:text-black rounded-full bg-gray-50"><X size={24} /></button></header>
        <div className="w-full max-w-md flex-1 overflow-y-auto px-8 pb-32 no-scrollbar space-y-8">
           <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-3">
             <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest"><Globe size={14} /> Step 1: GitHub Root</div>
             <p className="text-xs font-medium text-emerald-800 leading-relaxed">Open your <code>FocusFlow</code> folder on your PC. Drag <strong>ALL</strong> the individual files directly into GitHub. Do NOT drag the folder itself.</p>
           </div>
           <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 space-y-3">
             <div className="flex items-center gap-2 text-purple-600 font-black uppercase text-[10px] tracking-widest"><Key size={14} /> Step 2: Environment Variable</div>
             <p className="text-xs font-medium text-purple-800 leading-relaxed">In Vercel Settings, add a variable named <code>API_KEY</code> and paste your Gemini key there. Then re-deploy.</p>
           </div>
           <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500">Required Files:</h4>
             <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 font-mono text-[11px] text-gray-600 space-y-1">
                <div>index.html</div><div>package.json</div><div>vercel.json</div><div>App.tsx</div><div>types.ts</div><div>index.tsx</div><div>services/geminiService.ts</div>
             </div>
           </div>
        </div>
      </div>

      <nav className="max-w-md mx-auto fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 flex justify-between px-2 pt-2 pb-8 z-50">
        <NavItem id="home" icon={Home} label="Home" active={activeView === 'home'} onClick={(v: any) => {setActiveView(v); setSelectedDate(null);}} />
        <NavItem id="trackers" icon={BarChart3} label="Money" active={activeView === 'trackers'} onClick={setActiveView} />
        <NavItem id="work" icon={Briefcase} label="Work" active={activeView === 'work'} onClick={setActiveView} />
        <NavItem id="school" icon={GraduationCap} label="School" active={activeView === 'school'} onClick={setActiveView} />
        <NavItem id="lists" icon={ListTodo} label="Dump" active={activeView === 'lists'} onClick={setActiveView} />
        <NavItem id="me" icon={User} label="Me" active={activeView === 'me'} onClick={setActiveView} />
      </nav>
    </div>
  );
};

export default App;