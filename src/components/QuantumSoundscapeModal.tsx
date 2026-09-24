import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Waves,
  Radio,
  Music,
  Headphones,
  Maximize2,
  X,
  Disc,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import { QILComputationResult } from '../types';
import { DIMENSION_METADATA } from '../lib/quantumEngine';
import {
  quantumSynth,
  SOUNDSCAPE_SCALES,
  SoundscapeScale,
  SoundscapeTimbre,
} from '../lib/quantumSynthesizer';

interface QuantumSoundscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  computation: QILComputationResult;
  language: 'en' | 'hi';
}

export const QuantumSoundscapeModal: React.FC<QuantumSoundscapeModalProps> = ({
  isOpen,
  onClose,
  computation,
  language,
}) => {
  const isHi = language === 'hi';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Local state mirrored with engine
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.45);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeScaleId, setActiveScaleId] = useState<string>('lydian_ethereal');
  const [timbre, setTimbre] = useState<SoundscapeTimbre>('ethereal');
  const [reverb, setReverb] = useState<number>(0.5);
  const [soloDim, setSoloDim] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'matrix' | 'oscilloscope'>('matrix');

  // Sync with synth on mount and state changes
  useEffect(() => {
    const status = quantumSynth.getStatus();
    setIsPlaying(status.isRunning);
    setVolume(status.masterVolume);
    setActiveScaleId(status.activeScaleId);
    setTimbre(status.activeTimbre);
    setReverb(status.reverbLevel);
    setSoloDim(status.soloDimensionIndex);
  }, [isOpen]);

  // Keep synth lattice in sync with new computation results
  useEffect(() => {
    if (isPlaying) {
      quantumSynth.updateFromLattice(computation);
    }
  }, [computation, isPlaying]);

  // Real-time canvas oscilloscope animation
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const data = quantumSynth.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      // Dark background with subtle trail
      ctx.fillStyle = 'rgba(5, 8, 16, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Grid reference lines
      ctx.strokeStyle = 'rgba(26, 34, 52, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (data && isPlaying) {
        const { frequencies, waveform } = data;

        // 1. Draw Spectrum Bars in background
        const barCount = 48;
        const barWidth = width / barCount;
        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (frequencies.length * 0.7));
          const val = frequencies[index] / 255;
          const barHeight = val * (height * 0.7);

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(112, 0, 255, 0.15)');
          gradient.addColorStop(0.6, 'rgba(0, 242, 255, 0.35)');
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0.7)');

          ctx.fillStyle = gradient;
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1.5, barHeight);
        }

        // 2. Draw Smooth Laser Waveform in foreground
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const sliceWidth = width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      } else {
        // Idle gentle breathing sine wave when paused
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        ctx.beginPath();
        const t = Date.now() * 0.002;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.03 + t) * 8;
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
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentScale = SOUNDSCAPE_SCALES.find((s) => s.id === activeScaleId) || SOUNDSCAPE_SCALES[0];
  const { normalizedOutput, phaseAngles, entropy } = computation;

  // Find peak resonance dimension
  let maxIdx = 0;
  let maxVal = -1;
  normalizedOutput.forEach((v, i) => {
    if (v > maxVal) {
      maxVal = v;
      maxIdx = i;
    }
  });

  const handleTogglePlay = async () => {
    if (isPlaying) {
      quantumSynth.stop();
      setIsPlaying(false);
    } else {
      const ok = await quantumSynth.start();
      if (ok) {
        quantumSynth.updateFromLattice(computation);
        setIsPlaying(true);
      }
    }
  };

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

  const handleTimbreSelect = (newTimbre: SoundscapeTimbre) => {
    setTimbre(newTimbre);
    quantumSynth.setTimbre(newTimbre);
    if (isPlaying) quantumSynth.updateFromLattice(computation);
  };

  const handleReverbChange = (newRev: number) => {
    setReverb(newRev);
    quantumSynth.setReverbLevel(newRev);
  };

  const handleSoloDimension = (dimIdx: number) => {
    if (soloDim === dimIdx) {
      setSoloDim(null);
      quantumSynth.setSoloDimension(null);
    } else {
      setSoloDim(dimIdx);
      quantumSynth.setSoloDimension(dimIdx);
    }
    if (isPlaying) quantumSynth.updateFromLattice(computation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#050810] border border-[#00f2ff]/30 rounded-xl shadow-[0_0_40px_rgba(0,242,255,0.18)] overflow-hidden text-gray-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a2234] bg-[#0a0f1d]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div
                className={`p-2 rounded-lg border transition-all ${
                  isPlaying
                    ? 'bg-[#00f2ff]/20 border-[#00f2ff] shadow-[0_0_15px_#00f2ff] text-[#00f2ff]'
                    : 'bg-[#1a2234]/60 border-[#1a2234] text-gray-400'
                }`}
              >
                <Headphones className="w-5 h-5" />
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f2ff] font-bold">
                  Acoustic Sonification Engine
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-purple-950/80 border border-purple-500/40 text-purple-300">
                  Web Audio API
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>{isHi ? '11D क्वांटम ध्वनि विस्तार (Quantum Ambient Soundscape)' : '11D Quantum Ambient Soundscape'}</span>
                <span className="text-xs font-mono font-normal text-gray-400">
                  [{isPlaying ? 'LIVE RESONANCE' : 'STANDBY'}]
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Play/Pause Header Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(255,0,60,0.5)]'
                  : 'bg-[#00f2ff] hover:bg-[#38bdf8] text-[#050810] shadow-[0_0_12px_rgba(0,242,255,0.4)]'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? (isHi ? 'रोकें' : 'Pause Sound') : (isHi ? 'शुरू करें' : 'Start Soundscape')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1a2234] text-gray-400 hover:text-white transition cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Master Controller Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-lg bg-[#0a0f1d] border border-[#1a2234]">
            {/* Master Volume & Mute */}
            <div className="md:col-span-4 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#00f2ff]" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-gray-400">{isHi ? 'मास्टर वॉल्यूम' : 'Master Gain'}</span>
                  <span className="text-[#00f2ff] font-bold">
                    {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#1a2234] rounded-lg appearance-none cursor-pointer accent-[#00f2ff]"
                />
              </div>
            </div>

            {/* Spatial Reverb Slider */}
            <div className="md:col-span-3 flex items-center space-x-3 border-t md:border-t-0 md:border-l border-[#1a2234] md:pl-3 pt-2 md:pt-0">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Waves className="w-3 h-3 text-purple-400" />
                    <span>{isHi ? 'स्थानिक रीवरब' : 'Spatial Diffusion'}</span>
                  </span>
                  <span className="text-purple-300 font-bold">{Math.round(reverb * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={reverb}
                  onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#1a2234] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Timbre Profile Selector */}
            <div className="md:col-span-5 flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 md:border-l border-[#1a2234] md:pl-3 pt-2 md:pt-0">
              <span className="text-[11px] font-mono text-gray-400 shrink-0">
                {isHi ? 'ध्वनि प्रकृति:' : 'Timbre:'}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleTimbreSelect('ethereal')}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
                    timbre === 'ethereal'
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/60 font-bold'
                      : 'bg-[#1a2234]/60 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                  title="Sine wave ambient pads with lush harmonic diffusion"
                >
                  Ethereal Silk
                </button>
                <button
                  type="button"
                  onClick={() => handleTimbreSelect('crystalline')}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
                    timbre === 'crystalline'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/60 font-bold'
                      : 'bg-[#1a2234]/60 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                  title="Triangle wave overtones with sparkling crystalline high harmonics"
                >
                  Crystalline
                </button>
                <button
                  type="button"
                  onClick={() => handleTimbreSelect('deep_drone')}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
                    timbre === 'deep_drone'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 font-bold'
                      : 'bg-[#1a2234]/60 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                  title="Analog sawtooth sub-bass drone with resonant lowpass filter sweep"
                >
                  Deep Drone
                </button>
              </div>
            </div>
          </div>

          {/* Scale Tuning Presets Strip */}
          <div className="p-3 rounded-lg bg-[#0a0f1d] border border-[#1a2234] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>{isHi ? 'हार्मोनिक स्केल ट्यूनिंग' : 'Harmonic Resonance Tuning Scale'}</span>
              </span>
              <span className="text-[11px] text-[#00f2ff] font-bold">{currentScale.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SOUNDSCAPE_SCALES.map((sc) => {
                const isSelected = sc.id === activeScaleId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleScaleSelect(sc.id)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#00f2ff]/10 border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.2)]'
                        : 'bg-[#050810] border-[#1a2234] hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs font-bold text-white">{sc.name}</div>
                      {isSelected && <Disc className="w-3.5 h-3.5 text-[#00f2ff] animate-spin" />}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{sc.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {sc.notes.slice(0, 5).map((n, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1 bg-[#1a2234] text-gray-300 font-mono rounded"
                        >
                          {n}
                        </span>
                      ))}
                      <span className="text-[9px] text-gray-500 font-mono">+6 more</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Oscilloscope & Spectrum Visualizer Banner */}
          <div className="relative rounded-lg bg-[#050810] border border-[#1a2234] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f1d]/90 border-b border-[#1a2234] text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Activity className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>{isHi ? 'रीयल-टाइम वेवफॉर्म और स्पेक्ट्रम ऑसिलोस्कोप' : 'Real-Time Audio Waveform & FFT Spectrum Analyser'}</span>
              </span>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="text-gray-500">Peak Chime:</span>
                <span className="text-amber-400 font-bold">
                  D{maxIdx + 1} ({(currentScale.frequencies[maxIdx] * 2).toFixed(1)} Hz)
                </span>
                <span className="text-gray-500 border-l border-[#1a2234] pl-2">Entropy Cutoff:</span>
                <span className="text-purple-300 font-bold">
                  {(80 + Math.max(0, entropy - 1.5) * 120).toFixed(0)} Hz
                </span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={900}
              height={140}
              className="w-full h-[120px] sm:h-[140px] block"
            />

            {!isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-4 py-2 rounded-lg bg-[#00f2ff] hover:bg-[#38bdf8] text-[#050810] font-bold font-mono text-xs shadow-[0_0_20px_#00f2ff] transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{isHi ? 'क्वांटम साउंडस्केप शुरू करें (Start Live Soundscape)' : 'Engage Ambient Soundscape Engine'}</span>
                </button>
                <p className="text-[11px] text-gray-400 font-mono mt-2">
                  {isHi
                    ? '11D लैटिस मानों को रीयल-टाइम हार्मोनिक आवृत्तियों में सुनें'
                    : 'Auditory sonification mapping 11D probability densities to melodic resonance'}
                </p>
              </div>
            )}
          </div>

          {/* 11-Dimensional Acoustic Harmonic Resonator Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>{isHi ? '11 आयाम स्वर और स्थानिक पैनिंग' : '11-Dimensional Acoustic Voices & Spatial Panning'}</span>
              </span>
              {soloDim !== null && (
                <button
                  type="button"
                  onClick={() => handleSoloDimension(soloDim)}
                  className="text-[10px] text-rose-400 hover:underline font-mono"
                >
                  Clear Solo (D{soloDim + 1})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {normalizedOutput.map((val, idx) => {
                const metadata = DIMENSION_METADATA[idx];
                const freq = currentScale.frequencies[idx] || 220;
                const note = currentScale.notes[idx] || '';
                const phase = phaseAngles[idx] !== undefined ? phaseAngles[idx] : 0;
                const panPct = Math.round(Math.sin(phase) * 100);
                const isPeak = idx === maxIdx;
                const isSoloed = soloDim === idx;

                return (
                  <div
                    key={`voice-${idx}`}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isSoloed
                        ? 'bg-[#00f2ff]/15 border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.3)] ring-1 ring-[#00f2ff]'
                        : isPeak
                        ? 'bg-[#0a0f1d] border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                        : 'bg-[#0a0f1d] border-[#1a2234] hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isSoloed
                              ? 'bg-[#00f2ff] text-black font-black'
                              : isPeak
                              ? 'bg-amber-400 text-black font-black'
                              : 'bg-[#1a2234] text-gray-300'
                          }`}
                        >
                          D{idx + 1}
                        </span>
                        <span className="font-medium text-gray-200 text-xs truncate" title={metadata?.name}>
                          {isHi ? metadata?.hindiName : metadata?.name.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Musical Note & Frequency Chip */}
                        <span className="text-[10px] font-mono text-[#00f2ff] bg-[#00f2ff]/10 px-1 rounded border border-[#00f2ff]/20">
                          {note} ({freq.toFixed(1)} Hz)
                        </span>

                        {/* Solo button */}
                        <button
                          type="button"
                          onClick={() => handleSoloDimension(idx)}
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono transition cursor-pointer ${
                            isSoloed
                              ? 'bg-[#00f2ff] text-black font-black shadow-[0_0_6px_#00f2ff]'
                              : 'bg-[#1a2234] hover:bg-[#25324d] text-gray-400'
                          }`}
                          title={isSoloed ? 'Unsolo dimension voice' : 'Solo this dimension voice'}
                        >
                          {isSoloed ? 'SOLOED' : 'SOLO'}
                        </button>
                      </div>
                    </div>

                    {/* Magnitude Level VU Meter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span>Resonance Power |P|²:</span>
                        <span className={isPeak ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                          {(val * 100).toFixed(2)}%
                        </span>
                      </div>

                      <div className="w-full bg-[#1a2234] h-2 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-200 ${
                            isSoloed
                              ? 'bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                              : isPeak
                              ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-[#00f2ff]'
                              : 'bg-gradient-to-r from-[#00f2ff] to-[#7000ff]'
                          }`}
                          style={{ width: `${Math.max(2, Math.min(100, val * 260))}%` }}
                        />
                      </div>

                      {/* Stereo Spatial Pan Readout */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 pt-0.5">
                        <span>Pan: {panPct < 0 ? `L ${Math.abs(panPct)}%` : panPct > 0 ? `R ${panPct}%` : 'Center'}</span>
                        <span>Phase θ: {phase.toFixed(2)} rad</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1a2234] bg-[#0a0f1d] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-gray-400">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#00f2ff]" />
            <span>
              {isHi
                ? 'शुद्ध ब्राउज़र वेब ऑडियो एपीआई - शून्य बाहरी निर्भरता, पूर्णतः स्थानीय'
                : 'Pure Web Audio API Synthesis: Zero external dependencies, client-side deterministic DSP.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-white transition font-mono cursor-pointer"
          >
            {isHi ? 'बंद करें (Close)' : 'Close Synthesizer'}
          </button>
        </div>
      </div>
    </div>
  );
};
