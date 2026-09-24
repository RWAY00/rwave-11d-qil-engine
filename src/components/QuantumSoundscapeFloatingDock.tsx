import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Headphones,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Music,
  Activity,
} from 'lucide-react';
import { QILComputationResult } from '../types';
import {
  quantumSynth,
  SOUNDSCAPE_SCALES,
  SoundscapeTimbre,
} from '../lib/quantumSynthesizer';

interface QuantumSoundscapeFloatingDockProps {
  computation: QILComputationResult;
  language: 'en' | 'hi';
  onOpenFullStudio: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const QuantumSoundscapeFloatingDock: React.FC<QuantumSoundscapeFloatingDockProps> = ({
  computation,
  language,
  onOpenFullStudio,
  isPlaying,
  onTogglePlay,
}) => {
  const isHi = language === 'hi';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.45);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeScaleId, setActiveScaleId] = useState<string>('lydian_ethereal');
  const [timbre, setTimbre] = useState<SoundscapeTimbre>('ethereal');
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync state
  useEffect(() => {
    const status = quantumSynth.getStatus();
    setVolume(status.masterVolume);
    setActiveScaleId(status.activeScaleId);
    setTimbre(status.activeTimbre);
  }, [isPlaying]);

  // Mini canvas oscilloscope animation
  useEffect(() => {
    if (!isExpanded) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const data = quantumSynth.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(5, 8, 16, 0.4)';
      ctx.fillRect(0, 0, width, height);

      if (data && isPlaying) {
        const { waveform } = data;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        const sliceWidth = width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.25)';
        ctx.beginPath();
        const t = Date.now() * 0.002;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.06 + t) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExpanded, isPlaying]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    quantumSynth.setMasterVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      quantumSynth.setMasterVolume(volume);
    } else {
      setIsMuted(true);
      quantumSynth.setMasterVolume(0);
    }
  };

  const handleScaleSelect = (scaleId: string) => {
    setActiveScaleId(scaleId);
    quantumSynth.setScale(scaleId);
    if (isPlaying) quantumSynth.updateFromLattice(computation);
  };

  const currentScale = SOUNDSCAPE_SCALES.find((s) => s.id === activeScaleId) || SOUNDSCAPE_SCALES[0];

  return (
    <div className="fixed bottom-4 right-4 z-40 transition-all duration-200">
      {/* Expanded Floating Control Pod */}
      {isExpanded ? (
        <div className="w-[300px] sm:w-[340px] bg-[#050810]/95 backdrop-blur-md rounded-xl border border-[#00f2ff]/40 shadow-[0_0_25px_rgba(0,242,255,0.2)] p-3 space-y-2.5 text-xs font-mono text-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Pod Header */}
          <div className="flex items-center justify-between border-b border-[#1a2234] pb-2">
            <div className="flex items-center space-x-2">
              <Headphones className={`w-4 h-4 ${isPlaying ? 'text-[#00f2ff]' : 'text-purple-400'}`} />
              <span className="font-bold text-white tracking-wide">
                {isHi ? 'क्वांटम साउंडस्केप' : 'Quantum Soundscape'}
              </span>
              {isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onOpenFullStudio}
                className="p-1 text-gray-400 hover:text-[#00f2ff] rounded transition cursor-pointer"
                title="Expand Full Synthesizer Studio"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer"
                title="Minimize Dock"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini Oscilloscope */}
          <div className="relative rounded bg-[#0a0f1d] border border-[#1a2234] overflow-hidden">
            <canvas
              ref={miniCanvasRef}
              width={320}
              height={50}
              className="w-full h-[50px] block"
            />
            <div className="absolute bottom-1 right-1.5 text-[9px] text-gray-400 bg-[#050810]/80 px-1 rounded">
              {currentScale.name.split(' ')[0]} Tuning
            </div>
          </div>

          {/* Play/Pause & Master Volume Bar */}
          <div className="flex items-center space-x-2.5 bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`p-1.5 rounded-md font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                  : 'bg-[#00f2ff] hover:bg-[#38bdf8] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1 text-gray-400 hover:text-white shrink-0 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#00f2ff]" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#1a2234] rounded appearance-none cursor-pointer accent-[#00f2ff]"
            />
            <span className="text-[10px] text-gray-300 w-8 text-right font-mono shrink-0">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {/* Scale Quick Select */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-400">
              <span>{isHi ? 'हार्मोनिक स्केल:' : 'Scale Tuning:'}</span>
              <span className="text-[#00f2ff] truncate max-w-[140px] text-right font-bold">
                {currentScale.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SOUNDSCAPE_SCALES.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleScaleSelect(sc.id)}
                  className={`px-1.5 py-1 rounded text-[9px] font-mono text-left truncate transition cursor-pointer ${
                    sc.id === activeScaleId
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/60 font-bold'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234]'
                  }`}
                  title={sc.name}
                >
                  {sc.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <button
            type="button"
            onClick={onOpenFullStudio}
            className="w-full py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-white transition text-[11px] font-mono flex items-center justify-center gap-1.5 cursor-pointer border border-[#1a2234]"
          >
            <Activity className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'संपूर्ण 11D स्टूडियो खोलें' : 'Open 11D Acoustic Studio'}</span>
          </button>
        </div>
      ) : (
        /* Collapsed Floating Pill */
        <div className="flex items-center space-x-1.5 bg-[#050810]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#00f2ff]/40 shadow-[0_0_15px_rgba(0,242,255,0.25)] text-xs font-mono text-gray-200">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`p-1 rounded-full transition cursor-pointer ${
              isPlaying
                ? 'text-rose-400 hover:text-rose-300'
                : 'text-[#00f2ff] hover:text-[#38bdf8]'
            }`}
            title={isPlaying ? 'Pause Soundscape' : 'Start Ambient Soundscape'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center space-x-1.5 hover:text-[#00f2ff] transition cursor-pointer"
            title="Expand Soundscape Controller"
          >
            <Headphones className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#00f2ff]' : 'text-purple-400'}`} />
            <span className="text-[11px] font-bold">
              {isPlaying ? (isHi ? 'साउंड ऑन' : 'Sound ON') : (isHi ? 'साउंडस्केप' : 'Soundscape')}
            </span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
            )}
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};
