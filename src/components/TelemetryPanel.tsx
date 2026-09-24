import React, { useState } from 'react';
import { Sliders, Shuffle, RotateCcw, Droplets, Wind, Zap, Leaf, Sun, Snowflake, Sprout, Anchor, CloudFog, Mountain, Factory, Info, FileCode2, ArrowRight, Check } from 'lucide-react';
import { DIMENSION_METADATA, LAB_PRESETS } from '../lib/quantumEngine';
import { DimensionInfo } from '../types';

interface TelemetryPanelProps {
  vector: number[];
  onChangeVector: (newVector: number[]) => void;
  selectedPreset: string;
  onSelectPreset: (presetId: string) => void;
  language: 'en' | 'hi';
  onInspectDimension: (dim: DimensionInfo) => void;
  onOpenManualInput: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hydrosphere: <Droplets className="w-3.5 h-3.5 text-blue-500" />,
  atmosphere: <Wind className="w-3.5 h-3.5 text-cyan-500" />,
  energy: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  biosphere: <Leaf className="w-3.5 h-3.5 text-emerald-500" />,
  cryosphere: <Snowflake className="w-3.5 h-3.5 text-sky-400" />,
  lithosphere: <Mountain className="w-3.5 h-3.5 text-orange-500" />,
  anthroposphere: <Factory className="w-3.5 h-3.5 text-rose-500" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  hydrosphere: 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30',
  atmosphere: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  energy: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  biosphere: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cryosphere: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  lithosphere: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  anthroposphere: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  vector,
  onChangeVector,
  selectedPreset,
  onSelectPreset,
  language,
  onInspectDimension,
  onOpenManualInput,
}) => {
  const isHi = language === 'hi';
  const [quickInputStr, setQuickInputStr] = useState('');
  const [quickApplied, setQuickApplied] = useState(false);

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...vector];
    while (updated.length <= index) {
      updated.push(0);
    }
    updated[index] = Number(val.toFixed(3));
    onChangeVector(updated);
  };

  const handleRandomize = () => {
    const randomVec = Array.from({ length: 11 }, () => Number((Math.random() * 0.9 + 0.05).toFixed(2)));
    onChangeVector(randomVec);
  };

  const handleEqualize = () => {
    const equalVec = Array.from({ length: 11 }, () => 0.5);
    onChangeVector(equalVec);
  };

  const handleResetToZero = () => {
    const zeroVec = Array.from({ length: 11 }, () => 0.0);
    onChangeVector(zeroVec);
  };

  const handleApplyQuickString = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputStr.trim()) return;

    try {
      let cleaned = quickInputStr.trim();
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1);
      }
      cleaned = cleaned.replace(/D\d+\s*[:=]\s*/gi, '');
      const tokens = cleaned.split(/[\s,;\n\t]+/).filter((t) => t.length > 0);
      const parsed = tokens.map((t) => Math.max(0, Math.min(1, parseFloat(t) || 0)));

      if (parsed.length > 0) {
        const finalVec = [...parsed];
        while (finalVec.length < 11) {
          finalVec.push(DIMENSION_METADATA[finalVec.length]?.defaultValue ?? 0.5);
        }
        onChangeVector(finalVec.slice(0, 11));
        setQuickApplied(true);
        setTimeout(() => setQuickApplied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-[#050810]/80 rounded-lg border border-[#1a2234] shadow-xl p-4 sm:p-5 flex flex-col h-full relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#1a2234]">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#00f2ff]" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
              {isHi ? 'पर्यावरणीय व प्रणालीगत इनपुट वेक्टर (11D Telemetry)' : '11-Dimensional Field Telemetry Input'}
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isHi
              ? 'वास्तविक समय में पर्यावरणीय पैरामीटर समायोजित करें (0.00 - 1.00)'
              : 'Tune planetary & thermodynamic coordinates mapping into the 11D Quantum Lattice'}
          </p>
        </div>

        {/* Vector Utility Actions */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Manual Input Terminal Trigger */}
          <button
            type="button"
            onClick={onOpenManualInput}
            className="px-2.5 py-1 text-[11px] font-bold font-mono uppercase tracking-wider text-[#020408] bg-[#00f2ff] hover:bg-[#70fffa] rounded transition flex items-center gap-1 shadow-[0_0_10px_rgba(0,242,255,0.3)] cursor-pointer"
            title="Open dedicated manual vector input box"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{isHi ? 'मैन्युअल इनपुट बॉक्स' : 'Manual Input Box'}</span>
          </button>

          <button
            type="button"
            onClick={handleRandomize}
            className="px-2 py-1 text-[11px] font-medium text-gray-300 hover:text-[#00f2ff] bg-[#0a0f1d] hover:bg-[#1a2234] border border-[#1a2234] rounded transition flex items-center gap-1"
            title="Randomize all vector coordinates"
          >
            <Shuffle className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'यादृच्छिक' : 'Randomize'}</span>
          </button>
          <button
            type="button"
            onClick={handleEqualize}
            className="px-2 py-1 text-[11px] font-medium text-gray-300 hover:text-[#00f2ff] bg-[#0a0f1d] hover:bg-[#1a2234] border border-[#1a2234] rounded transition flex items-center gap-1"
            title="Equalize all to 0.50"
          >
            <span>{isHi ? 'समान (0.5)' : 'Equalize'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetToZero}
            className="px-2 py-1 text-[11px] font-medium text-gray-300 hover:text-rose-400 bg-[#0a0f1d] hover:bg-[#1a2234] border border-[#1a2234] rounded transition flex items-center gap-1"
            title="Clear all"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>{isHi ? 'शून्य' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="my-3">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          {isHi ? 'वैज्ञानिक परिदृश्य प्रीसेट (Presets):' : 'Systemic Scenario Presets:'}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {LAB_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`text-xs px-2.5 py-1.5 rounded border transition text-left flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff] font-semibold shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                    : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border-[#1a2234]'
                }`}
              >
                <span className="font-mono text-[10px] text-[#00f2ff]">{preset.id === 'sample_lab' ? '★' : '•'}</span>
                <span>{isHi ? preset.hindiTitle : preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Quick Vector Paste / Type Bar */}
      <form onSubmit={handleApplyQuickString} className="mb-2 bg-[#0a0f1d] p-2 rounded border border-[#1a2234] flex items-center gap-2">
        <FileCode2 className="w-3.5 h-3.5 text-[#00f2ff] shrink-0" />
        <input
          type="text"
          value={quickInputStr}
          onChange={(e) => setQuickInputStr(e.target.value)}
          placeholder={isHi ? 'सीधे मान पेस्ट करें, उदा: 0.85, 0.42, 0.63, 0.91' : 'Quick paste vector, e.g: 0.85, 0.42, 0.63, 0.91'}
          className="flex-1 bg-[#050810] text-[#00f2ff] font-mono text-xs px-2.5 py-1 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff]"
        />
        <button
          type="submit"
          disabled={!quickInputStr.trim()}
          className="px-2.5 py-1 bg-[#050810] hover:bg-[#1a2234] text-[#00f2ff] hover:text-[#70fffa] font-mono text-[11px] font-bold border border-[#1a2234] hover:border-[#00f2ff]/50 rounded transition flex items-center gap-1 disabled:opacity-40"
        >
          {quickApplied ? <Check className="w-3 h-3 text-emerald-400" /> : <ArrowRight className="w-3 h-3" />}
          <span>{quickApplied ? (isHi ? 'लागू हुआ' : 'Applied') : isHi ? 'लागू करें' : 'Apply'}</span>
        </button>
      </form>

      {/* Sliders Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-1 max-h-[460px] custom-scrollbar">
        {DIMENSION_METADATA.map((dim, idx) => {
          const currentVal = vector[idx] !== undefined ? vector[idx] : 0;
          const isSampleKey = idx < 4 && selectedPreset === 'sample_lab';

          return (
            <div
              key={dim.key}
              className={`p-2.5 rounded border transition-all ${
                isSampleKey
                  ? 'bg-[#0a0f1d] border-[#00f2ff]/40 shadow-[0_0_8px_rgba(0,242,255,0.08)]'
                  : 'bg-[#0a0f1d]/60 border-[#1a2234] hover:border-[#1a2234]/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#00f2ff] bg-[#050810] px-1.5 py-0.5 rounded border border-[#1a2234]">
                    {dim.key}
                  </span>
                  <span className="text-xs font-semibold text-gray-200 truncate" title={dim.name}>
                    {isHi ? dim.hindiName : dim.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Category Pill */}
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      CATEGORY_COLORS[dim.category] || 'bg-[#0a0f1d] text-gray-400'
                    }`}
                  >
                    {CATEGORY_ICONS[dim.category]}
                    <span>{dim.category}</span>
                  </span>

                  {/* Info modal trigger */}
                  <button
                    type="button"
                    onClick={() => onInspectDimension(dim)}
                    className="text-gray-400 hover:text-[#00f2ff] p-0.5 rounded transition"
                    title={dim.description}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {/* Exact Numeric Input */}
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-16 bg-[#050810] text-[#00f2ff] font-mono text-xs font-bold px-1.5 py-0.5 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] text-right"
                  />
                </div>
              </div>

              {/* Slider track */}
              <div className="flex items-center space-x-2.5">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentVal}
                  onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#1a2234] rounded appearance-none cursor-pointer accent-[#00f2ff] focus:outline-none"
                />
                <span className="font-mono text-[11px] text-[#00f2ff] w-8 text-right font-semibold">
                  {Math.round(currentVal * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Vector Preview footer */}
      <div className="mt-3 pt-3 border-t border-[#1a2234] flex flex-wrap items-center justify-between text-xs text-gray-400 font-mono">
        <span>
          Input Vector length: <strong className="text-[#00f2ff]">{vector.length}</strong> (Padded to 11D)
        </span>
        <span className="truncate max-w-[280px] bg-[#0a0f1d] px-2 py-0.5 rounded text-[11px] text-[#00f2ff] border border-[#1a2234]">
          [{vector.map((v) => Number(v).toFixed(2)).join(', ')}]
        </span>
      </div>
    </div>
  );
};
