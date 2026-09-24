import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileCode2,
  FileText,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  Activity,
  AlertTriangle,
  Scale,
  MessageSquare,
  Bookmark,
  Plus,
  Atom,
  Globe,
  Ruler,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { DIMENSION_METADATA } from '../lib/quantumEngine';
import { LabHistoryEntry, QILComputationResult, ScientificInsightResult, ReportAnnotation, OutputUnitSystem } from '../types';
import { convertDimension, UNIT_SYSTEMS } from '../lib/unitConversion';

interface HistoryComparisonViewProps {
  currentComputation: QILComputationResult;
  currentInsight: ScientificInsightResult | null;
  history: LabHistoryEntry[];
  selectedHistoryId: string | null;
  onSelectHistoryId: (id: string) => void;
  onRestoreVector?: (vector: number[]) => void;
  onCloseComparison: () => void;
  onOpenTrendChart?: () => void;
  onGenerateCurrentInsight?: () => void;
  isLoadingCurrentInsight?: boolean;
  language: 'en' | 'hi';
  annotations?: ReportAnnotation[];
  onOpenAnnotationsForReport?: (reportId: string) => void;
  unitSystem?: OutputUnitSystem;
  onUnitSystemChange?: (system: OutputUnitSystem) => void;
}

export const HistoryComparisonView: React.FC<HistoryComparisonViewProps> = ({
  currentComputation,
  currentInsight,
  history,
  selectedHistoryId,
  onSelectHistoryId,
  onRestoreVector,
  onCloseComparison,
  onOpenTrendChart,
  onGenerateCurrentInsight,
  isLoadingCurrentInsight,
  language,
  annotations = [],
  onOpenAnnotationsForReport,
  unitSystem = 'LATTICE',
  onUnitSystemChange,
}) => {
  const isHi = language === 'hi';
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [copiedHistorical, setCopiedHistorical] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'coordinates' | 'insights' | 'both'>('both');

  // Selected historical entry
  const selectedEntry = useMemo(() => {
    if (!history || history.length === 0) return null;
    if (selectedHistoryId) {
      const found = history.find((h) => h.id === selectedHistoryId);
      if (found) return found;
    }
    return history[0];
  }, [history, selectedHistoryId]);

  const currentIndexInHistory = useMemo(() => {
    if (!selectedEntry) return -1;
    return history.findIndex((h) => h.id === selectedEntry.id);
  }, [history, selectedEntry]);

  // Navigate through history
  const handlePrevHistory = () => {
    if (currentIndexInHistory > 0) {
      onSelectHistoryId(history[currentIndexInHistory - 1].id);
    }
  };

  const handleNextHistory = () => {
    if (currentIndexInHistory < history.length - 1) {
      onSelectHistoryId(history[currentIndexInHistory + 1].id);
    }
  };

  // Euclidean distance between Current normalized output and Historical normalized output
  const euclideanDistance = useMemo(() => {
    if (!selectedEntry) return 0;
    let sumSq = 0;
    for (let i = 0; i < 11; i++) {
      const c = currentComputation.normalizedOutput[i] ?? 0;
      const h = selectedEntry.normalizedOutput[i] ?? 0;
      sumSq += (c - h) * (c - h);
    }
    return Math.sqrt(sumSq);
  }, [currentComputation, selectedEntry]);

  // Entropy comparison
  const entropyCurrent = currentComputation.entropy;
  const entropyHistorical = selectedEntry?.entropy ?? 0;
  const deltaEntropy = entropyCurrent - entropyHistorical;

  // Stability comparison
  const currentStability = currentInsight?.riskAssessment?.stabilityIndex ?? 82.5;
  const historicalStability = selectedEntry?.stabilityIndex ?? 80;
  const deltaStability = currentStability - historicalStability;

  // Highest flux dimension comparison
  const currentMaxDim = useMemo(() => {
    let maxIdx = 0;
    let maxVal = -1;
    currentComputation.normalizedOutput.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return {
      index: maxIdx,
      dim: DIMENSION_METADATA[maxIdx],
      value: maxVal,
    };
  }, [currentComputation]);

  const historicalMaxDim = useMemo(() => {
    if (!selectedEntry) return null;
    let maxIdx = 0;
    let maxVal = -1;
    selectedEntry.normalizedOutput.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return {
      index: maxIdx,
      dim: DIMENSION_METADATA[maxIdx],
      value: maxVal,
    };
  }, [selectedEntry]);

  // Copy helper
  const handleCopyText = (text: string, type: 'current' | 'historical') => {
    navigator.clipboard.writeText(text);
    if (type === 'current') {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2000);
    } else {
      setCopiedHistorical(true);
      setTimeout(() => setCopiedHistorical(false), 2000);
    }
  };

  // Export comparison summary markdown
  const handleExportComparison = () => {
    if (!selectedEntry) return;

    const rows = DIMENSION_METADATA.map((dim, i) => {
      const c = currentComputation.normalizedOutput[i] ?? 0;
      const h = selectedEntry.normalizedOutput[i] ?? 0;
      const delta = c - h;
      const pct = h !== 0 ? ((delta / h) * 100).toFixed(1) : '0.0';
      return `| ${dim.key} | ${dim.name} | ${c.toFixed(5)} | ${h.toFixed(5)} | ${delta >= 0 ? '+' : ''}${delta.toFixed(5)} (${pct}%) |`;
    }).join('\n');

    const markdown = `# R-WAVE UNIVERSAL INTELLIGENCE LAB
## 11D Quantum-Intelligence Lattice: Historical Comparison Audit

- **Generated:** ${new Date().toLocaleString()}
- **Current Run Timestamp:** ${currentComputation.timestamp}
- **Historical Run Timestamp:** ${selectedEntry.timestamp}
- **Historical Preset Name:** ${selectedEntry.presetName || 'Custom Telemetry Run'}
- **Vector Euclidean Distance ($d$):** ${euclideanDistance.toFixed(5)}
- **Entropy Shift ($\Delta S$):** ${deltaEntropy >= 0 ? '+' : ''}${deltaEntropy.toFixed(4)} bits (Current: ${entropyCurrent.toFixed(4)} vs Historical: ${entropyHistorical.toFixed(4)})
- **Stability Shift:** ${deltaStability >= 0 ? '+' : ''}${deltaStability.toFixed(1)}% (Current: ${currentStability}% vs Historical: ${historicalStability}%)

---

### 1. Side-by-Side 11-Dimensional Coordinate Delta Table
| Dimension | Physical Vector | Current ($Norm_{curr}$) | Historical ($Norm_{hist}$) | Absolute Delta ($\Delta$) |
|:---|:---|:---:|:---:|:---:|
${rows}

---

### 2. Current Scientific Insight
${currentInsight?.insightText || '_Pending Generation_'}

---

### 3. Historical Scientific Insight
${selectedEntry.insightText}

---
*Report certified by R-WAVE QIL Deterministic Operator $H = (M + M^\\dagger)/2$*
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r-wave-comparison-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!selectedEntry || history.length === 0) {
    return (
      <div className="bg-[#0a0f1d] rounded-lg border border-[#1a2234] p-8 text-center my-4">
        <Scale className="w-10 h-10 text-[#00f2ff] mx-auto mb-3 opacity-60 animate-pulse" />
        <h3 className="text-sm uppercase tracking-widest font-bold text-white mb-1">
          {isHi ? 'तुलना के लिए कोई पूर्व इतिहास रिकॉर्ड नहीं मिला' : 'No Prior Historical Runs Recorded'}
        </h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto mb-4 leading-relaxed">
          {isHi
            ? 'तुलना करने के लिए पहले कम से कम एक सिम्युलेटेड या फील्ड टेलीमेट्री रन निष्पादित करें।'
            : 'Execute at least one 11D simulation run or generate an insight to log history for comparative side-by-side analysis.'}
        </p>
        <button
          type="button"
          onClick={onCloseComparison}
          className="px-4 py-2 bg-[#050810] hover:bg-[#1a2234] text-[#00f2ff] font-mono text-xs font-bold rounded border border-[#1a2234] transition"
        >
          {isHi ? 'टर्मिनल दृश्य पर वापस जाएं' : 'Return to Standard Terminal View'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 my-3 animate-in fade-in duration-200">
      {/* Historical Selector & Control Toolbar */}
      <div className="bg-[#0a0f1d] p-3.5 rounded-lg border border-[#1a2234] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-[#050810] px-2.5 py-1.5 rounded border border-[#1a2234]">
            <Scale className="w-4 h-4 text-[#00f2ff]" />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
              {isHi ? 'इतिहास तुलना मोड' : 'Side-by-Side Comparison'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
              {currentIndexInHistory + 1} / {history.length}
            </span>
          </div>

          {/* Historical Run Selector Dropdown */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handlePrevHistory}
              disabled={currentIndexInHistory <= 0}
              className="p-1.5 bg-[#050810] hover:bg-[#1a2234] disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white rounded border border-[#1a2234] transition"
              title="Previous Historical Run"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedEntry.id}
              onChange={(e) => onSelectHistoryId(e.target.value)}
              className="bg-[#050810] text-[#00f2ff] font-mono text-xs px-3 py-1.5 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] max-w-[280px] sm:max-w-[340px] truncate"
            >
              {history.map((h, idx) => (
                <option key={h.id} value={h.id} className="bg-[#050810] text-gray-200">
                  #{idx + 1} [{new Date(h.timestamp).toLocaleTimeString()}] {h.presetName || 'Custom Run'}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextHistory}
              disabled={currentIndexInHistory >= history.length - 1}
              className="p-1.5 bg-[#050810] hover:bg-[#1a2234] disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white rounded border border-[#1a2234] transition"
              title="Next Historical Run"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selector: Coordinates | Insights | Both */}
          <div className="flex bg-[#050810] p-0.5 rounded border border-[#1a2234] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === 'both' ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isHi ? 'समग्र तुलना' : 'All Metrics'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coordinates')}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === 'coordinates' ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isHi ? '11D निर्देशांक' : '11D Grid'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === 'insights' ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isHi ? 'अंतर्दृष्टि तुलना' : 'Action Plan'}
            </button>
          </div>

          {/* Restore Historical Vector into Workspace */}
          {onRestoreVector && (
            <button
              type="button"
              onClick={() => onRestoreVector(selectedEntry.rawInput)}
              className="px-2.5 py-1.5 bg-[#050810] hover:bg-[#1a2234] text-amber-300 hover:text-amber-200 border border-[#1a2234] hover:border-amber-400/50 rounded text-xs font-mono flex items-center gap-1.5 transition"
              title="Load this historical vector into active workspace sliders"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHi ? 'यह वेक्टर लोड करें' : 'Restore Vector'}</span>
            </button>
          )}

          {/* Export Comparison Summary */}
          <button
            type="button"
            onClick={handleExportComparison}
            className="px-2.5 py-1.5 bg-[#050810] hover:bg-[#1a2234] text-[#00f2ff] hover:text-[#70fffa] border border-[#1a2234] hover:border-[#00f2ff]/50 rounded text-xs font-mono flex items-center gap-1.5 transition"
            title="Download comparative markdown report"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-[#00f2ff]" />}
            <span>{copiedSummary ? (isHi ? 'डाउनलोड हुआ' : 'Downloaded') : isHi ? 'तुलना रिपोर्ट डाउनलोड' : 'Export Delta'}</span>
          </button>

          {/* View D3 Trend Chart */}
          {onOpenTrendChart && (
            <button
              type="button"
              onClick={onOpenTrendChart}
              className="px-2.5 py-1.5 bg-[#050810] hover:bg-[#1a2234] text-[#00f2ff] hover:text-[#70fffa] border border-[#00f2ff]/30 hover:border-[#00f2ff] rounded text-xs font-mono flex items-center gap-1.5 transition shadow-[0_0_8px_rgba(0,242,255,0.15)]"
              title="Open D3.js Historical Stability Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>{isHi ? 'D3 रुझान' : 'D3 Trend'}</span>
            </button>
          )}

          {/* Close Comparison */}
          <button
            type="button"
            onClick={onCloseComparison}
            className="p-1.5 bg-[#050810] hover:bg-[#1a2234] text-gray-400 hover:text-white rounded border border-[#1a2234] transition"
            title="Close side-by-side comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delta KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Metric 1: Vector Euclidean Divergence */}
        <div className="bg-[#0a0f1d] p-3 rounded border border-[#1a2234] flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'वेक्टर विचलन (Distance)' : 'Vector Divergence'}</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#00f2ff]">
            d = {euclideanDistance.toFixed(4)}
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-1">
            {euclideanDistance < 0.05
              ? isHi ? 'अति निकट (Near-identical)' : 'Near-identical state'
              : euclideanDistance < 0.15
              ? isHi ? 'मध्यम बदलाव' : 'Moderate shift'
              : isHi ? 'महत्वपूर्ण विचलन' : 'High structural shift'}
          </div>
        </div>

        {/* Metric 2: Shannon Entropy Shift */}
        <div className="bg-[#0a0f1d] p-3 rounded border border-[#1a2234] flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <Scale className="w-3 h-3 text-[#c084fc]" />
            <span>{isHi ? 'शैनन एन्ट्रॉपी (ΔS)' : 'Entropy Shift (ΔS)'}</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {deltaEntropy >= 0 ? `+${deltaEntropy.toFixed(3)}` : deltaEntropy.toFixed(3)}
            </span>
            <span className="text-[10px] font-mono text-gray-400">bits</span>
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center gap-1">
            <span>Curr: {entropyCurrent.toFixed(3)}</span>
            <span className="text-gray-600">|</span>
            <span>Hist: {entropyHistorical ? entropyHistorical.toFixed(3) : 'N/A'}</span>
          </div>
        </div>

        {/* Metric 3: Stability Index Shift */}
        <div className="bg-[#0a0f1d] p-3 rounded border border-[#1a2234] flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            {deltaStability >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span>{isHi ? 'स्थिरता अंतर (Stability Δ)' : 'Stability Delta'}</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                deltaStability >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {deltaStability >= 0 ? `+${deltaStability.toFixed(1)}%` : `${deltaStability.toFixed(1)}%`}
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-1">
            {currentStability}% vs {historicalStability}%
          </div>
        </div>

        {/* Metric 4: Peak Critical Dimension Transition */}
        <div className="bg-[#0a0f1d] p-3 rounded border border-[#1a2234] flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{isHi ? 'शीर्ष तनाव आयाम' : 'Peak Bottleneck'}</span>
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-white truncate">
            <span className="text-[#00f2ff]">{currentMaxDim.dim?.key}</span>
            <span className="text-gray-500 mx-1">vs</span>
            <span className="text-[#c084fc]">{historicalMaxDim?.dim?.key || 'N/A'}</span>
          </div>
          <div className="text-[10px] font-mono text-gray-400 truncate mt-1">
            {currentMaxDim.dim?.key === historicalMaxDim?.dim?.key
              ? isHi ? 'समान मुख्य आयाम' : 'Same primary vector'
              : isHi ? 'आयामीय केंद्र स्थानांतरित' : 'Shifted focal vector'}
          </div>
        </div>
      </div>

      {/* Side-by-Side 11D Coordinates Delta Table */}
      {(activeTab === 'both' || activeTab === 'coordinates') && (
        <div className="bg-[#0a0f1d] rounded-lg border border-[#1a2234] overflow-hidden shadow-inner">
          <div className="px-4 py-3 border-b border-[#1a2234] bg-[#050810] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-[#00f2ff]" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                {isHi
                  ? '11-आयामी निर्देशांक तुलना एवं विस्थापन तालिका (11D Coordinate Deltas)'
                  : '11-Dimensional State Vector Comparison & Delta Grid'}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                {UNIT_SYSTEMS[unitSystem].shortLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
              {onUnitSystemChange && (
                <div className="flex items-center bg-[#050810] p-0.5 rounded border border-[#1a2234]">
                  {(['LATTICE', 'SI', 'IMPERIAL'] as OutputUnitSystem[]).map((sys) => (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => onUnitSystemChange(sys)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        unitSystem === sys
                          ? 'bg-[#00f2ff] text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {sys === 'LATTICE' ? 'Ψ' : sys}
                    </button>
                  ))}
                </div>
              )}

              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff]" />
                <span className="text-gray-300">{isHi ? 'वर्तमान (Current)' : 'Current'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                <span className="text-gray-300">{isHi ? 'इतिहास (Historical)' : 'Historical'}</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#050810] text-[10px] uppercase text-gray-400 border-b border-[#1a2234]">
                <tr>
                  <th className="px-3 py-2">{isHi ? 'आयाम (Dim)' : 'Dim'}</th>
                  <th className="px-3 py-2">{isHi ? 'भौतिक कारक (Vector Name)' : 'Physical Vector'}</th>
                  <th className="px-3 py-2 text-right">{isHi ? 'वर्तमान (Current)' : `Current (${UNIT_SYSTEMS[unitSystem].shortLabel})`}</th>
                  <th className="px-3 py-2 text-right">{isHi ? 'ऐतिहासिक (Historical)' : `Historical (${UNIT_SYSTEMS[unitSystem].shortLabel})`}</th>
                  <th className="px-3 py-2 text-right">{isHi ? 'परिवर्तन (Delta Δ)' : 'Delta (Δ)'}</th>
                  <th className="px-3 py-2 text-center">{isHi ? 'आयामीय दृश्य (Comparative Visual)' : 'Intensity Comparison'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2234]/60">
                {DIMENSION_METADATA.map((dim, idx) => {
                  const curr = currentComputation.normalizedOutput[idx] ?? 0;
                  const hist = selectedEntry.normalizedOutput[idx] ?? 0;
                  const delta = curr - hist;
                  const pct = hist !== 0 ? ((delta / hist) * 100).toFixed(1) : '0.0';

                  const currConverted = convertDimension(idx + 1, curr, unitSystem);
                  const histConverted = convertDimension(idx + 1, hist, unitSystem);

                  const isStrainIncreased = delta > 0.005;
                  const isStrainDecreased = delta < -0.005;

                  return (
                    <tr key={dim.key} className="hover:bg-[#1a2234]/30 transition-colors">
                      <td className="px-3 py-2 font-bold text-[#00f2ff]">{dim.key}</td>
                      <td className="px-3 py-2 text-gray-300 font-sans text-xs">
                        {isHi ? dim.hindiName : dim.name}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-cyan-300">
                        {currConverted.formattedValue}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-purple-300">
                        {histConverted.formattedValue}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${
                            isStrainIncreased
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : isStrainDecreased
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : 'bg-gray-800/50 text-gray-400'
                          }`}
                        >
                          {delta > 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}
                          <span className="text-[9px] opacity-75">({pct}%)</span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="w-36 sm:w-48 mx-auto flex flex-col gap-1">
                          {/* Current bar (cyan) */}
                          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234]">
                            <div
                              className="h-full bg-gradient-to-r from-[#00f2ff] to-cyan-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(2, curr * 500))}%` }}
                            />
                          </div>
                          {/* Historical bar (purple) */}
                          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234]">
                            <div
                              className="h-full bg-gradient-to-r from-[#7000ff] to-[#a855f7] rounded-full"
                              style={{ width: `${Math.min(100, Math.max(2, hist * 500))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Detailed Insight / Action Plan Split Panels */}
      {(activeTab === 'both' || activeTab === 'insights') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Current Run Insight */}
          <div className="bg-[#0a0f1d] rounded-lg border border-[#1a2234] flex flex-col overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-4 py-3 bg-[#050810] border-b border-[#1a2234] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                    {isHi ? 'वर्तमान लैटिस विश्लेषण (Current Run)' : 'Current Lattice State & Action Plan'}
                  </h4>
                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                    {new Date(currentComputation.timestamp).toLocaleTimeString()} • Seed #{currentComputation.seed}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                  {currentInsight?.riskAssessment?.level || 'ACTIVE'}
                </span>
                {currentInsight?.insightText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentInsight.insightText, 'current')}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1a2234] transition"
                    title="Copy current insight"
                  >
                    {copiedCurrent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar text-xs leading-relaxed text-gray-300">
              {currentInsight ? (
                <div className="markdown-body">
                  <Markdown>{currentInsight.insightText}</Markdown>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Sparkles className="w-8 h-8 text-[#00f2ff] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-gray-400 mb-3">
                    {isHi
                      ? 'वर्तमान वेक्टर के लिए अभी AI अंतर्दृष्टि उत्पन्न नहीं की गई है।'
                      : 'AI Scientific Insight has not been synthesized for the current vector yet.'}
                  </p>
                  {onGenerateCurrentInsight && (
                    <button
                      type="button"
                      onClick={onGenerateCurrentInsight}
                      disabled={isLoadingCurrentInsight}
                      className="px-3.5 py-1.5 bg-[#00f2ff] hover:bg-[#70fffa] text-[#020408] font-bold text-xs font-mono uppercase tracking-wider rounded transition"
                    >
                      {isLoadingCurrentInsight
                        ? isHi ? 'गणना जारी...' : 'Computing...'
                        : isHi ? 'वर्तमान अंतर्दृष्टि उत्पन्न करें' : 'Generate Current Insight'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Historical Run Insight */}
          <div className="bg-[#0a0f1d] rounded-lg border border-[#1a2234] flex flex-col overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-4 py-3 bg-[#050810] border-b border-[#1a2234] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                    {selectedEntry.presetName || (isHi ? 'ऐतिहासिक रन (Historical Run)' : 'Historical Benchmark Run')}
                  </h4>
                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                    {new Date(selectedEntry.timestamp).toLocaleString()} {selectedEntry.seed ? `• Seed #${selectedEntry.seed}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7000ff]/20 text-[#c084fc] border border-[#7000ff]/40">
                  {selectedEntry.riskLevel || 'ARCHIVE'}
                </span>
                {onOpenAnnotationsForReport && (
                  <button
                    type="button"
                    onClick={() => onOpenAnnotationsForReport(selectedEntry.id)}
                    className="p-1 text-purple-400 hover:text-white rounded hover:bg-[#1a2234] transition flex items-center gap-1 font-mono text-[10px]"
                    title="View & add team notes for this historical report"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {annotations.filter((a) => a.reportId === selectedEntry.id).length > 0
                        ? `${annotations.filter((a) => a.reportId === selectedEntry.id).length}`
                        : '+ Note'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedEntry.insightText, 'historical')}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1a2234] transition"
                  title="Copy historical insight"
                >
                  {copiedHistorical ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Attached Team Notes Snippet for this Historical Report */}
            {annotations.filter((a) => a.reportId === selectedEntry.id).length > 0 && (
              <div className="px-4 py-2 bg-[#050810]/80 border-b border-[#1a2234] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#a855f7] font-bold flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {isHi ? 'संलग्न टीम टिप्पणियाँ:' : 'Attached Team Knowledge Notes:'}
                  </span>
                  {onOpenAnnotationsForReport && (
                    <button
                      type="button"
                      onClick={() => onOpenAnnotationsForReport(selectedEntry.id)}
                      className="text-[#00f2ff] hover:underline"
                    >
                      {isHi ? 'सभी देखें' : 'Manage All'}
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {annotations
                    .filter((a) => a.reportId === selectedEntry.id)
                    .map((ann) => (
                      <div
                        key={ann.id}
                        className="text-[11px] font-mono p-1.5 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-[#c084fc]">
                              [{ann.markerType}]
                            </span>
                            <span className="text-gray-400 text-[10px]">{ann.author}</span>
                            {ann.pinnedDimension && (
                              <span className="text-[#00f2ff] text-[9px]">
                                ({ann.pinnedDimension})
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 line-clamp-2 mt-0.5">{ann.text}</p>
                        </div>
                        {ann.resolved && (
                          <span className="text-emerald-400 text-[9px] shrink-0 font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar text-xs leading-relaxed text-gray-300">
              <div className="markdown-body">
                <Markdown>{selectedEntry.insightText}</Markdown>
              </div>
            </div>

            {/* Bottom Restore Bar */}
            {onRestoreVector && (
              <div className="px-4 py-2 bg-[#050810] border-t border-[#1a2234] flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400 text-[11px]">
                  {isHi ? 'यह ऐतिहासिक वेक्टर वर्तमान सक्रिय मॉडल में डालें:' : 'Adopt this historical configuration:'}
                </span>
                <button
                  type="button"
                  onClick={() => onRestoreVector(selectedEntry.rawInput)}
                  className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isHi ? 'सक्रिय लैटिस में लोड करें' : 'Restore this Vector'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
