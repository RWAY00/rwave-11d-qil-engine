import React from 'react';
import {
  Atom,
  ShieldCheck,
  Cpu,
  Globe2,
  Sparkles,
  BookOpen,
  History,
  RefreshCw,
  FileCode2,
  Download,
  Headphones,
  Volume2,
  Bell,
  ShieldAlert,
} from 'lucide-react';

interface HeaderProps {
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
  seed: number;
  onChangeSeed: (newSeed: number) => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onResetToSample: () => void;
  onOpenManualInput?: () => void;
  onOpenExportReport?: () => void;
  onOpenSoundscape?: () => void;
  isSoundscapePlaying?: boolean;
  alertCount?: number;
  hasCriticalAlert?: boolean;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  seed,
  onChangeSeed,
  onOpenHistory,
  onOpenGuide,
  onResetToSample,
  onOpenManualInput,
  onOpenExportReport,
  onOpenSoundscape,
  isSoundscapePlaying = false,
  alertCount = 0,
  hasCriticalAlert = false,
  onOpenAlerts,
}) => {
  const isHi = language === 'hi';

  return (
    <header className="border-b border-[#1a2234] bg-[#050810] text-[#e0e6ed] sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Logo & Lab Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00f2ff] to-[#7000ff] rounded-xs rotate-45 flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.4)]">
              <div className="w-4 h-4 border border-white/50 -rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#00f2ff]/80">
                  System Intelligence
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                  11D-QIL
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>R-WAVE <span className="text-[#00f2ff]">11D</span> QIL-ENGINE</span>
                <span className="hidden sm:inline-block text-[11px] font-normal text-gray-400 border-l border-[#1a2234] pl-2 font-mono">
                  {isHi ? 'शून्य-भ्रम क्वांटम लैटिस' : 'Zero-Hallucination Deterministic Engine'}
                </span>
              </h1>
            </div>
          </div>

          {/* Telemetry Metrics & Action Controls */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3">
            {/* Core Stability Readouts */}
            <div className="hidden xl:flex items-center space-x-5 bg-[#0a0f1d]/80 px-3 py-1 rounded border border-[#1a2234] text-xs">
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">Core Stability</div>
                <div className="text-xs font-mono text-[#00f2ff] font-bold">99.99999982%</div>
              </div>
              <div className="text-right border-l border-[#1a2234] pl-3">
                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">Lattice Sync</div>
                <div className="text-xs font-mono text-[#a855f7] font-bold">ACTIVE</div>
              </div>
              <div className="text-right border-l border-[#1a2234] pl-3">
                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">∑P Invariant</div>
                <div className="text-xs font-mono text-emerald-400 font-bold">1.000000</div>
              </div>
            </div>

            {/* Direct Manual Input Trigger */}
            {onOpenManualInput && (
              <button
                type="button"
                onClick={onOpenManualInput}
                className="text-xs font-medium bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 px-2.5 py-1.5 rounded transition flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,242,255,0.15)] cursor-pointer"
                title="Open Manual Raw Vector Input Box"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHi ? 'मैन्युअल इनपुट' : 'Manual Vector'}</span>
              </button>
            )}

            {/* Direct Export Report Trigger */}
            {onOpenExportReport && (
              <button
                type="button"
                onClick={onOpenExportReport}
                className="text-xs font-medium bg-[#7000ff]/20 hover:bg-[#7000ff]/30 text-[#c084fc] border border-[#7000ff]/40 px-2.5 py-1.5 rounded transition flex items-center gap-1.5 shadow-[0_0_8px_rgba(112,0,255,0.2)] cursor-pointer"
                title="Download Scientific Reports (MD, JSON, Text, PDF)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHi ? 'रिपोर्ट डाउनलोड' : 'Export Report'}</span>
              </button>
            )}

            {/* Quantum Ambient Soundscape Synthesizer Trigger */}
            {onOpenSoundscape && (
              <button
                type="button"
                onClick={onOpenSoundscape}
                className={`text-xs font-medium px-2.5 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer border ${
                  isSoundscapePlaying
                    ? 'bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.4)] animate-pulse'
                    : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-200 hover:text-[#00f2ff] border-[#1a2234]'
                }`}
                title="Open 11D Quantum Ambient Soundscape Synthesizer"
              >
                <Headphones className={`w-3.5 h-3.5 ${isSoundscapePlaying ? 'text-[#00f2ff]' : 'text-purple-400'}`} />
                <span className="hidden sm:inline font-mono">
                  {isHi ? 'साउंडस्केप' : 'Soundscape'}
                </span>
                {isSoundscapePlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
                )}
              </button>
            )}

            {/* Seed selector */}
            <div className="flex items-center space-x-1.5 bg-[#0a0f1d] px-2 py-1 rounded border border-[#1a2234] text-xs">
              <span className="text-gray-400 font-mono text-[10px] uppercase tracking-wider">Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => onChangeSeed(parseInt(e.target.value, 10) || 1)}
                className="w-12 bg-[#050810] text-[#00f2ff] font-mono text-xs px-1.5 py-0.5 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] text-center"
                title="Lattice Randomization Seed"
              />
              <button
                type="button"
                onClick={() => onChangeSeed(Math.floor(Math.random() * 900) + 100)}
                className="text-gray-400 hover:text-[#00f2ff] p-0.5 rounded hover:bg-[#1a2234] transition"
                title="Roll new Quantum Lattice Seed"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Reset to Sample Button */}
            <button
              type="button"
              onClick={onResetToSample}
              className="text-xs font-medium bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-200 hover:text-[#00f2ff] px-2.5 py-1.5 rounded border border-[#1a2234] hover:border-[#00f2ff]/40 transition flex items-center gap-1.5"
              title="Load original sample field data [0.85, 0.42, 0.63, 0.91]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span className="hidden sm:inline">{isHi ? 'मानक डेटा' : 'Sample Telemetry'}</span>
            </button>

            {/* Guide modal button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 text-gray-300 hover:text-[#00f2ff] bg-[#0a0f1d] hover:bg-[#1a2234] rounded border border-[#1a2234] transition"
              title="11D Planetary Vector Guide"
            >
              <BookOpen className="w-4 h-4 text-[#00f2ff]" />
            </button>

            {/* History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="p-1.5 text-gray-300 hover:text-[#a855f7] bg-[#0a0f1d] hover:bg-[#1a2234] rounded border border-[#1a2234] transition cursor-pointer"
              title="View Run History"
            >
              <History className="w-4 h-4 text-[#a855f7]" />
            </button>

            {/* Alert Center / Telemetry Sentinel Button */}
            {onOpenAlerts && (
              <button
                type="button"
                onClick={onOpenAlerts}
                className={`relative p-1.5 rounded border transition cursor-pointer flex items-center justify-center ${
                  hasCriticalAlert
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                    : alertCount > 0
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/50'
                    : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-400 hover:text-white border-[#1a2234]'
                }`}
                title={
                  isHi
                    ? `लैटिस जोखिम मॉनिटर (${alertCount} अलर्ट)`
                    : `Lattice Risk & Volatility Sentinel (${alertCount} alerts)`
                }
              >
                <Bell className="w-4 h-4" />
                {alertCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-black flex items-center justify-center text-white ${
                      hasCriticalAlert ? 'bg-rose-600 animate-ping' : 'bg-amber-500'
                    }`}
                  >
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
            )}

            {/* Language switch */}
            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1.5 rounded bg-[#7000ff]/20 border border-[#7000ff]/40 text-[#c084fc] hover:bg-[#7000ff]/30 transition"
              title="Switch Language / भाषा बदलें"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'EN' : 'हिंदी'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
