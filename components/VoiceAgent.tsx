
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { decode, decodeAudioData, createBlob } from './AudioUtils';

interface VoiceAgentProps {
  onNavigate: (id: number) => void;
  onAddAction: (pillarId: number, task: any) => void;
  onDeleteAction: (pillarId: number, taskName: string) => void;
  pillars: any[];
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ onNavigate, onAddAction, onDeleteAction, pillars }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setIsConnecting(false);
          setIsActive(true);
          
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(session => {
              if (sessionRef.current) {
                session.sendRealtimeInput({ media: pcmBlob });
              }
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContextRef.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Out
          const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64 && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
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

          // Handle Interruptions
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }

          // Handle Transcriptions
          if (message.serverContent?.inputTranscription) {
             setTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
          }
          if (message.serverContent?.turnComplete) {
            setTranscription('');
          }

          // Handle Tool Calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              let result = "Action performed successfully.";
              try {
                if (fc.name === 'navigate_to_pillar') {
                  onNavigate(Number(fc.args.pillarId));
                } else if (fc.name === 'add_action_item') {
                  onAddAction(Number(fc.args.pillarId), {
                    task: fc.args.task,
                    owner: fc.args.owner,
                    source: fc.args.source || "AI Assisted",
                    priority: fc.args.priority,
                    status: fc.args.status || "Planned"
                  });
                } else if (fc.name === 'delete_action_item') {
                  onDeleteAction(Number(fc.args.pillarId), fc.args.taskName);
                }
              } catch (e) {
                result = "Error executing command: " + (e as Error).message;
              }
              
              sessionPromise.then(session => {
                session.sendToolResponse({
                  functionResponses: [{ id: fc.id, name: fc.name, response: { result } }]
                });
              });
            }
          }
        },
        onclose: () => stopSession(),
        onerror: (e) => console.error("Live API Error:", e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: `You are the KSU Athletics Strategic AI Assistant. 
        You help staff navigate the 'Taking Flight to 2026' dashboard and manage strategic priorities. 
        Current Pillars: ${pillars.map(p => `#${p.id}: ${p.title}`).join(', ')}.
        You can navigate the app (0: Giant Killer, 1: Process, 2: Team, 3: Reload, 4: 360 Model), add tactical action items, or remove them. 
        Be professional, energetic, and focused on Power Four excellence. 
        If someone asks to add a task, ask for the owner and priority if they didn't specify.`,
        tools: [{
          functionDeclarations: [
            {
              name: 'navigate_to_pillar',
              description: 'Changes the view to a specific strategic pillar.',
              parameters: {
                type: Type.OBJECT,
                properties: { pillarId: { type: Type.INTEGER, description: 'ID of the pillar (0 to 4)' } },
                required: ['pillarId']
              }
            },
            {
              name: 'add_action_item',
              description: 'Adds a new tactical priority to a pillar.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  pillarId: { type: Type.INTEGER },
                  task: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  source: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium'] },
                  status: { type: Type.STRING }
                },
                required: ['pillarId', 'task', 'owner', 'priority']
              }
            },
            {
              name: 'delete_action_item',
              description: 'Deletes an action item by name from a pillar.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  pillarId: { type: Type.INTEGER },
                  taskName: { type: Type.STRING }
                },
                required: ['pillarId', 'taskName']
              }
            }
          ]
        }]
      }
    });
    
    sessionRef.current = await sessionPromise;
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    if (sessionRef.current) sessionRef.current.close();
    sessionRef.current = null;
    audioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {isActive && transcription && (
        <div className="bg-black/90 backdrop-blur-xl text-white p-5 rounded-[2rem] max-w-sm shadow-3xl border-2 border-yellow-500/50 animate-in slide-in-from-bottom-8">
          <div className="flex items-center space-x-2 mb-2 text-yellow-500">
             <Sparkles className="w-4 h-4 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Live Capture</span>
          </div>
          <p className="text-sm font-bold italic text-gray-100 leading-relaxed">"{transcription}"</p>
        </div>
      )}
      
      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`relative group p-8 rounded-[2.5rem] shadow-4xl transition-all duration-700 transform active:scale-95 ${
          isActive 
            ? 'bg-red-600 hover:bg-red-700 scale-110' 
            : 'bg-black hover:bg-gray-900 border-2 border-yellow-500'
        }`}
      >
        {isConnecting ? (
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        ) : isActive ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-yellow-500" />
        )}
        
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-[2.5rem] bg-red-600 animate-ping opacity-25"></span>
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </div>
          </>
        )}
        
        {!isActive && !isConnecting && (
          <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 bg-black text-white px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest border border-yellow-500 shadow-2xl">
            Strategic Voice Agent
          </div>
        )}
      </button>
    </div>
  );
};
