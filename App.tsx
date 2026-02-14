
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { PILLARS_DATA } from './constants';
import { CheckSquare, Flag, ArrowRight, BrainCircuit } from 'lucide-react';
import { VoiceAgent } from './components/VoiceAgent';
import { TTSPlayer } from './components/TTSPlayer';
import { StrategicPillar, ActionItem } from './types';

const App: React.FC = () => {
  const [pillars, setPillars] = useState<StrategicPillar[]>(PILLARS_DATA);
  const [activePillarId, setActivePillarId] = useState(0);

  const activePillar = pillars.find(p => p.id === activePillarId) || pillars[0];

  const handleNavigate = useCallback((id: number) => {
    const validId = Math.max(0, Math.min(pillars.length - 1, id));
    setActivePillarId(validId);
  }, [pillars.length]);

  const handleAddAction = useCallback((pillarId: number, newAction: ActionItem) => {
    setPillars(prev => prev.map(p => {
      if (p.id === pillarId) {
        return { ...p, actions: [newAction, ...p.actions] };
      }
      return p;
    }));
  }, []);

  const handleDeleteAction = useCallback((pillarId: number, taskName: string) => {
    setPillars(prev => prev.map(p => {
      if (p.id === pillarId) {
        return { ...p, actions: p.actions.filter(a => a.task.toLowerCase() !== taskName.toLowerCase()) };
      }
      return p;
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      <Header />

      <main className="flex flex-1 flex-col md:flex-row max-w-[1800px] mx-auto w-full relative">
        <Sidebar 
          pillars={pillars} 
          activeId={activePillarId} 
          onSelect={setActivePillarId} 
        />

        <div className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Active Pillar Hero Section */}
            <section className="relative">
              <div className="absolute -top-12 -left-12 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] -z-10"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-600'}`}>
                    Strategic Pillar #{activePillar.id + 1}
                  </span>
                  <TTSPlayer title={activePillar.title} text={activePillar.description + ". Focus area: " + activePillar.focus} />
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <BrainCircuit className="w-4 h-4 mr-2 text-yellow-500 animate-pulse" />
                  KSU AI Optimized View
                </div>
              </div>

              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-black uppercase tracking-tighter leading-[0.9] mb-6">
                {activePillar.title}
              </h2>
              <p className="text-2xl text-gray-400 font-semibold mb-10 max-w-3xl leading-snug">
                {activePillar.focus}
              </p>

              {/* Enabling Action Box */}
              <div className="bg-black text-white rounded-[40px] p-10 lg:p-14 shadow-3xl relative overflow-hidden group border-t-[12px] border-yellow-500 transform transition-all hover:scale-[1.01] duration-500">
                <div className="absolute top-0 right-0 p-12 text-yellow-500 opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-1000">
                  <Flag size={200} strokeWidth={1} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 text-yellow-500 mb-6">
                    <ArrowRight size={24} className="animate-bounce-x" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">The Strategic Lever</h3>
                  </div>
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-tight text-white group-hover:text-yellow-500 transition-colors duration-500">
                    {activePillar.enablingAction}
                  </p>
                  <p className="text-gray-400 text-xl font-medium italic border-l-4 border-yellow-500/40 pl-6 py-2 max-w-2xl leading-relaxed">
                    "{activePillar.description}"
                  </p>
                </div>
              </div>
            </section>

            {/* Action Items List */}
            <section className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-gray-100 pb-8 gap-6">
                <div>
                  <h3 className="text-3xl font-black text-black flex items-center uppercase tracking-tighter">
                    <CheckSquare className="w-10 h-10 mr-4 text-yellow-500" />
                    2026 Critical Priorities
                  </h3>
                  <p className="text-gray-400 text-sm mt-2 font-bold uppercase tracking-[0.3em]">Tactical Execution Roadmap</p>
                </div>
                <div className="bg-black px-6 py-3 rounded-2xl text-xs font-black text-yellow-500 uppercase tracking-widest shadow-xl">
                  {activePillar.actions.length} Total Initiatives
                </div>
              </div>

              <div className="grid gap-6">
                {activePillar.actions.length > 0 ? (
                  activePillar.actions.map((action, idx) => (
                    <div key={`${activePillar.id}-${idx}`} className="animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                      <ActionCard action={action} />
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                    <p className="text-gray-300 font-black uppercase tracking-widest">No priorities added yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Pillar Footer Quote */}
            <footer className="mt-32 pt-16 border-t-2 border-gray-50 text-center pb-24">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-gray-200 transition-all hover:text-gray-400 duration-1000 select-none tracking-tight">
                "Built for Stability. Driven by Process. Destined for Power Four."
              </p>
            </footer>
          </div>
        </div>
      </main>

      <VoiceAgent 
        pillars={pillars}
        onNavigate={handleNavigate}
        onAddAction={handleAddAction}
        onDeleteAction={handleDeleteAction}
      />

      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1.2s infinite ease-in-out;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default App;
