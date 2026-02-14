
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { PILLARS_DATA } from './constants';
import { CheckSquare, Flag, ArrowRight, BrainCircuit, FileText, Download, Table, ClipboardList } from 'lucide-react';
import { StrategicAssistant } from './components/StrategicAssistant';
import { TTSPlayer } from './components/TTSPlayer';
import { StrategicPillar, ActionItem } from './types';

// Mock Supabase Persistence logic
const STORAGE_KEY = 'ksu_2026_strategic_plan';

const App: React.FC = () => {
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA);
  const [activePillarId, setActivePillarId] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Load from "Supabase" (LocalStorage mock)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // We need to merge because icons aren't serializable
        const merged = PILLARS_DATA.map(p => {
          const savedPillar = parsed.find((sp: any) => sp.id === p.id);
          return savedPillar ? { ...p, actions: savedPillar.actions } : p;
        });
        setPillars(merged);
      } catch (e) {
        console.error("Failed to load strategic data", e);
      }
    }
  }, []);

  // Save to "Supabase"
  useEffect(() => {
    const dataToSave = pillars.map(p => ({ id: p.id, actions: p.actions }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [pillars]);

  const activePillar = pillars.find(p => p.id === activePillarId) || pillars[0];

  const handleNavigate = useCallback((id: number) => {
    const validId = Math.max(0, Math.min(pillars.length - 1, id));
    setActivePillarId(validId);
  }, [pillars.length]);

  const handleAddAction = useCallback((pillarId: number, newAction: Partial<ActionItem>) => {
    const item: ActionItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newAction.task || "New Initiative",
      owner: newAction.owner || "Staff",
      priority: newAction.priority || "Medium",
      source: "Strategic Assistant",
      status: "Planning"
    };
    setPillars(prev => prev.map(p => p.id === pillarId ? { ...p, actions: [item, ...p.actions] } : p));
  }, []);

  const handleDeleteAction = useCallback((pillarId: number, taskName: string) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? { 
      ...p, 
      actions: p.actions.filter(a => !a.task.toLowerCase().includes(taskName.toLowerCase())) 
    } : p));
  }, []);

  const handleUpdatePriority = useCallback((pillarId: number, taskName: string, newPriority: string) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? { 
      ...p, 
      actions: p.actions.map(a => a.task.toLowerCase().includes(taskName.toLowerCase()) ? { ...a, priority: newPriority as any } : a) 
    } : p));
  }, []);

  const downloadCSV = () => {
    let csv = "Pillar,Task,Owner,Priority,Status\n";
    pillars.forEach(p => {
      p.actions.forEach(a => {
        csv += `"${p.title}","${a.task}","${a.owner}","${a.priority}","${a.status}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KSU_Strategic_Plan_2026_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-yellow-500 selection:text-black print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col md:flex-row max-w-[1920px] mx-auto w-full relative">
        <div className="print:hidden">
          <Sidebar 
            pillars={pillars} 
            activeId={activePillarId} 
            onSelect={setActivePillarId} 
          />
        </div>

        <div className="flex-1 p-4 md:p-10 lg:p-16 animate-in fade-in slide-in-from-right-8 duration-1000 print:p-0 print:m-0">
          <div className="max-w-6xl mx-auto space-y-16 print:space-y-8">
            
            {/* Export Center (Floating for Desk, Hidden for Print) */}
            <div className="print:hidden flex flex-wrap gap-4 bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
               <div className="flex-1">
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Export Center</h4>
                 <p className="text-[10px] text-gray-500 font-medium">Download current living strategic plan snapshots.</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-yellow-500 hover:text-black transition-all">
                   <FileText size={14} /> <span>PDF Report</span>
                 </button>
                 <button onClick={downloadCSV} className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-gray-100 transition-all">
                   <Table size={14} /> <span>Excel/CSV</span>
                 </button>
                 <button onClick={handlePrint} className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-gray-100 transition-all">
                   <ClipboardList size={14} /> <span>Word Doc</span>
                 </button>
               </div>
            </div>

            {/* Active Pillar Hero Section */}
            <section className="relative">
              <div className="print:hidden absolute -top-32 -left-32 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                    Strategic Pillar #{activePillar.id + 1}
                  </span>
                  <div className="print:hidden">
                    <TTSPlayer title={activePillar.title} text={activePillar.description + ". Core Focus: " + activePillar.focus} />
                  </div>
                </div>
                <div className="print:hidden flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100">
                  <BrainCircuit className="w-4 h-4 mr-3 text-yellow-500 animate-pulse" />
                  KSU Strategic Intelligence active
                </div>
              </div>

              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-sm print:text-4xl">
                {activePillar.title}
              </h2>
              <p className="text-2xl lg:text-3xl text-gray-400 font-bold mb-12 max-w-4xl leading-snug print:text-lg">
                {activePillar.focus}
              </p>

              {/* Enabling Action Box */}
              <div className="bg-black text-white rounded-[3rem] p-10 lg:p-20 shadow-4xl relative overflow-hidden group border-t-[16px] border-yellow-500 transition-all hover:translate-y-[-8px] duration-700 print:bg-white print:text-black print:border print:shadow-none print:rounded-none">
                <div className="print:hidden absolute top-0 right-0 p-16 text-yellow-500 opacity-[0.03] group-hover:scale-110 group-hover:opacity-10 transition-all duration-1000 ease-out">
                  <Flag size={300} strokeWidth={1} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 text-yellow-500 mb-8 print:text-black">
                    <ArrowRight size={28} className="animate-bounce-x print:hidden" />
                    <h3 className="text-xs lg:text-sm font-black uppercase tracking-[0.4em]">Primary Power Objective</h3>
                  </div>
                  <p className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 tracking-tighter leading-[0.9] text-white group-hover:text-yellow-500 transition-colors duration-700 print:text-3xl print:text-black">
                    {activePillar.enablingAction}
                  </p>
                  <p className="text-gray-400 text-xl lg:text-2xl font-medium italic border-l-8 border-yellow-500/30 pl-8 py-4 max-w-3xl leading-relaxed print:text-sm print:text-gray-600 print:border-black">
                    "{activePillar.description}"
                  </p>
                </div>
              </div>
            </section>

            {/* Action Items List */}
            <section className="space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-8 border-gray-50 pb-12 gap-8 print:border-b-2 print:border-black">
                <div>
                  <h3 className="text-4xl lg:text-5xl font-black text-black flex items-center uppercase tracking-tighter print:text-2xl">
                    <CheckSquare className="w-12 h-12 mr-5 text-yellow-500 print:hidden" />
                    2026 Critical Priorities
                  </h3>
                  <p className="text-gray-400 text-sm mt-3 font-black uppercase tracking-[0.5em] ml-1 print:text-[8px]">Tactical Execution Roadmap</p>
                </div>
                <div className="print:hidden bg-black px-10 py-5 rounded-3xl text-sm font-black text-yellow-500 uppercase tracking-widest shadow-2xl hover:bg-yellow-500 hover:text-black transition-all duration-300 transform hover:scale-105 cursor-default">
                  {activePillar.actions.length} Performance Targets
                </div>
              </div>

              <div className="grid gap-8 print:block print:space-y-4">
                {activePillar.actions.map((action, idx) => (
                  <div key={`${activePillar.id}-${idx}-${action.task}`} className="animate-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both" style={{ animationDelay: `${idx * 150}ms` }}>
                    <ActionCard action={action} />
                  </div>
                ))}
              </div>
            </section>

            {/* Pillar Footer Quote */}
            <footer className="mt-48 pt-20 border-t-4 border-gray-50 text-center pb-32 print:mt-12 print:pt-4">
              <p className="text-4xl sm:text-5xl lg:text-7xl font-serif italic text-gray-100 transition-all hover:text-gray-300 duration-1000 select-none tracking-tighter leading-none print:text-xl print:text-black">
                "Built for Stability. Driven by Process. Destined for Power Four."
              </p>
            </footer>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <StrategicAssistant 
          pillars={pillars}
          onNavigate={handleNavigate}
          onAddAction={handleAddAction}
          onDeleteAction={handleDeleteAction}
          onUpdatePriority={handleUpdatePriority}
        />
      </div>

      <style>{`
        @media print {
          @page { margin: 20mm; }
          .shadow-4xl, .shadow-2xl, .shadow-lg { box-shadow: none !important; }
          .bg-black { background-color: white !important; color: black !important; }
          .text-white { color: black !important; }
          .border-yellow-500 { border-color: black !important; }
          button { display: none !important; }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1.5s infinite ease-in-out;
        }
        .shadow-4xl {
          box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.4), 0 30px 60px -30px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;
