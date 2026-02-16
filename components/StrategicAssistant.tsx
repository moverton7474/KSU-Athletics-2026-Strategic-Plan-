
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage, GenerateContentResponse } from '@google/genai';
import { Mic, MicOff, Send, Sparkles, Loader2, Brain, Zap, X, MessageSquare, ChevronDown, BookOpen, Mail, Calendar, Activity } from 'lucide-react';
import { decode, decodeAudioData, createBlob } from './AudioUtils';

interface StrategicAssistantProps {
  onNavigate: (id: number) => void;
  onAddAction: (pillarId: number, task: any) => void;
  onAgentAction: (type: 'email' | 'calendar', details: string) => void;
  onUpdateKB: (newContent: any) => void;
  pillars: any[];
  knowledgeBase: any;
}

export const StrategicAssistant: React.FC<StrategicAssistantProps> = ({ 
  onNavigate, onAddAction, onAgentAction, onUpdateKB, pillars, knowledgeBase 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai' | 'system', text: string}[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Use a Ref to store the transcription to avoid stale closures in the Live API callback
  const transcriptionRef = useRef('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, liveTranscript, isOpen]);

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
        systemInstruction: `You are the KSU Strategic Operator.
        SECOND BRAIN ACCESS: ${JSON.stringify(knowledgeBase)}
        
        AGENTIC CAPABILITIES:
        1. Manage Pillars & Tasks.
        2. Send Strategic Emails (send_strategic_email).
        3. Schedule Meetings (schedule_calendar_event).
        4. Ingest New Intelligence (update_second_brain) - use this if the user provides new notebook data.

        Pillar Mapping: ${pillars.map(p => `#${p.id}: ${p.title}`).join(', ')}.`,
        tools: [{
          functionDeclarations: [
            { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
            { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
            { name: 'send_strategic_email', parameters: { type: Type.OBJECT, properties: { recipient: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ['recipient', 'subject', 'body'] } },
            { name: 'schedule_calendar_event', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING }, participants: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title', 'date'] } },
            { name: 'update_second_brain', parameters: { type: Type.OBJECT, properties: { newIntelligence: { type: Type.STRING, description: "Text data to merge into knowledge base" } }, required: ['newIntelligence'] } }
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
            if (fc.name === 'send_strategic_email') {
              onAgentAction('email', `Email sent to ${fc.args.recipient}: ${fc.args.subject}`);
              setChatHistory(prev => [...prev, { role: 'system', text: `OUTBOX: Strategic email dispatched to ${fc.args.recipient}.` }]);
            }
            if (fc.name === 'schedule_calendar_event') {
              onAgentAction('calendar', `Meeting scheduled: ${fc.args.title}`);
              setChatHistory(prev => [...prev, { role: 'system', text: `CALENDAR: Event "${fc.args.title}" synchronized.` }]);
            }
            if (fc.name === 'update_second_brain') {
              onUpdateKB({ ...knowledgeBase, recentIngest: fc.args.newIntelligence });
              setChatHistory(prev => [...prev, { role: 'system', text: `SYNC: New intelligence from notebook ingested into Second Brain.` }]);
            }
          }
        }
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "Action executed." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Operation failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoice = async () => {
    if (isConnecting || isVoiceActive) return;
    setIsConnecting(true);
    transcriptionRef.current = '';
    setLiveTranscript('');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsVoiceActive(true);
            
            // Explicitly resume audio contexts to handle browser autoplay policies
            inputCtx.resume();
            outputCtx.resume();

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output from model
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
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            
            // Use transcriptionRef to avoid stale closures
            const inputTranscript = message.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
              transcriptionRef.current += inputTranscript;
              setLiveTranscript(transcriptionRef.current);
            }

            if (message.serverContent?.turnComplete) {
              const finalUserSpeech = transcriptionRef.current.trim();
              if (finalUserSpeech) {
                setChatHistory(prev => [...prev, { role: 'user', text: finalUserSpeech }]);
              }
              transcriptionRef.current = '';
              setLiveTranscript('');
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let toolResult = "Success";
                if (fc.name === 'navigate_to_pillar') onNavigate(Number(fc.args.pillarId));
                if (fc.name === 'add_action_item') onAddAction(Number(fc.args.pillarId), fc.args);
                if (fc.name === 'send_strategic_email') onAgentAction('email', `Email sent: ${fc.args.subject}`);
                if (fc.name === 'schedule_calendar_event') onAgentAction('calendar', `Meeting booked: ${fc.args.title}`);
                if (fc.name === 'update_second_brain') onUpdateKB({ ...knowledgeBase, lastVoiceSync: fc.args.newIntelligence });
                
                sessionPromise.then(s => s.sendToolResponse({ 
                  functionResponses: { id: fc.id, name: fc.name, response: { result: toolResult } } 
                }));
              }
            }
          },
          onclose: () => stopVoice(),
          onerror: (e) => {
            console.error("Voice Error:", e);
            stopVoice();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: `You are the KSU Strategic Voice Operator. 
          MISSION: High-stakes execution support for the Power Four Ascent.
          
          When users speak, you listen and execute via tools. 
          If you call 'add_action_item', confirm it verbally. 
          Keep responses concise and authoritative.`,
          tools: [{
            functionDeclarations: [
              { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
              { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
              { name: 'send_strategic_email', parameters: { type: Type.OBJECT, properties: { recipient: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ['recipient', 'subject', 'body'] } },
              { name: 'schedule_calendar_event', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING } }, required: ['title', 'date'] } },
              { name: 'update_second_brain', parameters: { type: Type.OBJECT, properties: { newIntelligence: { type: Type.STRING } }, required: ['newIntelligence'] } }
            ]
          }]
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { 
      console.error("Voice start failed", e);
      stopVoice(); 
    }
  };

  const stopVoice = () => {
    setIsVoiceActive(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    
    [audioContextRef.current, outputAudioContextRef.current].forEach(ctx => {
      if (ctx && ctx.state !== 'closed') {
        try { ctx.close(); } catch(e) {}
      }
    });
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
    
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.add(new Set()); // Clear
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'w-full md:w-[400px] h-[620px]' : 'w-auto h-auto'}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-3 bg-black text-white px-6 py-4 rounded-full shadow-4xl border-2 border-yellow-500 hover:scale-105 transition-all"
        >
          <Sparkles className="text-yellow-500 animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[10px]">Strategic Operator</span>
        </button>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-4xl h-full flex flex-col border-2 border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-300">
          <div className="bg-black text-white px-6 py-5 flex justify-between items-center border-b-2 border-yellow-500">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-2 rounded-xl text-black">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-black uppercase text-[10px] tracking-widest">Operator Console</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVoiceActive ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                    {isVoiceActive ? 'Voice Uplink Active' : 'Agentic Uplink Standby'}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-white/50 hover:text-white"><ChevronDown size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-[11px] font-bold shadow-sm ${
                  chat.role === 'user' ? 'bg-black text-white' : 
                  chat.role === 'system' ? 'bg-blue-50 text-blue-700 border border-blue-100 italic' :
                  'bg-white text-gray-800 border border-gray-100'
                }`}>
                  {chat.role === 'system' && <Zap size={10} className="inline mr-2" />}
                  {chat.text}
                </div>
              </div>
            ))}
            {liveTranscript && (
              <div className="flex justify-end">
                <div className="bg-yellow-50 text-black border-2 border-yellow-500 p-3 rounded-2xl text-[11px] font-bold italic">
                  "{liveTranscript}"
                </div>
              </div>
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Executing Strategy</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-gray-500 whitespace-nowrap"><Mail size={10}/> <span>Email Owner</span></div>
              <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-gray-500 whitespace-nowrap"><Calendar size={10}/> <span>Book Briefing</span></div>
              <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-gray-500 whitespace-nowrap"><BookOpen size={10}/> <span>Notebook Sync</span></div>
            </div>
            <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
              <button 
                type="button" 
                onClick={isVoiceActive ? stopVoice : startVoice} 
                disabled={isConnecting}
                className={`p-3 rounded-xl shadow-md transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400 hover:text-black'}`}
              >
                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Command changes or sync notebook..."
                className="flex-1 bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 text-[12px] font-bold outline-none transition-all"
              />
              <button type="submit" className="text-yellow-600 hover:scale-110 transition-transform"><Send size={20} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
