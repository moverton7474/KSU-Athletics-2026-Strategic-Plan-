
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { PILLARS_DATA } from './constants';
import { 
  CheckSquare, Flag, ArrowRight, BrainCircuit, FileText, Download, 
  Table as TableIcon, ClipboardList, CloudUpload, CloudCheck, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, RefreshCw, Database, Activity, Info, Copy, Check, ExternalLink, Terminal, Zap
} from 'lucide-react';
import { StrategicAssistant } from './components/StrategicAssistant';
import { TTSPlayer } from './components/TTSPlayer';
import { StrategicPillar, ActionItem } from './types';
import { supabase } from './lib/supabase';

const PLAN_KEY = 'ksu_2026_strategic_plan';

const App: React.FC = () => {
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA);
  const [activePillarId, setActivePillarId] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'local' | 'no-schema'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const fetchPlan = useCallback(async () => {
    const local = localStorage.getItem(PLAN_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const merged = PILLARS_DATA.map(p => {
          const savedPillar = parsed.find((sp: any) => sp.id === p.id);
          return savedPillar ? { ...p, actions: savedPillar.actions } : p;
        });
        setPillars(merged);
      } catch (e) { console.error("Local Storage Parse Error:", e); }
    }

    if (!supabase) {
      setSyncStatus('local');
      return;
    }

    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase.from('strategic_plan').select('data, updated_at').eq('plan_key', PLAN_KEY).single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not found')) {
          setSyncStatus('no-schema');
          return;
        }
        if (error.code === 'PGRST116') {
          setSyncStatus('idle');
          return;
        }
        throw error;
      }

      if (data && data.data) {
        const parsed = data.data;
        const merged = PILLARS_DATA.map(p => {
          const savedPillar = parsed.find((sp: any) => sp.id === p.id);
          return savedPillar ? { ...p, actions: savedPillar.actions } : p;
        });
        setPillars(merged);
        setLastSaved(new Date(data.updated_at).toLocaleTimeString());
        setSyncStatus('saved');
      } else {
        setSyncStatus('idle');
      }
    } catch (e: any) { 
      setSyncStatus('error'); 
    }
  }, []);

  const syncData = useCallback(async (manual = false, dataToSaveOverride?: any) => {
    const currentData = dataToSaveOverride || pillars.map(p => ({ id: p.id, actions: p.actions }));
    localStorage.setItem(PLAN_KEY, JSON.stringify(currentData));
    
    if (!supabase || syncStatus === 'no-schema') return;
    
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('strategic_plan').upsert({ 
        plan_key: PLAN_KEY, 
        data: currentData, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'plan_key' });
      
      if (error) throw error;
      
      const now = new Date().toLocaleTimeString();
      setLastSaved(now);
      setSyncStatus('saved');
      if (manual) {
        setDiagMessage(`Cloud Sync Verified at ${now}`);
        setTimeout(() => setDiagMessage(null), 3000);
      }
    } catch (e: any) { 
      setSyncStatus('error'); 
    }
  }, [pillars, syncStatus]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleNavigate = useCallback((id: number) => {
    setActivePillarId(id);
    setNotification({ message: `Navigated to Pillar #${id + 1}`, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleAddAction = useCallback((pillarId: number, newAction: any) => {
    const item: ActionItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newAction.task || "New Initiative",
      owner: newAction.owner || "Staff",
      priority: (newAction.priority as any) || "Medium",
      source: "Strategic AI",
      status: "Added via Voice"
    };

    setPillars(prev => {
      const updated = prev.map(p => p.id === pillarId ? { ...p, actions: [item, ...p.actions] } : p);
      const syncPayload = updated.map(up => ({ id: up.id, actions: up.actions }));
      syncData(false, syncPayload);
      return updated;
    });

    setNotification({ message: `Action added: ${item.task}`, type: 'success' });
    setTimeout(() => setNotification(null), 5000);
  }, [syncData]);

  const handleUpdateAction = useCallback((pillarId: number, updatedItem: ActionItem) => {
    setPillars(prev => {
      const updated = prev.map(p => p.id === pillarId ? { ...p, actions: p.actions.map(a => a.id === updatedItem.id ? updatedItem : a) } : p);
      const syncPayload = updated.map(up => ({ id: up.id, actions: up.actions }));
      syncData(false, syncPayload);
      return updated;
    });
    setNotification({ message: `Objective Updated: ${updatedItem.task}`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  }, [syncData]);

  const handleDeleteAction = useCallback((pillarId: number, taskName: string) => {
    setPillars(prev => {
      const updated = prev.map(p => p.id === pillarId ? { ...p, actions: p.actions.filter(a => !a.task.toLowerCase().includes(taskName.toLowerCase())) } : p);
      const syncPayload = updated.map(up => ({ id: up.id, actions: up.actions }));
      syncData(false, syncPayload);
      return updated;
    });
    setNotification({ message: "Action Item Removed", type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  }, [syncData]);

  const handleUpdatePriority = useCallback((pillarId: number, taskName: string, newPriority: string) => {
    setPillars(prev => {
      const updated = prev.map(p => p.id === pillarId ? { ...p, actions: p.actions.map(a => a.task.toLowerCase().includes(taskName.toLowerCase()) ? { ...a, priority: newPriority as any } : a) } : p);
      const syncPayload = updated.map(up => ({ id: up.id, actions: up.actions }));
      syncData(false, syncPayload);
      return updated;
    });
  }, [syncData]);

  const activePillar = pillars.find(p => p.id === activePillarId) || pillars[0];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-4 rounded-2xl shadow-4xl flex items-center space-x-3 border-2 animate-in slide-in-from-top-4 duration-500 ${
          notification.type === 'success' ? 'bg-black text-yellow-500 border-yellow-500' : 'bg-gray-100 text-black border-gray-200'
        }`}>
          <Zap size={20} className={notification.type === 'success' ? 'animate-pulse' : ''} />
          <span className="font-black uppercase tracking-widest text-[10px]">{notification.message}</span>
        </div>
      )}

      <Header />
      
      <div className="bg-gray-100 px-6 py-2 flex flex-col md:flex-row justify-between items-center border-b border-gray-200 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <Database className="w-3 h-3" />
            <span>Project ID: <span className="text-black">pygjtypiblbkuvhltigv</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
            {syncStatus === 'syncing' && <><CloudUpload className="w-3 h-3 text-blue-500 animate-pulse" /> <span className="text-blue-600">Syncing...</span></>}
            {syncStatus === 'saved' && <><CloudCheck className="w-3 h-3 text-green-500" /> <span className="text-green-600">Synced {lastSaved && `(${lastSaved})`}</span></>}
            {syncStatus === 'no-schema' && <><AlertTriangle className="w-3 h-3 text-red-500" /> <span className="text-red-600 font-black tracking-widest">OFFLINE</span></>}
            {syncStatus === 'idle' && <><Database className="w-3 h-3 text-gray-400" /> <span className="text-gray-500">Connected</span></>}
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <button onClick={() => syncData(true)} className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-black">
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <main className="flex flex-1 flex-col md:flex-row max-w-[1920px] mx-auto w-full relative">
        <Sidebar pillars={pillars} activeId={activePillarId} onSelect={setActivePillarId} />
        
        <div className="flex-1 p-4 md:p-10 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-12">
            <section className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <span className={`inline-flex items-center px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                  Pillar #{activePillar.id + 1}
                </span>
                <TTSPlayer title={activePillar.title} text={activePillar.description} />
              </div>

              <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8">
                {activePillar.title}
              </h2>

              <div className="bg-black text-white rounded-[2.5rem] p-8 border-t-[12px] border-yellow-500 shadow-4xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-4">Core Objective</h3>
                <p className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9]">
                  {activePillar.enablingAction}
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-end border-b-2 border-gray-50 pb-4">
                <h3 className="text-2xl font-black text-black uppercase tracking-tighter">Tactical Priorities</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activePillar.actions.length} Items</span>
              </div>
              <div className="grid gap-4">
                {activePillar.actions.map((action) => (
                  <ActionCard 
                    key={action.id} 
                    action={action} 
                    onUpdate={(updated) => handleUpdateAction(activePillar.id, updated)}
                  />
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
        syncStatus={syncStatus}
      />
    </div>
  );
};

export default App;
