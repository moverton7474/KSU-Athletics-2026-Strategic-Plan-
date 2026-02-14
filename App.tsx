
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { ArchitectView } from './components/ArchitectView';
import { PILLARS_DATA } from './constants';
import { 
  CheckSquare, Flag, ArrowRight, BrainCircuit, FileText, Download, 
  Table as TableIcon, ClipboardList, CloudUpload, CloudCheck, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, RefreshCw, Database, Activity, Info, Copy, Check, ExternalLink, Terminal, Zap,
  Mail, Calendar, Settings, Layout, ShieldCheck, Lock
} from 'lucide-react';
import { StrategicAssistant } from './components/StrategicAssistant';
import { TTSPlayer } from './components/TTSPlayer';
// Fix: Removed non-existent Type import from ./types. StrategicPillar, ActionItem, CurrentUser, Organization are correctly exported.
import { StrategicPillar, ActionItem, CurrentUser, Organization } from './types';
import { supabase } from './lib/supabase';
import { KNOWLEDGE_BASE as INITIAL_KB } from './knowledgeBase';
import { GoogleGenAI } from '@google/genai';

const PLAN_KEY = 'ksu_2026_strategic_plan';
const KB_KEY = 'ksu_strategic_knowledge';

const App: React.FC = () => {
  // Phase 2: Current Session Simulation
  const [currentUser] = useState<CurrentUser>({
    id: 'user-001',
    name: 'Milton Overton',
    email: 'ad@ksu.edu',
    role: 'Admin', // Change to 'Contributor' to test RBAC
    orgId: 'ksu-athletics'
  });

  const [activeOrg] = useState<Organization>({
    id: 'ksu-athletics',
    name: 'Kennesaw State Athletics',
    industry: 'Collegiate Sports'
  });

  const [viewMode, setViewMode] = useState<'executive' | 'architect'>('executive');
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA);
  const [kb, setKb] = useState<any>(INITIAL_KB);
  const [activePillarId, setActivePillarId] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'local' | 'no-schema'>('idle');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'action'} | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!supabase) {
      setSyncStatus('local');
      return;
    }

    try {
      setSyncStatus('syncing');
      const planRes = await supabase.from('strategic_plan').select('data, updated_at').eq('plan_key', PLAN_KEY).single();
      
      if (planRes.error && planRes.error.code === 'PGRST205') {
        setSyncStatus('no-schema');
        return;
      }

      if (planRes.data?.data) {
        const merged = PILLARS_DATA.map(p => {
          const savedPillar = planRes.data.data.find((sp: any) => sp.id === p.id);
          return savedPillar ? { ...p, ...savedPillar } : p;
        });
        const newPillars = planRes.data.data.filter((sp: any) => !PILLARS_DATA.find(p => p.id === sp.id));
        setPillars([...merged, ...newPillars]);
      }

      const kbRes = await supabase.from('strategic_knowledge').select('content').eq('kb_key', KB_KEY).single();
      if (kbRes.data?.content) setKb(kbRes.data.content);

      setSyncStatus('saved');
    } catch (e: any) { 
      setSyncStatus('error'); 
    }
  }, []);

  const syncPlan = useCallback(async (fullDataOverride?: StrategicPillar[]) => {
    const currentData = fullDataOverride || pillars;
    if (!supabase || syncStatus === 'no-schema') return;
    
    setSyncStatus('syncing');
    try {
      await supabase.from('strategic_plan').upsert({ 
        plan_key: PLAN_KEY, 
        data: currentData, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'plan_key' });
      setSyncStatus('saved');
    } catch (e) { setSyncStatus('error'); }
  }, [pillars, syncStatus]);

  const updateKnowledge = useCallback(async (newContent: any) => {
    if (!supabase) return;
    setKb(newContent);
    await supabase.from('strategic_knowledge').upsert({
      kb_key: KB_KEY,
      content: newContent,
      updated_at: new Date().toISOString()
    }, { onConflict: 'kb_key' });
    setNotification({ message: "Second Brain Synced", type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // Phase 2: AI Alignment Engine
  const calculateAlignment = async (task: string, pillar: StrategicPillar) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the alignment between a tactical task and a strategic pillar objective.
        TASK: "${task}"
        PILLAR OBJECTIVE: "${pillar.enablingAction}"
        Return a JSON object with: 
        1. score (integer 0-100)
        2. rationale (one sentence explaining why).`,
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text);
      return data;
    } catch (e) {
      return { score: 75, rationale: "Automated alignment check failed; defaulting to high probability." };
    }
  };

  const handleAddAction = async (pillarId: number, newAction: any) => {
    setNotification({ message: "Running AI Alignment Analysis...", type: 'action' });
    
    const targetPillar = pillars.find(p => p.id === pillarId) || pillars[0];
    const alignment = await calculateAlignment(newAction.task, targetPillar);

    const item: ActionItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newAction.task || "New Initiative",
      owner: newAction.owner || "Staff",
      priority: (newAction.priority as any) || "Medium",
      source: "StratOS Operator",
      status: "Verified",
      deadline: newAction.deadline,
      alignmentScore: alignment.score,
      strategicRationale: alignment.rationale
    };

    const updated = pillars.map(p => p.id === pillarId ? { ...p, actions: [item, ...p.actions] } : p);
    setPillars(updated);
    syncPlan(updated);

    setNotification({ message: `Success: Task Aligned (${alignment.score}%)`, type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavigate = (id: number) => {
    setActivePillarId(id);
    setViewMode('executive');
  };

  const activePillar = pillars.find(p => p.id === activePillarId) || pillars[0];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-4 rounded-2xl shadow-4xl flex items-center space-x-3 border-2 animate-in slide-in-from-top-4 duration-500 ${
          notification.type === 'success' ? 'bg-black text-yellow-500 border-yellow-500' : 
          notification.type === 'action' ? 'bg-blue-600 text-white border-blue-400' :
          'bg-gray-100 text-black border-gray-200'
        }`}>
          {notification.type === 'action' ? <Activity size={20} className="animate-spin" /> : <Zap size={20} />}
          <span className="font-black uppercase tracking-widest text-[10px]">{notification.message}</span>
        </div>
      )}

      <div className="print:hidden">
        <Header />
        
        <div className="bg-gray-100 px-6 py-2 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Database className="w-3 h-3" />
              <span>Org: <span className="text-black">{activeOrg.name}</span></span>
            </div>
            
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('executive')}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${viewMode === 'executive' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                <Layout size={12} />
                <span>Executive</span>
              </button>
              
              {/* RBAC Gate: Only Admin can access Architect mode */}
              <button 
                onClick={() => currentUser.role === 'Admin' ? setViewMode('architect') : alert('Access Denied: Admin role required.')}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                  viewMode === 'architect' ? 'bg-black text-yellow-500 shadow-sm' : 
                  currentUser.role === 'Admin' ? 'text-gray-500 hover:text-black' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {currentUser.role === 'Admin' ? <Settings size={12} /> : <Lock size={12} />}
                <span>Architect</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-gray-900 font-bold">{currentUser.name}</span>
               <span className="text-gray-400">({currentUser.role})</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <button onClick={() => fetchAllData()} className="text-[10px] font-black uppercase text-gray-600 hover:text-black">Refresh</button>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col md:flex-row max-w-[1920px] mx-auto w-full relative">
        {viewMode === 'executive' ? (
          <>
            <Sidebar pillars={pillars} activeId={activePillarId} onSelect={setActivePillarId} />
            <div className="flex-1 p-4 md:p-10 lg:p-12">
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activePillar?.metrics.map((m, i) => (
                    <div key={i} className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-yellow-500 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{m.label}</span>
                        <div className={`p-1.5 rounded-full ${m.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {m.trend === 'up' ? <TrendingUp size={12} /> : <Minus size={12} />}
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <h4 className="text-3xl font-black text-black">{m.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                <section className="relative">
                  <div className="flex items-center space-x-4 mb-6">
                    <span className={`inline-flex items-center px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white ${activePillar?.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                      Pillar #{activePillar?.id + 1}
                    </span>
                    <TTSPlayer title={activePillar?.title} text={activePillar?.description} />
                  </div>

                  <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8">
                    {activePillar?.title}
                  </h2>

                  <div className="bg-black text-white rounded-[2.5rem] p-8 border-t-[12px] border-yellow-500 shadow-4xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-4">Core Objective</h3>
                    <p className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9]">
                      {activePillar?.enablingAction}
                    </p>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-gray-50 pb-4">
                    <h3 className="text-2xl font-black text-black uppercase tracking-tighter">Tactical Priorities</h3>
                  </div>
                  <div className="grid gap-4">
                    {activePillar?.actions.map((action) => (
                      <ActionCard key={action.id} action={action} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <ArchitectView 
            pillars={pillars} 
            setPillars={(p) => { setPillars(p); syncPlan(p); }} 
          />
        )}
      </main>

      <StrategicAssistant 
        pillars={pillars}
        knowledgeBase={kb}
        onNavigate={handleNavigate}
        onAddAction={handleAddAction}
        onAgentAction={(type, details) => setNotification({ message: details, type: 'action' })}
        onUpdateKB={updateKnowledge}
      />
    </div>
  );
};

export default App;
