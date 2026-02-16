
import React from 'react';
import { Target, Users, Shield, RefreshCw, Heart, FileText } from 'lucide-react';
import { StrategicPillar } from '../types';

interface SidebarProps {
  pillars: StrategicPillar[];
  activeId: number;
  onSelect: (id: number) => void;
}

const getIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Target': return <Target className="w-6 h-6" />;
    case 'Users': return <Users className="w-6 h-6" />;
    case 'Shield': return <Shield className="w-6 h-6" />;
    case 'RefreshCw': return <RefreshCw className="w-6 h-6" />;
    case 'Heart': return <Heart className="w-6 h-6" />;
    default: return <FileText className="w-6 h-6" />;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ pillars, activeId, onSelect }) => {
  return (
    <nav className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-100 flex-shrink-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Strategic Pillars</h2>
      </div>
      <div className="overflow-y-auto">
        {(pillars || []).map((pillar) => (
          <button
            key={pillar.id}
            onClick={() => onSelect(pillar.id)}
            className={`w-full text-left p-5 border-b border-gray-50 transition-all duration-300 group ${
              activeId === pillar.id 
                ? 'bg-yellow-50 border-l-[6px] border-l-yellow-500 shadow-inner' 
                : 'hover:bg-gray-50 border-l-[6px] border-l-transparent'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${
                activeId === pillar.id 
                  ? 'bg-black text-yellow-500 scale-110 shadow-lg' 
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                {getIcon(pillar.icon as string)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold uppercase tracking-tight text-sm mb-1 ${
                  activeId === pillar.id ? 'text-black' : 'text-gray-600 group-hover:text-black'
                }`}>
                  {pillar.title || `Pillar #${pillar.id + 1}`}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed truncate">
                  {pillar.focus || 'Strategic Focus Area'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
