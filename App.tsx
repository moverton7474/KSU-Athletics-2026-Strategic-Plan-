
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { ArchitectView } from './components/ArchitectView';
import { PILLARS_DATA } from './constants';
import { 
  TrendingUp, Minus, Database, Activity, Zap, Lock, Settings, Layout
} from 'lucide-react';
import { StrategicAssistant } from './components/StrategicAssistant';
import { TTSPlayer } from './components/TTSPlayer';
import { NotificationHub } from './components/NotificationHub';
import { StrategicPillar, ActionItem, CurrentUser, Organization, Collaborator, UserRole } from './types';
import { supabase } from './lib/supabase';
import { KNOWLEDGE_BASE as INITIAL_KB } from './knowledgeBase';
import { GoogleGenAI } from '@google/genai';

const PLAN_KEY = 'ksu_2026_strategic_plan';
const KB_KEY = 'ksu_strategic_knowledge';

const DEFAULT_COLLABORATORS: Collaborator[] = [
  { id: '1', name: 'Brad Ledford', email: 'brad@ksu.edu', role: 'Contributor', lastActive: '2 hours ago' },
  { id: '2', name: 'Stephanie Clemmons', email: 'steph@ksu.edu', role: 'Contributor', lastActive: '1 day ago' },
  { id: '3', name: 'Jessica Reo', email: 'jessica@ksu.edu', role: 'Admin', lastActive: 'Online' },
  { id: '4', name: 'Tierra Thompson', email: 'tierra@ksu.edu', role: 'Contributor', lastActive: '3 hours ago' },
  { id: '5', name: 'Claire', email: 'claire@ksu.edu', role: 'Contributor', lastActive: '5 days ago' }
];

const App: React.FC = () => {
  const [currentUser] = useState<CurrentUser>({
    id: 'user-001',
    name: 'Milton Overton',
    email: 'ad@ksu.edu',
    role: 'Admin',
    orgId: 'ksu-athletics'
  });

  const [activeOrg] = useState<Organization>({
    id: 'ksu-athletics',
    name: 'Kennesaw State Athletics',
    industry: 'Collegiate Sports'
  });

  const [viewMode, setViewMode] = useState<'executive' | 'architect'>('executive');
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA || []);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(DEFAULT_COLLABORATORS || []);
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
      
      // 1. Fetch Plan & Merge with Local Schema for robustness
      const planRes = await supabase.from('strategic_plan').select('data').eq('plan_key', PLAN_KEY).single();
      
      if (planRes.data && Array.isArray(planRes.data.data)) {
        const dbData = planRes.data.data;
        const mergedPillars = PILLARS_DATA.map((defaultPillar) => {
          const dbPillar = dbData.find((p: any) => p.id === defaultPillar.id);
          if (dbPillar) {
             return { 
               ...defaultPillar, 
               ...dbPillar, 
               // Prioritize local icon mapping strings to ensure Sidebar getIcon works
               icon: dbPillar.icon || defaultPillar.icon,
               // Deep merge actions and metrics arrays to prevent empty states
               actions: Array.isArray(dbPillar.actions) ? dbPillar.actions : defaultPillar.actions,
               metrics: Array.isArray(dbPillar.metrics) ? dbPillar.metrics : defaultPillar.metrics,
             };
          }
          return defaultPillar;
        });
        
        // Include any custom pillars that aren't in the default set
        const customPillars = dbData.filter((p: any) => !PILLARS_DATA.some(dp => dp.id === p.id));
        setPillars([...mergedPillars, ...customPillars]);
      } else {
        setPillars(PILLARS_DATA);
      }

      // 2. Fetch Knowledge
      const kbRes = await supabase.from('strategic_knowledge').select('content').eq('kb_key', KB_KEY).single();
      if (kbRes.data?.content) setKb(kbRes.data.content);

      // 3. Fetch Collaborators
      const collRes = await supabase.from('strategic_collaborators').select('*').order('created_at', { ascending: false });
      if (collRes.data && Array.isArray(collRes.data) && collRes.data.length > 0) {
        setCollaborators(collRes.data);
      } else {
        await supabase.from('strategic_collaborators').upsert(DEFAULT_COLLABORATORS.map(c => ({
          name: c.name,
          email: c.email,
          role: c.role,
          last_active: c.lastActive
        })));
      }

      setSyncStatus('saved');
    } catch (e: any) { 
      setSyncStatus('error'); 
      setPillars(PILLARS_DATA); // Fallback to local data on error
    }
  }, []);

  const syncPlan = useCallback(async (fullDataOverride?: StrategicPillar[]) => {
    const rawData = fullDataOverride || pillars;
    if (!supabase || !rawData) return;
    
    // SANITIZATION: Remove non-serializable icon elements before saving
    const sanitizedData = rawData.map(({ iconElement, ...rest }) => ({
      ...rest,
      actions: (rest.actions || []).map(action => ({ ...action }))
    }));

    setSyncStatus('syncing');
    try {
      await supabase.from('strategic_plan').upsert({ 
        plan_key: PLAN_KEY, 
        data: sanitizedData, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'plan_key' });
      setSyncStatus('saved');
    } catch (e) { setSyncStatus('error'); }
  }, [pillars]);

  const updateCollaborators = async (newCollaborators: Collaborator[]) => {
    if (!Array.isArray(newCollaborators)) return;
    setCollaborators(newCollaborators);
    if (!supabase) return;
    
    setSyncStatus('syncing');
    try {
      for (const c of newCollaborators) {
        await supabase.from('strategic_collaborators').upsert({
          name: c.name,
          email: c.email,
          role: c.role,
          last_active: c.lastActive
        }, { onConflict: 'email' });
      }
      setSyncStatus('saved');
      setNotification({ message: "Access Control Synchronized", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      setSyncStatus('error');
    }
  };

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
      const data = JSON.parse(response.text || '{}');
      return data;
    } catch (e) {
      return { score: 75, rationale: "Automated alignment check failed." };
    }
  };

  const handleAddAction = async (pillarId: number, newAction: any) => {
    setNotification({ message: "Running AI Alignment Analysis...", type: 'action' });
    
    const targetPillar = (pillars || []).find(p => p.id === pillarId) || pillars[0];
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

    const updated = (pillars || []).map(p => p.id === pillarId ? { ...p, actions: [item, ...(p.actions || [])] } : p);
    setPillars(updated);
    syncPlan(updated);

    setNotification({ message: `Success: Task Aligned (${alignment.score}%)`, type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavigate = (id: number) => {
    setActivePillarId(id);
    setViewMode('executive');
  };

  const activePillar = (pillars || []).find(p => p.id === activePillarId) || (pillars && pillars[0]);

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

          <div className="flex items-center space-x-6">
            <NotificationHub 
              pillars={pillars || []} 
              onDispatchEmail={(details) => {
                setNotification({ message: details, type: 'success' });
                setTimeout(() => setNotification(null), 3000);
              }} 
            />
            <div className="h-4 w-px bg-gray-300"></div>
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
            <Sidebar pillars={pillars || []} activeId={activePillarId} onSelect={setActivePillarId} />
            <div className="flex-1 p-4 md:p-10 lg:p-12">
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(activePillar?.metrics || []).map((m, i) => (
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

                {activePillar && (
                  <section className="relative animate-in fade-in duration-500">
                    <div className="flex items-center space-x-4 mb-6">
                      <span className={`inline-flex items-center px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                        Pillar #{activePillar.id + 1}
                      </span>
                      <TTSPlayer title={activePillar.title || 'Pillar'} text={activePillar.description || ''} />
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8">
                      {activePillar.title || 'Loading Strategic Pillar...'}
                    </h2>

                    <div className="bg-black text-white rounded-[2.5rem] p-8 border-t-[12px] border-yellow-500 shadow-4xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-4">Core Objective</h3>
                      <p className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9]">
                        {activePillar.enablingAction || 'Strategic Objective Pending'}
                      </p>
                    </div>
                  </section>
                )}

                <section className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-gray-50 pb-4">
                    <h3 className="text-2xl font-black text-black uppercase tracking-tighter">Tactical Priorities</h3>
                  </div>
                  <div className="grid gap-4">
                    {(activePillar?.actions || []).map((action) => (
                      <ActionCard key={action.id} action={action} />
                    ))}
                    {(!activePillar?.actions || activePillar.actions.length === 0) && (
                      <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400">
                        <Zap size={40} className="mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Tactical Actions Logged</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <ArchitectView 
            pillars={pillars || []} 
            setPillars={(p) => { setPillars(p); syncPlan(p); }} 
            collaborators={collaborators || []}
            onUpdateCollaborators={updateCollaborators}
          />
        )}
      </main>

      <StrategicAssistant 
        pillars={pillars || []}
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
