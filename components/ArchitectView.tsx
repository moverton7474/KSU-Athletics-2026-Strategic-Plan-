
import React, { useState } from 'react';
import { Plus, Trash2, Users, Calendar, Save, UserPlus, Mail, ChevronRight, LayoutGrid, Target, Clock, ShieldCheck } from 'lucide-react';
import { StrategicPillar, ActionItem, Collaborator } from '../types';

interface ArchitectViewProps {
  pillars: StrategicPillar[];
  setPillars: (pillars: StrategicPillar[]) => void;
}

export const ArchitectView: React.FC<ArchitectViewProps> = ({ pillars, setPillars }) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'collaborators'>('pillars');
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: '1', name: 'Brad Ledford', email: 'brad@ksu.edu', role: 'Contributor', lastActive: '2 hours ago' },
    { id: '2', name: 'Stephanie Clemmons', email: 'steph@ksu.edu', role: 'Contributor', lastActive: '1 day ago' },
    { id: '3', name: 'Jessica Reo', email: 'jessica@ksu.edu', role: 'Admin', lastActive: 'Online' },
    { id: '4', name: 'Tierra Thompson', email: 'tierra@ksu.edu', role: 'Contributor', lastActive: '3 hours ago' },
    { id: '5', name: 'Claire', email: 'claire@ksu.edu', role: 'Contributor', lastActive: '5 days ago' }
  ]);

  const addPillar = () => {
    const newPillar: StrategicPillar = {
      id: pillars.length,
      title: "New Strategic Pillar",
      focus: "Define focus area",
      enablingAction: "Define primary objective",
      description: "Enter pillar description for briefings",
      color: "bg-gray-900",
      actions: [],
      metrics: []
    };
    setPillars([...pillars, newPillar]);
  };

  const updatePillar = (id: number, field: keyof StrategicPillar, value: any) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePillar = (id: number) => {
    if (confirm("Are you sure? This will delete all associated tactical actions.")) {
      setPillars(pillars.filter(p => p.id !== id).map((p, i) => ({ ...p, id: i })));
    }
  };

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    alert(`Invitation sent to ${inviteEmail}. In a production SaaS, this would send a magic link.`);
    setInviteEmail('');
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('pillars')}
            className={`flex items-center space-x-2 pb-4 -mb-4 border-b-2 transition-all ${activeTab === 'pillars' ? 'border-black text-black font-black' : 'border-transparent text-gray-400 font-bold'}`}
          >
            <LayoutGrid size={18} />
            <span className="text-xs uppercase tracking-widest">Plan Architecture</span>
          </button>
          <button 
            onClick={() => setActiveTab('collaborators')}
            className={`flex items-center space-x-2 pb-4 -mb-4 border-b-2 transition-all ${activeTab === 'collaborators' ? 'border-black text-black font-black' : 'border-transparent text-gray-400 font-bold'}`}
          >
            <Users size={18} />
            <span className="text-xs uppercase tracking-widest">Collaborators</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={addPillar} className="bg-black text-yellow-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:scale-105 transition-all">
            <Plus size={14} />
            <span>Create Pillar</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'pillars' ? (
            <div className="space-y-8">
              {pillars.map((pillar) => (
                <div key={pillar.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center space-x-4">
                           <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-[10px] font-black">PILLAR #{pillar.id + 1}</span>
                           <input 
                            value={pillar.title}
                            onChange={(e) => updatePillar(pillar.id, 'title', e.target.value)}
                            className="text-3xl font-black uppercase tracking-tighter w-full outline-none focus:text-yellow-600 transition-colors"
                            placeholder="Pillar Title"
                           />
                        </div>
                        <input 
                          value={pillar.enablingAction}
                          onChange={(e) => updatePillar(pillar.id, 'enablingAction', e.target.value)}
                          className="text-lg font-bold text-gray-500 w-full outline-none"
                          placeholder="Primary Enabling Action / Objective"
                        />
                      </div>
                      <button onClick={() => deletePillar(pillar.id)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Focus Area</label>
                        <input 
                          value={pillar.focus}
                          onChange={(e) => updatePillar(pillar.id, 'focus', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color Theme</label>
                        <select 
                          value={pillar.color}
                          onChange={(e) => updatePillar(pillar.id, 'color', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold"
                        >
                          <option value="bg-yellow-500">KSU Gold</option>
                          <option value="bg-gray-900">Onyx Black</option>
                          <option value="bg-blue-600">Strategic Blue</option>
                          <option value="bg-red-600">Urgent Red</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pillar.actions.length} Priorities Defined</span>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center space-x-1">
                      <span>View All Tactics</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-black text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Invite Strategy Leaders</h3>
                  <p className="text-gray-400 text-sm font-bold mb-8 max-w-lg">
                    Grant administrative or contribution rights to executive staff. They will receive an uplink to the live Strategic Architecture.
                  </p>
                  
                  <form onSubmit={sendInvite} className="flex max-w-md">
                    <input 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@ksu.edu"
                      className="flex-1 bg-white/10 border border-white/20 rounded-l-2xl px-6 py-4 outline-none text-white font-bold"
                    />
                    <button type="submit" className="bg-yellow-500 text-black px-8 rounded-r-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-colors">
                      Invite
                    </button>
                  </form>
                </div>
                <div className="absolute top-0 right-0 p-12 text-yellow-500/10">
                  <UserPlus size={200} />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex justify-between items-center px-6 mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Collaborators</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Role</span>
                </div>
                {collaborators.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center hover:shadow-md transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-black">{c.name}</h5>
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.lastActive === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.lastActive}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        c.role === 'Admin' ? 'bg-black text-yellow-500' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.role}
                      </div>
                      <button className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[2rem] flex items-start space-x-6">
                 <div className="p-3 bg-blue-600 text-white rounded-2xl">
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                    <h4 className="font-black uppercase text-blue-900 tracking-tighter text-xl">SaaS Roadmap: Permissions</h4>
                    <p className="text-blue-700/70 text-sm font-bold mt-1">
                      Soon, you will be able to restrict Brad to the "Giant Killer" pillar while giving Jessica Reo full administrative oversight of "Process Over Personalities".
                    </p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
