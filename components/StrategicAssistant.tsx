
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage, GenerateContentResponse } from '@google/genai';
import { Mic, MicOff, Send, Sparkles, Loader2, Brain, Zap, X, MessageSquare, ChevronUp } from 'lucide-react';
import { decode, decodeAudioData, createBlob } from './AudioUtils';

interface StrategicAssistantProps {
  onNavigate: (id: number) => void;
  onAddAction: (pillarId: number, task: any) => void;
  onDeleteAction: (pillarId: number, taskName: string) => void;
  onUpdatePriority: (pillarId: number, taskName: string, newPriority: string) => void;
  pillars: any[];
}

export const StrategicAssistant: React.FC<StrategicAssistantProps> = ({ 
  onNavigate, onAddAction, onDeleteAction, onUpdatePriority, pillars 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string, isThinking?: boolean}[]>([]);
  const [transcription, setTranscription] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, transcription]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = useThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash-lite-latest';
      
      const config: any = {
        systemInstruction: `You are the KSU Athletics Strategic AI. You help manage the 'Taking Flight to 2026' plan. 
        Pillars: ${pillars.map(p => `#${p.id}: ${p.title}`).join(', ')}.
        Available Tools: navigate_to_pillar, add_action_item, delete_action_item, update_action_priority.
        If the user asks for changes, you can perform them. 
        If 'Thinking Mode' is on, provide deep strategic analysis.`,
        tools: [{
          functionDeclarations: [
            { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
            { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium'] } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
            { name: 'update_action_priority', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, taskName: { type: Type.STRING }, newPriority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium'] } }, required: ['pillarId', 'taskName', 'newPriority'] } }
          ]
        }]
      };

      if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: userMsg,
        config
      });

      // Handle function calls if any
      // Fix: Use String() for unknown fc.args to resolve line 81 type issues
      if (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        const fc = response.candidates[0].content.parts[0].functionCall;
        if (fc.name === 'navigate_to_pillar') onNavigate(Number(fc.args.pillarId));
        if (fc.name === 'add_action_item') onAddAction(Number(fc.args.pillarId), fc.args);
        if (fc.name === 'update_action_priority') onUpdatePriority(Number(fc.args.pillarId), String(fc.args.taskName), String(fc.args.newPriority));
      }

      // Fix: Ensure the response text is explicitly cast to string to resolve 'unknown' type error
      const aiText = typeof response.text === 'string' ? response.text : "Command executed.";
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText, isThinking: useThinking }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error processing request." }]);
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
            // Fix: Explicitly check for transcription text and cast to string to resolve 'unknown' type error
            const transcriptText = message.serverContent?.inputTranscription?.text;
            if (transcriptText) {
              setTranscription(String(transcriptText));
            }
            if (message.serverContent?.turnComplete) {
              setChatHistory(prev => transcription ? [...prev, { role: 'user', text: transcription }] : prev);
              setTranscription('');
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'navigate_to_pillar') onNavigate(Number(fc.args.pillarId));
                if (fc.name === 'add_action_item') onAddAction(Number(fc.args.pillarId), fc.args);
                // Fix: Ensure taskName and newPriority are passed as strings (line 148)
                if (fc.name === 'update_action_priority') onUpdatePriority(Number(fc.args.pillarId), String(fc.args.taskName), String(fc.args.newPriority));
                // Fix: Tool responses must be sent in an array
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Success" } }] }));
              }
            }
          },
          onclose: stopVoice,
          onerror: stopVoice
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are the KSU Strategic Voice Agent. Manage the 2026 plan. Pillars: 0-4. Tools: navigate_to_pillar, add_action_item, update_action_priority.",
          tools: [{
            functionDeclarations: [
              { name: 'navigate_to_pillar', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER } }, required: ['pillarId'] } },
              { name: 'add_action_item', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, task: { type: Type.STRING }, owner: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ['pillarId', 'task', 'owner', 'priority'] } },
              { name: 'update_action_priority', parameters: { type: Type.OBJECT, properties: { pillarId: { type: Type.INTEGER }, taskName: { type: Type.STRING }, newPriority: { type: Type.STRING } }, required: ['pillarId', 'taskName', 'newPriority'] } }
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
    <>
      <div className={`fixed bottom-0 right-0 z-50 p-6 transition-all duration-500 ${isOpen ? 'w-full md:w-[450px] h-[700px]' : 'w-auto h-auto'}`}>
        {!isOpen ? (
          <button 
            onClick={() => setIsOpen(true)}
            className="group flex items-center space-x-3 bg-black text-white px-6 py-4 rounded-full shadow-4xl border-2 border-yellow-500 hover:scale-105 transition-all"
          >
            <Sparkles className="text-yellow-500 animate-pulse" />
            <span className="font-black uppercase tracking-widest text-sm">Strategic Assistant</span>
          </button>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-4xl h-full flex flex-col border-2 border-gray-100 overflow-hidden relative">
            {/* Header */}
            <div className="bg-black text-white p-6 flex justify-between items-center border-b-4 border-yellow-500">
              <div className="flex items-center space-x-3">
                <Brain className="text-yellow-500" />
                <div>
                  <h3 className="font-black uppercase text-xs tracking-widest">KSU AI Hub</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Strategic Architecture v2.0</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {chatHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                    chat.role === 'user' ? 'bg-black text-white' : 'bg-white text-gray-800 border border-gray-100'
                  }`}>
                    {chat.isThinking && (
                      <div className="flex items-center space-x-1 text-[10px] text-yellow-600 mb-1 uppercase font-black">
                        <Brain size={10} /> <span>Deep Reasoning Result</span>
                      </div>
                    )}
                    {chat.text}
                  </div>
                </div>
              ))}
              {transcription && (
                <div className="flex justify-end">
                  <div className="bg-black/80 text-white p-4 rounded-3xl text-sm italic border-2 border-yellow-500 animate-pulse">
                    "{transcription}"
                  </div>
                </div>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Processing</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setUseThinking(!useThinking)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    useThinking ? 'bg-yellow-100 text-yellow-700 shadow-inner' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Brain size={12} />
                  <span>{useThinking ? 'Deep Thinking On' : 'Standard Logic'}</span>
                </button>
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-300">
                  <Zap size={12} className="text-yellow-500" />
                  <span>Flash Lite Active</span>
                </div>
              </div>

              <form onSubmit={handleTextSubmit} className="flex items-center space-x-3">
                <button 
                  type="button"
                  onClick={isVoiceActive ? stopVoice : startVoice}
                  className={`p-4 rounded-2xl transition-all ${
                    isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {isConnecting ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Command strategic changes..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-yellow-600 hover:scale-110 transition-transform">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
