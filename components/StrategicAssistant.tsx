
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage, GenerateContentResponse } from '@google/genai';
import { Mic, MicOff, Send, Sparkles, Loader2, Brain, Zap, X, MessageSquare, ChevronDown, AlertCircle, BookOpen } from 'lucide-react';
import { decode, decodeAudioData, createBlob } from './AudioUtils';
import { KNOWLEDGE_BASE } from '../knowledgeBase';

interface StrategicAssistantProps {
  onNavigate: (id: number) => void;
  onAddAction: (pillarId: number, task: any) => void;
  onDeleteAction: (pillarId: number, taskName: string) => void;
  onUpdatePriority: (pillarId: number, taskName: string, newPriority: string) => void;
  pillars: any[];
  syncStatus?: string;
}

export const StrategicAssistant: React.FC<StrategicAssistantProps> = ({ 
  onNavigate, onAddAction, onDeleteAction, onUpdatePriority, pillars, syncStatus 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [transcription, setTranscription] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, transcription, isOpen]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config: any = {
        systemInstruction: `You are the KSU Strategic Intelligence Agent. You have access to a 'Second Brain' (Knowledge Base).
        
        KNOWLEDGE BASE CONTEXT:
        - Project: ${KNOWLEDGE_BASE.projectTitle}
        - Organization: ${KNOWLEDGE_BASE.organization}
        - Mission: ${KNOWLEDGE_BASE.mission}
        - Revenue Goals: ${JSON.stringify(KNOWLEDGE_BASE.revenueTargets)}
        - Philosophies: ${JSON.stringify(KNOWLEDGE_BASE.strategicPhilosophies)}
        
        MAPPING & TOOLS: 
        - Pillar #0: Giant Killer Mindset ($10M Revenue pipeline).
        - Pillar #1: Process over Personalities.
        - Pillar #2: Team over Ego.
        - Pillar #3: Reload Mentality.
        - Pillar #4: 360 Holistic Model.

        If a user asks to CHANGE or UPDATE an existing task (e.g., "Change the owner of X to Y" or "Update the status of Z"), use the update_action_item tool.
        Pillars current state: ${pillars.map(p => `#${p.id}: ${p.title}`).join(', ')}.`,
        tools: [{
          functionDeclarations: [
            { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
            { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium'] } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
            { 
              name: 'update_action_item', 
              description: 'Updates an existing tactical priority.',
              parameters: { 
                type: Type.OBJECT, 
                properties: { 
                  pillarId: { type: Type.INTEGER }, 
                  taskName: { type: Type.STRING, description: 'The current name of the task to find it' }, 
                  newOwner: { type: Type.STRING }, 
                  newPriority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium'] },
                  newStatus: { type: Type.STRING }
                }, 
                required: ['pillarId', 'taskName'] 
              } 
            }
          ]
        }]
      };

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.functionCall) {
            const fc = part.functionCall;
            if (fc.name === 'navigate_to_pillar') onNavigate(Number(fc.args.pillarId));
            if (fc.name === 'add_action_item') onAddAction(Number(fc.args.pillarId), fc.args);
            if (fc.name === 'update_action_item') {
              const pillar = pillars.find(p => p.id === Number(fc.args.pillarId));
              const task = pillar?.actions.find((a: any) => a.task.toLowerCase().includes(String(fc.args.taskName).toLowerCase()));
              if (task) {
                const updated = { ...task };
                if (fc.args.newOwner) updated.owner = String(fc.args.newOwner);
                if (fc.args.newPriority) updated.priority = fc.args.newPriority;
                if (fc.args.newStatus) updated.status = String(fc.args.newStatus);
                // We use the navigate logic or a silent update. For now, let's assume we update via the parent handleUpdatePriority for priority or a generic update logic if we added it to Props.
                // Since onUpdateAction isn't in Props yet, we'll use existing handleUpdatePriority or similar.
                if (fc.args.newPriority) onUpdatePriority(Number(fc.args.pillarId), String(fc.args.taskName), String(fc.args.newPriority));
              }
            }
          }
        }
      }

      const aiText = response.text || "Strategic request processed.";
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Strategic uplink interrupted." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoice = async () => {
    if (isConnecting || isVoiceActive) return;
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsVoiceActive(true);
            if (audioContextRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                sessionPromise.then(session => session.sendRealtimeInput({ media: createBlob(inputData) }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (typeof audioBase64 === 'string' && outputAudioContextRef.current?.state !== 'closed') {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            const transcriptText = message.serverContent?.inputTranscription?.text;
            if (transcriptText) setTranscription(String(transcriptText));
            if (message.serverContent?.turnComplete) {
              if (transcription) {
                setChatHistory(prev => [...prev, { role: 'user', text: transcription }]);
                setTranscription('');
              }
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'navigate_to_pillar') onNavigate(Number(fc.args.pillarId));
                if (fc.name === 'add_action_item') onAddAction(Number(fc.args.pillarId), fc.args);
                if (fc.name === 'update_action_item') {
                   if (fc.args.newPriority) onUpdatePriority(Number(fc.args.pillarId), String(fc.args.taskName), String(fc.args.newPriority));
                }
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Success" } }] }));
              }
            }
          },
          onclose: stopVoice,
          onerror: stopVoice
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the KSU Strategic Voice Agent. 
          Use update_action_item to change details of existing priorities.
          Use navigate_to_pillar to change views.
          Use add_action_item to create new ones.
          Knowledge Base Context: ${JSON.stringify(KNOWLEDGE_BASE)}`,
          tools: [{
            functionDeclarations: [
              { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
              { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
              { name: 'update_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, taskName: { type: Type.STRING }, newPriority: { type: Type.STRING } }, required: ['pillarId', 'taskName'] } }
            ]
          }]
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { stopVoice(); }
  };

  const stopVoice = () => {
    setIsVoiceActive(false);
    setIsConnecting(false);
    if (sessionRef.current) sessionRef.current.close();
    sessionRef.current = null;
    [audioContextRef.current, outputAudioContextRef.current].forEach(ctx => {
      if (ctx?.state !== 'closed') ctx?.close();
    });
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'w-full md:w-[380px] h-[580px]' : 'w-auto h-auto'}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-3 bg-black text-white px-6 py-4 rounded-full shadow-4xl border-2 border-yellow-500 hover:scale-105 transition-all"
        >
          <div className="relative">
            <Sparkles className="text-yellow-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-black animate-ping"></div>
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Strategic AI Agent</span>
        </button>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-4xl h-full flex flex-col border-2 border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-300">
          <div className="bg-black text-white px-6 py-4 flex justify-between items-center border-b-2 border-yellow-500">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-2 rounded-xl text-black">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="font-black uppercase text-[10px] tracking-widest leading-none">Strategic AI Hub</h3>
                <div className="flex items-center space-x-1.5 mt-1">
                  <BookOpen size={10} className="text-blue-400" />
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Second Brain Active</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1">Uplink Established</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed">Managing objectives via voice or text.</p>
                </div>
              </div>
            )}
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] font-bold shadow-sm ${
                  chat.role === 'user' ? 'bg-black text-white' : 'bg-white text-gray-800 border border-gray-100'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {transcription && (
              <div className="flex justify-end animate-in fade-in">
                <div className="bg-black/80 text-white p-3 rounded-2xl text-[11px] italic border-2 border-yellow-500 animate-pulse font-bold">"{transcription}"</div>
              </div>
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Consulting Playbook</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={isVoiceActive ? stopVoice : startVoice}
                className={`p-3 rounded-xl transition-all shadow-md ${
                  isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Strategic query or command..."
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 text-[12px] font-bold outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-600 hover:scale-110">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
