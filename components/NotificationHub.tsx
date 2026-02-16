
import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, AlertTriangle, CheckCircle, Loader2, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { ActionItem, StrategicPillar } from '../types';
import { GoogleGenAI } from '@google/genai';

interface NotificationHubProps {
  pillars: StrategicPillar[];
  onDispatchEmail: (details: string) => void;
}

export const NotificationHub: React.FC<NotificationHubProps> = ({ pillars, onDispatchEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<{ action: ActionItem, pillarTitle: string, type: 'overdue' | 'approaching' }[]>([]);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  useEffect(() => {
    // Scan pillars for overdue or approaching deadlines
    const now = new Date();
    const foundReminders: any[] = [];

    pillars?.forEach(pillar => {
      pillar.actions?.forEach(action => {
        if (!action.deadline) return;
        const deadlineDate = new Date(action.deadline);
        const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0 && action.status !== 'Completed') {
          foundReminders.push({ action, pillarTitle: pillar.title, type: 'overdue' });
        } else if (diffDays <= 7 && diffDays >= 0 && action.status !== 'Completed') {
          foundReminders.push({ action, pillarTitle: pillar.title, type: 'approaching' });
        }
      });
    });

    setReminders(foundReminders);
  }, [pillars]);

  const dispatchReminder = async (item: { action: ActionItem, pillarTitle: string, type: 'overdue' | 'approaching' }) => {
    setDispatchingId(item.action.id);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const prompt = `Draft a high-stakes strategic reminder email.
      TO: ${item.action.owner}
      TASK: ${item.action.task}
      STRATEGIC PILLAR: ${item.pillarTitle}
      STATUS: ${item.type === 'overdue' ? 'PAST DUE' : 'APPROACHING DEADLINE (' + item.action.deadline + ')'}
      ORGANIZATION: Kennesaw State Athletics
      TONE: Professional, urgent, focused on the 'Power Four Ascent'. 
      Mention that this is a system-generated alert from StratOS to ensure execution excellence.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      onDispatchEmail(`Reminder dispatched to ${item.action.owner}: ${item.action.task}`);
      // In a real app, we'd call an API here.
      alert(`STRATOS OUTBOX:\n\n${response.text}`);
      
      setReminders(prev => prev.filter(r => r.action.id !== item.action.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-black transition-colors"
      >
        <Bell size={20} />
        {reminders.length > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[8px] font-black text-white items-center justify-center">
              {reminders.length}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-4xl border border-gray-100 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="bg-black p-6 text-white flex justify-between items-center">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">Execution Alerts</h3>
              <p className="text-xl font-black tracking-tighter">Strategic Outbox</p>
            </div>
            <Zap className="text-yellow-500 fill-yellow-500" size={20} />
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
            {reminders.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">All systems green. No pending alerts.</p>
              </div>
            ) : (
              reminders.map((item, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-yellow-500 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.type === 'overdue' ? 'Past Due' : 'Approaching'}
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.action.deadline}</span>
                  </div>
                  <h4 className="font-black text-sm text-black mb-1 leading-tight">{item.action.task}</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Owner: {item.action.owner}</p>
                  
                  <button 
                    onClick={() => dispatchReminder(item)}
                    disabled={dispatchingId === item.action.id}
                    className="w-full bg-black text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    {dispatchingId === item.action.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={12} />
                        <span>Dispatch AI Reminder</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
             <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total System Latency: 42ms</span>
             <button onClick={() => setIsOpen(false)} className="text-[8px] font-black uppercase tracking-widest text-black hover:underline">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};
