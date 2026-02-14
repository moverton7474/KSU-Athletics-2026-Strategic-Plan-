
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { PILLARS_DATA } from './constants';
import { CheckSquare, Flag, ArrowRight, BrainCircuit, FileText, Download, Table, ClipboardList, CloudUpload, CloudCheck, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StrategicAssistant } from './components/StrategicAssistant';
import { TTSPlayer } from './components/TTSPlayer';
import { StrategicPillar, ActionItem } from './types';
import { supabase } from './lib/supabase';

const PLAN_KEY = 'ksu_2026_strategic_plan';

const App: React.FC = () => {
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA);
  const [activePillarId, setActivePillarId] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'local'>('idle');

  useEffect(() => {
    const fetchPlan = async () => {
      if (!supabase) {
        const local = localStorage.getItem(PLAN_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const merged = PILLARS_DATA.map(p => {
              const savedPillar = parsed.find((sp: any) => sp.id === p.id);
              return savedPillar ? { ...p, actions: savedPillar.actions } : p;
            });
            setPillars(merged);
          } catch (e) { console.error(e); }
        }
        setSyncStatus('local');
        return;
      }
      try {
        const { data, error } = await supabase.from('strategic_plan').select('data').eq('plan_key', PLAN_KEY).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data && data.data) {
          const parsed = data.data;
          const merged = PILLARS_DATA.map(p => {
            const savedPillar = parsed.find((sp: any) => sp.id === p.id);
            return savedPillar ? { ...p, actions: savedPillar.actions } : p;
          });
          setPillars(merged);
          setSyncStatus('saved');
        }
      } catch (e) { setSyncStatus('error'); }
    };
    fetchPlan();
  }, []);

  useEffect(() => {
    const syncData = async () => {
      const dataToSave = pillars.map(p => ({ id: p.id, actions: p.actions }));
      localStorage.setItem(PLAN_KEY, JSON.stringify(dataToSave));
      if (!supabase) return;
      setSyncStatus('syncing');
      try {
        const { error } = await supabase.from('strategic_plan').upsert({ plan_key: PLAN_KEY, data: dataToSave, updated_at: new Date().toISOString() }, { onConflict: 'plan_key' });
        if (error) throw error;
        setSyncStatus('saved');
      } catch (e) { setSyncStatus('error'); }
    };
    const timer = setTimeout(syncData, 2000);
    return () => clearTimeout(timer);
  }, [pillars]);

  const activePillar = pillars.find(p => p.id === activePillarId) || pillars[0];

  const handleNavigate = useCallback((id: number) => {
    setActivePillarId(Math.max(0, Math.min(pillars.length - 1, id)));
  }, [pillars.length]);

  const handleAddAction = useCallback((pillarId: number, newAction: Partial<ActionItem>) => {
    const item: ActionItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newAction.task || "New Initiative",
      owner: newAction.owner || "Staff",
      priority: (newAction.priority as any) || "Medium",
      source: "Strategic Assistant",
      status: "Planning"
    };
    setPillars(prev => prev.map(p => p.id === pillarId ? { ...p, actions: [item, ...p.actions] } : p));
  }, []);

  const handleDeleteAction = useCallback((pillarId: number, taskName: string) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? { ...p, actions: p.actions.filter(a => !a.task.toLowerCase().includes(taskName.toLowerCase())) } : p));
  }, []);

  const handleUpdatePriority = useCallback((pillarId: number, taskName: string, newPriority: string) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? { ...p, actions: p.actions.map(a => a.task.toLowerCase().includes(taskName.toLowerCase()) ? { ...a, priority: newPriority as any } : a) } : p));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-yellow-500 selection:text-black print:bg-white">
      <div className="print:hidden">
        <Header />
        <div className="bg-gray-100 px-6 py-2 flex justify-end border-b border-gray-200">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
            {syncStatus === 'syncing' && <><CloudUpload className="w-3 h-3 text-blue-500 animate-pulse" /> <span className="text-blue-600">Syncing...</span></>}
            {syncStatus === 'saved' && <><CloudCheck className="w-3 h-3 text-green-500" /> <span className="text-green-600">Cloud Synced</span></>}
            {syncStatus === 'local' && <><AlertTriangle className="w-3 h-3 text-yellow-600" /> <span className="text-yellow-700">Local Only</span></>}
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col md:flex-row max-w-[1920px] mx-auto w-full relative">
        <div className="print:hidden">
          <Sidebar pillars={pillars} activeId={activePillarId} onSelect={setActivePillarId} />
        </div>

        <div className="flex-1 p-4 md:p-10 lg:p-16 animate-in fade-in slide-in-from-right-8 duration-1000 print:p-0">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePillar.metrics.map((m, i) => (
                <div key={i} className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-yellow-500 transition-all duration-500 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{m.label}</span>
                    <div className={`p-1.5 rounded-full ${m.trend === 'up' ? 'bg-green-100 text-green-600' : m.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                      {m.trend === 'up' ? <TrendingUp size={12} /> : m.trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <h4 className="text-3xl font-black text-black">{m.value}</h4>
                    <span className={`text-[10px] font-bold ${m.trend === 'up' ? 'text-green-600' : 'text-gray-400'}`}>{m.change}</span>
                  </div>
                </div>
              ))}
            </div>

            <section className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                    Strategic Pillar #{activePillar.id + 1}
                  </span>
                  <TTSPlayer title={activePillar.title} text={activePillar.description} />
                </div>
              </div>

              <h2 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8">
                {activePillar.title}
              </h2>

              <div className="bg-black text-white rounded-[3rem] p-10 shadow-4xl relative overflow-hidden group border-t-[16px] border-yellow-500 transition-all hover:translate-y-[-4px] duration-700">
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-6">Primary Power Objective</h3>
                  <p className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-[0.9] text-white">
                    {activePillar.enablingAction}
                  </p>
                  <p className="text-gray-400 text-lg font-medium italic border-l-4 border-yellow-500/30 pl-6 py-2 max-w-2xl">
                    "{activePillar.description}"
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex justify-between items-end border-b-4 border-gray-50 pb-8">
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter">Tactical Priorities</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{activePillar.actions.length} Total Targets</span>
              </div>
              <div className="grid gap-6">
                {activePillar.actions.map((action, idx) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <StrategicAssistant 
        pillars={pillars}
        onNavigate={handleNavigate}
        onAddAction={handleAddAction}
        onDeleteAction={handleDeleteAction}
        onUpdatePriority={handleUpdatePriority}
      />
    </div>
  );
};

export default App;
