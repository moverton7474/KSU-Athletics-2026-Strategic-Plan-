
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import { PILLARS_DATA } from './constants';
import { CheckSquare, Flag, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [activePillarId, setActivePillarId] = useState(0);
  const activePillar = PILLARS_DATA.find(p => p.id === activePillarId) || PILLARS_DATA[0];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Header />

      <main className="flex flex-1 flex-col md:flex-row max-w-[1600px] mx-auto w-full">
        <Sidebar 
          pillars={PILLARS_DATA} 
          activeId={activePillarId} 
          onSelect={setActivePillarId} 
        />

        <div className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Active Pillar Hero Section */}
            <section className="relative">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-white ${activePillar.color === 'bg-yellow-500' ? 'bg-black' : 'bg-yellow-500 text-black'}`}>
                  Strategic Pillar #{activePillar.id + 1}
                </span>
                <div className="hidden sm:block h-px flex-1 bg-gray-100"></div>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black uppercase tracking-tight leading-none mb-4">
                {activePillar.title}
              </h2>
              <p className="text-xl text-gray-500 font-medium mb-8 max-w-2xl">
                {activePillar.focus}
              </p>

              {/* Enabling Action Box */}
              <div className="bg-black text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group border-t-8 border-yellow-500">
                <div className="absolute top-0 right-0 p-8 text-yellow-500 opacity-20 group-hover:scale-125 transition-transform duration-700">
                  <Flag size={120} strokeWidth={1} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 text-yellow-500 mb-2">
                    <ArrowRight size={20} className="animate-bounce-x" />
                    <h3 className="text-xs font-black uppercase tracking-widest">The Core Enabling Action</h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black mb-4 tracking-tight leading-tight">
                    {activePillar.enablingAction}
                  </p>
                  <p className="text-gray-400 text-lg font-medium italic border-l-2 border-yellow-500/30 pl-4 py-1">
                    "{activePillar.description}"
                  </p>
                </div>
              </div>
            </section>

            {/* Action Items List */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-gray-100 pb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-black flex items-center uppercase tracking-tight">
                    <CheckSquare className="w-8 h-8 mr-3 text-yellow-500" />
                    2026 Critical Priorities
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 font-semibold uppercase tracking-widest">Tactical Execution Roadmap</p>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Total Actions: {activePillar.actions.length}
                </div>
              </div>

              <div className="grid gap-4">
                {activePillar.actions.map((action, idx) => (
                  <ActionCard key={idx} action={action} />
                ))}
              </div>
            </section>

            {/* Pillar Footer Quote */}
            <footer className="mt-20 pt-10 border-t border-gray-100 text-center pb-20">
              <p className="text-2xl sm:text-3xl font-serif italic text-gray-300 transition-colors hover:text-gray-400 duration-500 select-none">
                "Built for Stability. Driven by Process. Destined for Power Four."
              </p>
            </footer>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
