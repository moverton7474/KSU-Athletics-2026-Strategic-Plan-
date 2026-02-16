
import React, { useState } from 'react';
import { Plus, Trash2, Users, LayoutGrid, Building2, Loader2, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { StrategicPillar, Collaborator, UserRole } from '../types';
import { GoogleGenAI } from '@google/genai';

interface ArchitectViewProps {
  pillars: StrategicPillar[];
  setPillars: (pillars: StrategicPillar[]) => void;
  collaborators: Collaborator[];
  onUpdateCollaborators: (collaborators: Collaborator[]) => void;
}

export const ArchitectView: React.FC<ArchitectViewProps> = ({ 
  pillars, 
  setPillars, 
  collaborators, 
  onUpdateCollaborators 
}) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'collaborators' | 'org'>('collaborators');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Contributor');
  const [isSending, setIsSending] = useState(false);
  const [lastInviteContent, setLastInviteContent] = useState<string | null>(null);

  const updateCollaboratorRole = (id: string, newRole: UserRole) => {
    const updated = (collaborators || []).map(c => c.id === id ? { ...c, role: newRole } : c);
    onUpdateCollaborators(updated);
  };

  const addPillar = () => {
    const newPillar: StrategicPillar = {
      id: (pillars || []).length,
      title: "New Strategic Pillar",
      focus: "Define focus area",
      enablingAction: "Define primary objective",
      description: "Enter pillar description for briefings",
      color: "bg-gray-900",
      actions: [],
      metrics: []
    };
    setPillars([...(pillars || []), newPillar]);
  };

  const updatePillar = (id: number, field: keyof StrategicPillar, value: any) => {
    setPillars((pillars || []).map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePillar = (id: number) => {
    if (confirm("Are you sure? This will delete all associated tactical actions.")) {
      setPillars((pillars || []).filter(p => p.id !== id).map((p, i) => ({ ...p, id: i })));
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || isSending) return;

    setIsSending(true);
    setLastInviteContent(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Draft a high-stakes, professional invitation email to join a strategic planning platform called StratOS. 
        RECIPIENT: ${inviteEmail}
        ROLE: ${selectedRole}
        ORGANIZATION: Kennesaw State Athletics (The Power Four Ascent)
        MISSION: "Taking Flight to 2026"
        The tone should be urgent, elite, and system-centric. Mention that their input is critical for the upcoming Executive Retreat.`
      });

      setLastInviteContent(response.text || '');
      
      const newUser: Collaborator = {
        id: Math.random().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: selectedRole,
        lastActive: 'Invited Now'
      };
      
      onUpdateCollaborators([newUser, ...(collaborators || [])]);
      setInviteEmail('');
    } catch (err) {
      console.error("Invite simulation failed:", err);
    } finally {
      setIsSending(false);
    }
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
            <span className="text-xs uppercase tracking-widest">Access Control</span>
          </button>
          <button 
            onClick={() => setActiveTab('org')}
            className={`flex items-center space-x-2 pb-4 -mb-4 border-b-2 transition-all ${activeTab === 'org' ? 'border-black text-black font-black' : 'border-transparent text-gray-400 font-bold'}`}
          >
            <Building2 size={18} />
            <span className="text-xs uppercase tracking-widest">Org Settings</span>
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
          {activeTab === 'pillars' && (
            <div className="space-y-8">
              {pillars?.map((pillar) => (
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
                      <button onClick={() => deletePillar(pillar.id)} className="text-gray-200 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-black text-white rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="max-w-md">
                  <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Uplink New Leaders</h3>
                  <p className="text-gray-400 text-sm font-bold mb-8">
                    Grant administrative or contribution rights. StratOS is system-centric, not personality-centric.
                  </p>
                  <form onSubmit={sendInvite} className="space-y-4">
                    <div className="flex">
                      <input 
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@ksu.edu"
                        className="flex-1 bg-white/10 border border-white/20 rounded-l-2xl px-6 py-4 outline-none text-white font-bold"
                        disabled={isSending}
                      />
                      <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="bg-white/10 border-y border-r border-white/20 px-4 text-xs font-black uppercase text-yellow-500 outline-none appearance-none"
                        disabled={isSending}
                      >
                        <option value="Contributor">Contributor</option>
                        <option value="Admin">Admin</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <button 
                        type="submit" 
                        disabled={isSending}
                        className="bg-yellow-500 text-black px-8 rounded-r-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-colors flex items-center space-x-2"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
                      </button>
                    </div>
                  </form>
                </div>
                
                {lastInviteContent && (
                  <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-3xl animate-in slide-in-from-right-8 overflow-hidden max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Strategic Invitation Dispatched</span>
                      </div>
                      <button onClick={() => setLastInviteContent(null)} className="text-white/20 hover:text-white"><Zap size={14} className="fill-white/20" /></button>
                    </div>
                    <div className="text-[10px] text-gray-300 italic font-mono leading-relaxed whitespace-pre-wrap">
                      {lastInviteContent}
                    </div>
                  </div>
                )}
                
                {!lastInviteContent && <Users size={120} className="text-yellow-500/10 hidden md:block self-center" />}
              </div>

              <div className="grid gap-4">
                <div className="px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Collaborator Profile</span>
                  <div className="flex space-x-32 pr-12">
                    <span>Access Level</span>
                    <span>System Controls</span>
                  </div>
                </div>
                {collaborators?.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center group hover:border-yellow-500 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-black group-hover:text-yellow-500 transition-colors">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-black">{c.name}</h5>
                        <div className="flex items-center space-x-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${c.lastActive === 'Online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.lastActive}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-12">
                      <div className="relative">
                        <select 
                          value={c.role}
                          onChange={(e) => updateCollaboratorRole(c.id, e.target.value as UserRole)}
                          className={`appearance-none px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer outline-none border transition-all ${
                            c.role === 'Admin' 
                              ? 'bg-black text-yellow-500 border-black' 
                              : c.role === 'Contributor' 
                                ? 'bg-gray-100 text-gray-900 border-gray-100 hover:border-black' 
                                : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Contributor">Contributor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                        <RefreshCw size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <button 
                        onClick={() => {
                          if(confirm(`Revoke all strategic access for ${c.name}?`)) {
                            onUpdateCollaborators((collaborators || []).filter(u => u.id !== c.id));
                          }
                        }} 
                        className="text-gray-200 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'org' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">Tenant Identity</h3>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Organization Name</label>
                        <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-sm font-bold" value="Kennesaw State Athletics" disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry Vertical</label>
                        <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-sm font-bold" value="Collegiate Athletics (Power Four Ascent)" disabled />
                      </div>
                   </div>
                   <div className="mt-10 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                      <div className="flex items-center space-x-3 mb-2">
                         <span className="text-xs font-black uppercase tracking-widest text-yellow-800">SaaS Multi-tenant Endpoint</span>
                      </div>
                      <code className="text-[10px] font-mono text-yellow-700 bg-white/50 px-2 py-1 rounded">https://ksu-athletics.stratos.app/api/v1/sync</code>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
