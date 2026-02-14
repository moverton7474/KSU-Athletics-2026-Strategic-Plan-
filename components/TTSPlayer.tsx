
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Volume2, Loader2, Pause } from 'lucide-react';
import { decode, decodeAudioData } from './AudioUtils';

interface TTSPlayerProps {
  text: string;
  title: string;
}

export const TTSPlayer: React.FC<TTSPlayerProps> = ({ text, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const cleanup = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch(e) {}
      }
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const playTTS = async () => {
    if (isPlaying) {
      cleanup();
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Deliver a strategic executive briefing on the following pillar titled "${title}": ${text}. Keep it professional and authoritative.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (typeof audioBase64 === 'string') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioBase64), audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          // Auto cleanup after play
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close().catch(() => {});
          }
          audioContextRef.current = null;
        };
        sourceRef.current = source;
        source.start();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      cleanup();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={playTTS}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
        isPlaying ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      <span className="text-xs font-black uppercase tracking-widest">
        {isLoading ? 'Preparing Briefing...' : isPlaying ? 'Stop Briefing' : 'Pillar Briefing'}
      </span>
    </button>
  );
};
