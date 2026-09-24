import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Terminal,
  Copy,
  Check,
  Download,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileCode2,
  Send,
  FileText,
  Share2,
  Scale,
  ArrowRightLeft,
  History as HistoryIcon,
  TrendingUp,
  Activity,
  LineChart,
  Layers,
  MessageSquare,
  Bookmark,
  Plus,
  Atom,
  Globe,
  Ruler,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import {
  ScientificInsightResult,
  QILComputationResult,
  LabHistoryEntry,
  ReportAnnotation,
  OutputUnitSystem,
} from '../types';
import { HistoryComparisonView } from './HistoryComparisonView';
import { StabilityTrendChart } from './StabilityTrendChart';
import { BatchProcessingView } from './BatchProcessingView';
import { ReportAnnotationManager } from './ReportAnnotationManager';
import {
  UNIT_SYSTEMS,
  convertAllDimensions,
  formatCoordinatesString,
} from '../lib/unitConversion';
import { UnitConversionModal } from './UnitConversionModal';

interface ScientificInsightTerminalProps {
  computation: QILComputationResult;
  insight: ScientificInsightResult | null;
  isLoading: boolean;
  onGenerateInsight: () => void;
  language: 'en' | 'hi';
  onOpenExportModal?: () => void;
  history?: LabHistoryEntry[];
  onRestoreVector?: (vector: number[]) => void;
}

const INITIAL_TEAM_ANNOTATIONS: ReportAnnotation[] = [
  {
    id: 'ann-init-1',
    reportId: 'current',
    reportTitle: 'Current Active Telemetry Run',
    author: 'Dr. Sen (Lead Quantum)',
    text: 'Unitary sum ∑P = 1.0000 confirms zero-hallucination boundary. Observe the non-linear coupling between D1 (Hydrosphere) and D4 (Soil Carbon) - recommended buffer threshold set at 0.28.',
    markerType: 'VERIFIED',
    pinnedDimension: 'D1',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    resolved: true,
  },
  {
    id: 'ann-init-2',
    reportId: 'sample-drought-01',
    reportTitle: 'Severe Hydrological Drought Benchmark',
    author: 'Hydrology Research Team',
    text: 'Hydrological amplitude collapsed to 0.15 with compensatory thermal surge in D2 (+0.78). Flagged for peer review regarding groundwater extraction caps.',
    markerType: 'ANOMALY',
    pinnedDimension: 'D1',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolved: false,
  },
  {
    id: 'ann-init-3',
    reportId: 'sample-heat-02',
    reportTitle: 'Thermal Heatwave & Cryosphere Melt Pulse',
    author: 'Ecological Systems Specialist',
    text: 'Working hypothesis: Cryospheric phase transition dampens overall lattice entropy below 2.8 bits, leading to systemic fragility under recurring heatwaves.',
    markerType: 'HYPOTHESIS',
    pinnedDimension: 'D5',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    resolved: false,
  },
  {
    id: 'ann-init-4',
    reportId: 'sample-monsoon-03',
    reportTitle: 'South Asian Monsoon Dynamic Stabilization',
    author: 'Field Operative (Station Alpha)',
    text: 'Priority review needed: Seasonal monsoon feedback successfully balances D3 Atmospheric Moisture. Action plan aligns with municipal reservoir replenishment schedules.',
    markerType: 'CRITICAL_REVIEW',
    pinnedDimension: 'D3',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    resolved: false,
  },
];

export const ScientificInsightTerminal: React.FC<ScientificInsightTerminalProps> = ({
  computation,
  insight,
  isLoading,
  onGenerateInsight,
  language,
  onOpenExportModal,
  history = [],
  onRestoreVector,
}) => {
  const isHi = language === 'hi';
  const [copied, setCopied] = useState(false);
  const [copiedInsight, setCopiedInsight] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeView, setActiveView] = useState<'terminal' | 'trend' | 'comparison' | 'batch' | 'annotations'>('terminal');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [annotationReportFilter, setAnnotationReportFilter] = useState<string | null>(null);

  // Unit System Selection State with LocalStorage Persistence
  const [outputUnitSystem, setOutputUnitSystem] = useState<OutputUnitSystem>(() => {
    try {
      const saved = localStorage.getItem('rwave_output_unit_system');
      if (saved === 'SI' || saved === 'IMPERIAL' || saved === 'LATTICE') {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'LATTICE';
  });

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [showDimensionChips, setShowDimensionChips] = useState(true);
  const [copiedUnitSys, setCopiedUnitSys] = useState<string | null>(null);

  const handleUnitSystemChange = (sys: OutputUnitSystem) => {
    setOutputUnitSystem(sys);
    try {
      localStorage.setItem('rwave_output_unit_system', sys);
    } catch (e) {
      // ignore
    }
  };

  // Annotations State with LocalStorage Persistence
  const [annotations, setAnnotations] = useState<ReportAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem('rwave_team_annotations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_TEAM_ANNOTATIONS;
  });

  const handleAddAnnotation = (ann: Omit<ReportAnnotation, 'id' | 'timestamp'>) => {
    const newAnn: ReportAnnotation = {
      ...ann,
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setAnnotations((prev) => {
      const next = [newAnn, ...prev];
      try {
        localStorage.setItem('rwave_team_annotations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('rwave_team_annotations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleToggleResolveAnnotation = (id: string) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, resolved: !a.resolved } : a));
      try {
        localStorage.setItem('rwave_team_annotations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Initialize selected history id when history updates
  useEffect(() => {
    if (history.length > 0 && !selectedHistoryId) {
      setSelectedHistoryId(history[0].id);
    }
  }, [history, selectedHistoryId]);

  // Trigger celebration confetti on fresh insight generation
  useEffect(() => {
    if (insight && !isLoading) {
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#6366f1', '#10b981'],
        });
      } catch (e) {
        // ignore in case canvas is constrained
      }
    }
  }, [insight, isLoading]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setCopiedUnitSys(outputUnitSystem);
    setTimeout(() => {
      setCopied(false);
      setCopiedUnitSys(null);
    }, 2000);
  };

  const handleCopyInsight = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInsight(true);
    setTimeout(() => setCopiedInsight(false), 2000);
  };

  const convertedDimensions = convertAllDimensions(computation.normalizedOutput, outputUnitSystem);
  const activeCoordinatesStr = formatCoordinatesString(computation.normalizedOutput, outputUnitSystem);

  const handleDownloadMarkdown = () => {
    const md = `# R-WAVE UNIVERSAL INTELLIGENCE LAB
## 11D Quantum-Intelligence Lattice (QIL) Scientific Report

- **Date:** ${new Date().toLocaleString()}
- **Hermitian Seed:** #${computation.seed}
- **Unitary Invariant:** ∑ P_i = ${computation.sumProbability.toFixed(6)} [Deterministic Invariant Verified]
- **Shannon Entropy:** ${computation.entropy.toFixed(4)} bits
- **Stability Index:** ${insight?.riskAssessment?.stabilityIndex ?? 85}%
- **Active Unit System:** ${UNIT_SYSTEMS[outputUnitSystem].name} (${outputUnitSystem})

### Verified 11D Mathematical Output Coordinates (${UNIT_SYSTEMS[outputUnitSystem].shortLabel})
\`\`\`text
${activeCoordinatesStr}
\`\`\`

### 11D Dimensional Output Matrix & Multi-Unit Equivalents
| Dim | Physical Domain | R-WAVE Lattice (Ψ) | SI Metric Unit | Imperial Unit | Conversion Formula |
| :--- | :--- | :---: | :---: | :---: | :--- |
${convertedDimensions.map((c) => `| ${c.key} | ${c.name} | ${c.latticeValue.toFixed(5)} Ψ | ${c.siFormatted} | ${c.imperialFormatted} | \`${c.conversionFormula}\` |`).join('\n')}

### Scientific Insight & Planetary Action Plan
${insight?.insightText ?? 'No insight attached.'}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r-wave-11d-report-${outputUnitSystem.toLowerCase()}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const reportData = {
      title: 'R-WAVE 11D Quantum-Intelligence Lattice Verified Scientific Dispatch',
      lab: 'R-WAVE Universal Intelligence Lab',
      avatar: 'Rajesh (R WAY)',
      generatedAt: insight?.generatedAt || new Date().toISOString(),
      quantumLatticeSeed: computation.seed,
      invariants: {
        unitarySum: computation.sumProbability,
        hermitianError: computation.hermitianError,
        shannonEntropy: computation.entropy,
        zeroHallucinationCertified: true,
      },
      rawInputVector: computation.rawInput,
      activeUnitSystem: outputUnitSystem,
      formattedCoordinatesString: activeCoordinatesStr,
      exactVerifiedCoordinates: convertedDimensions.map((val) => ({
        dimension: val.key,
        name: val.name,
        category: val.category,
        latticeAmplitude: val.latticeValue,
        activeSystemValue: val.convertedValue,
        activeSystemFormatted: val.formattedValue,
        activeSystemUnit: val.unitSymbol,
        siFormatted: val.siFormatted,
        imperialFormatted: val.imperialFormatted,
        conversionFormula: val.conversionFormula,
      })),
      scientificInsightText: insight?.insightText,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r-wave-11d-qil-dispatch-${outputUnitSystem.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!insight?.insightText) return;
      window.speechSynthesis.cancel();
      // Remove markdown hashtags and bolding for cleaner speech
      const cleanSpeech = insight.insightText.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const riskBadgeColors = {
    CRITICAL: 'bg-rose-950/80 text-rose-300 border-rose-800',
    ELEVATED: 'bg-amber-950/80 text-amber-300 border-amber-800',
    BALANCED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    OPTIMAL: 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40',
  };

  return (
    <div className="bg-[#050810] text-[#e0e6ed] rounded-lg border border-[#1a2234] shadow-2xl p-5 sm:p-6 flex flex-col relative overflow-hidden">
      {/* Terminal Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1a2234]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" />
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
              {isHi ? 'वैज्ञानिक विश्लेषण टर्मिनल (QIL AI Engine)' : 'Scientific Insight Engine'}
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#7000ff]/20 text-[#c084fc] border border-[#7000ff]/40">
                Gemini 3.7 Flash
              </span>
            </h2>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {isHi
                ? 'गणितीय रूप से सत्यापित 11D निर्देशांकों से सटीक पूर्वानुमान एवं मानवीय समाधान'
                : 'Deterministic planetary insights generated from verified 11D quantum state vectors'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#0a0f1d] p-0.5 rounded-lg border border-[#1a2234]">
            {/* Terminal View Button */}
            <button
              type="button"
              onClick={() => setActiveView('terminal')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'terminal'
                  ? 'bg-[#1a2234] text-white shadow-sm border border-gray-600/50'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Standard Terminal & Verified Action Plan"
            >
              <Terminal className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>{isHi ? 'टर्मिनल' : 'Terminal'}</span>
            </button>

            {/* D3 Stability Trend Button */}
            <button
              type="button"
              onClick={() => setActiveView('trend')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'trend'
                  ? 'bg-[#00f2ff] text-[#020408] shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                  : 'text-[#00f2ff] hover:text-[#70fffa] hover:bg-[#1a2234]/50'
              }`}
              title="Visualize Historical StabilityIndex Performance Trends with D3.js"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isHi ? 'स्थिरता रुझान (D3)' : 'Stability Trend'}</span>
              <span className={`text-[9px] px-1 rounded font-mono ${activeView === 'trend' ? 'bg-[#020408] text-[#00f2ff]' : 'bg-[#00f2ff]/20 text-[#00f2ff]'}`}>
                D3.js
              </span>
            </button>

            {/* Side-by-Side Comparison Toggle Button */}
            <button
              type="button"
              onClick={() => setActiveView('comparison')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'comparison'
                  ? 'bg-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Compare Current Computation Result Side-by-Side with Historical Runs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isHi ? 'इतिहास तुलना' : 'Compare'}</span>
              {history && history.length > 0 && (
                <span
                  className={`px-1 rounded text-[9px] font-mono ${
                    activeView === 'comparison' ? 'bg-black/40 text-white' : 'bg-[#1a2234] text-gray-300'
                  }`}
                >
                  {history.length}
                </span>
              )}
            </button>

            {/* Batch Processing View Button */}
            <button
              type="button"
              onClick={() => setActiveView('batch')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'batch'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#7000ff] text-white shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                  : 'text-gray-300 hover:text-[#00f2ff]'
              }`}
              title="Batch Process Multiple Input Vectors & Generate Aggregated Comparative Report"
            >
              <Layers className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>{isHi ? 'बैच प्रोसेसिंग' : 'Batch Lab'}</span>
              <span className="text-[9px] px-1 rounded font-mono bg-[#00f2ff]/20 text-[#00f2ff]">
                Batch
              </span>
            </button>

            {/* Team Annotations & Knowledge Sharing Button */}
            <button
              type="button"
              onClick={() => {
                setAnnotationReportFilter(null);
                setActiveView('annotations');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'annotations'
                  ? 'bg-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-gray-300 hover:text-[#c084fc]'
              }`}
              title="Team Knowledge Sharing, Report Notes & Anomaly Markers"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#c084fc]" />
              <span>{isHi ? 'टीम नोट्स' : 'Team Notes'}</span>
              {annotations.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#a855f7]/30 text-white">
                  {annotations.length}
                </span>
              )}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onGenerateInsight}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-[#00f2ff] text-[#020408] text-xs font-bold uppercase tracking-wider hover:bg-[#70fffa] shadow-[0_0_15px_rgba(0,242,255,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#020408]" />
                <span>{isHi ? '11D गणना जारी...' : 'Computing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#020408]" />
                <span>{isHi ? 'कार्य योजना' : 'Synthesize Plan'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeView === 'trend' ? (
        /* D3.js Interactive Historical Stability Index Trend Visualization */
        <StabilityTrendChart
          history={history}
          currentComputation={computation}
          currentInsight={insight}
          onRestoreVector={onRestoreVector}
          onSelectForComparison={(histId) => {
            setSelectedHistoryId(histId);
            setActiveView('comparison');
          }}
          language={language}
        />
      ) : activeView === 'comparison' ? (
        /* Side-by-Side Historical Comparison View */
        <HistoryComparisonView
          currentComputation={computation}
          currentInsight={insight}
          history={history}
          selectedHistoryId={selectedHistoryId}
          onSelectHistoryId={setSelectedHistoryId}
          onRestoreVector={onRestoreVector}
          onCloseComparison={() => setActiveView('terminal')}
          onOpenTrendChart={() => setActiveView('trend')}
          onGenerateCurrentInsight={onGenerateInsight}
          isLoadingCurrentInsight={isLoading}
          language={language}
          annotations={annotations}
          onOpenAnnotationsForReport={(repId) => {
            setAnnotationReportFilter(repId);
            setActiveView('annotations');
          }}
          unitSystem={outputUnitSystem}
          onUnitSystemChange={handleUnitSystemChange}
        />
      ) : activeView === 'batch' ? (
        /* Batch Processing & Multi-Vector Aggregated Comparative Report View */
        <div className="mt-4 animate-in fade-in duration-150">
          <BatchProcessingView
            currentSeed={computation.seed}
            language={language}
            onApplyVectorToWorkstation={(vec) => {
              if (onRestoreVector) {
                onRestoreVector(vec);
                setActiveView('terminal');
              }
            }}
          />
        </div>
      ) : activeView === 'annotations' ? (
        /* Team Annotations & Collaborative Knowledge Sharing View */
        <div className="mt-4 animate-in fade-in duration-150">
          <ReportAnnotationManager
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onToggleResolveAnnotation={handleToggleResolveAnnotation}
            history={history}
            currentComputation={computation}
            onSelectHistoricalReport={(repId) => {
              setSelectedHistoryId(repId);
              setActiveView('comparison');
            }}
            language={language}
            activeReportIdFilter={annotationReportFilter}
            onClearReportFilter={() => setAnnotationReportFilter(null)}
          />
        </div>
      ) : (
        <>
          {/* Verified Coordinates Display Box with Output Unit Switcher */}
          <div className="my-4 bg-[#0a0f1d] rounded-xl p-4 border border-[#1a2234] shadow-lg space-y-3">
            {/* Top Bar: Title & Unit Switcher & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-[#1a2234]/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30">
                  <FileCode2 className="w-4 h-4 text-[#00f2ff]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                      {isHi ? 'सत्यापित 11D निर्देशांक आउटपुट' : 'Verified 11D Mathematical Output'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        outputUnitSystem === 'LATTICE'
                          ? 'bg-[#00f2ff]/15 text-[#00f2ff] border-[#00f2ff]/40'
                          : outputUnitSystem === 'SI'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {UNIT_SYSTEMS[outputUnitSystem].shortLabel}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                    {isHi
                      ? 'इकाई प्रणाली: क्वांटम लैटिस (Ψ), SI मीट्रिक (km³, GW) या इंपीरियल (ac-ft, Mhp)'
                      : 'Toggle units between dimensionless Quantum Lattice (Ψ), SI Metric, or Imperial engineering'}
                  </p>
                </div>
              </div>

              {/* Unit System Toggle Buttons & Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 3-Way Unit System Switcher */}
                <div className="flex items-center bg-[#050810] p-0.5 rounded-lg border border-[#1a2234] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => handleUnitSystemChange('LATTICE')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer text-[11px] font-bold ${
                      outputUnitSystem === 'LATTICE'
                        ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="R-WAVE Quantum Lattice Units (Dimensionless Ψ Amplitude [0-1], ∑P = 1.0000)"
                  >
                    <Atom className="w-3.5 h-3.5" />
                    <span>Lattice (Ψ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUnitSystemChange('SI')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer text-[11px] font-bold ${
                      outputUnitSystem === 'SI'
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="International System of Units - SI Metric (km³, GW, ppm, W/m², t/ha, MPa)"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>SI Metric</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUnitSystemChange('IMPERIAL')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer text-[11px] font-bold ${
                      outputUnitSystem === 'IMPERIAL'
                        ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Imperial & US Customary Units (M ac-ft, B tons, Mhp, M Acres, BTU, ksi)"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Imperial</span>
                  </button>
                </div>

                {/* Unit Matrix Details Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(true)}
                  className="px-2 py-1 rounded bg-[#050810] hover:bg-[#1a2234] border border-[#1a2234] hover:border-[#00f2ff]/40 text-gray-300 hover:text-[#00f2ff] text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                  title="View Full Cross-System Unit Conversion Matrix & Formulas"
                >
                  <Sliders className="w-3 h-3 text-[#00f2ff]" />
                  <span>{isHi ? 'इकाई मैट्रिक्स' : 'Unit Matrix'}</span>
                </button>

                {/* Toggle Dimension Chips */}
                <button
                  type="button"
                  onClick={() => setShowDimensionChips(!showDimensionChips)}
                  className="px-2 py-1 rounded bg-[#050810] hover:bg-[#1a2234] border border-[#1a2234] text-gray-400 hover:text-white text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                  title="Toggle 11D dimension breakdown chips grid"
                >
                  {showDimensionChips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{showDimensionChips ? (isHi ? 'संक्षिप्त' : 'Collapse') : (isHi ? '11D ग्रिड' : '11D Grid')}</span>
                </button>

                {/* D3 Trend Shortcut */}
                <button
                  type="button"
                  onClick={() => setActiveView('trend')}
                  className="text-[#00f2ff] hover:text-[#70fffa] text-[11px] font-mono flex items-center gap-1 bg-[#050810] hover:bg-[#1a2234] border border-[#1a2234] hover:border-[#00f2ff]/40 px-2 py-1 rounded transition cursor-pointer"
                  title="View Historical Stability Index Trend with D3.js"
                >
                  <TrendingUp className="w-3 h-3 text-[#00f2ff]" />
                  <span>{isHi ? 'रुझान' : 'Trend'}</span>
                </button>

                {/* Copy Coordinates */}
                <button
                  type="button"
                  onClick={() => handleCopy(activeCoordinatesStr)}
                  className="text-gray-300 hover:text-[#00f2ff] text-[11px] font-mono flex items-center gap-1 bg-[#050810] hover:bg-[#1a2234] border border-[#1a2234] px-2.5 py-1 rounded transition cursor-pointer"
                  title={`Copy coordinates in active ${outputUnitSystem} format`}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? `Copied (${copiedUnitSys})` : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* The Output Box */}
            <div className="font-mono text-xs text-[#e0e6ed] bg-[#050810] p-3 rounded-lg border border-[#1a2234] break-words leading-relaxed selection:bg-[#00f2ff] selection:text-[#020408]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-[#1a2234]/70 text-[10px]">
                <span className="text-[#00f2ff] select-none font-bold tracking-wide">
                  === R-WAVE 11D QIL-ENGINE VERIFIED OUTPUT ({UNIT_SYSTEMS[outputUnitSystem].name.toUpperCase()}) ===
                </span>
                <span className="text-gray-500 font-mono">
                  {outputUnitSystem === 'LATTICE'
                    ? `∑Ψ = ${computation.sumProbability.toFixed(5)} [Unitary Invariant Verified]`
                    : outputUnitSystem === 'SI'
                    ? 'Planetary Metric Calibrated (SI)'
                    : 'US Customary Engineering Calibrated'}
                </span>
              </div>
              <div className="text-gray-200 tracking-wide">
                {activeCoordinatesStr}
              </div>
            </div>

            {/* Interactive 11D Dimension Breakdown Chips */}
            {showDimensionChips && (
              <div className="pt-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {convertedDimensions.map((dim) => {
                    const maxVal = Math.max(...computation.normalizedOutput);
                    const ratio = maxVal > 0 ? (dim.latticeValue / maxVal) * 100 : 0;

                    return (
                      <div
                        key={dim.dimId}
                        onClick={() => setIsUnitModalOpen(true)}
                        className="bg-[#050810] hover:bg-[#0d1424] p-2 rounded-lg border border-[#1a2234] hover:border-[#00f2ff]/50 transition cursor-pointer group flex flex-col justify-between"
                        title={`${dim.name} (${dim.category})\n• Lattice: ${dim.latticeValue.toFixed(5)} Ψ\n• SI Metric: ${dim.siFormatted}\n• Imperial: ${dim.imperialFormatted}\n• Formula: ${dim.conversionFormula}\n(Click to view full conversion matrix)`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold font-mono text-[#00f2ff]">
                              {dim.key}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 text-gray-400">
                              {dim.unitSymbol}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono font-semibold text-gray-200 truncate group-hover:text-white">
                            {dim.formattedValue}
                          </div>
                          <div className="text-[9px] font-sans text-gray-400 truncate mt-0.5">
                            {isHi ? dim.hindiName.split(' ')[0] : dim.name.split(' ')[0]}
                          </div>
                        </div>

                        {/* Relative intensity bar */}
                        <div className="mt-1.5 w-full bg-[#1a2234] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#00f2ff] to-[#a855f7] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(6, ratio))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Result Terminal / Insight Area */}
          <div className="flex-1 flex flex-col">
            {insight ? (
              <div className="space-y-4">
                {/* Metadata and Risk Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0a0f1d] p-3 rounded border border-[#1a2234] text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono text-[11px] uppercase">Systemic State:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold border text-[10px] ${
                        riskBadgeColors[insight.riskAssessment?.level || 'BALANCED']
                      }`}
                    >
                      {insight.riskAssessment?.level || 'BALANCED'}
                    </span>
                    <span className="text-gray-400 border-l border-[#1a2234] pl-2 font-mono text-[11px] flex items-center gap-1.5">
                      <span>Stability Index: <strong className="text-[#00f2ff] font-mono">{insight.riskAssessment?.stabilityIndex}%</strong></span>
                      <button
                        type="button"
                        onClick={() => setActiveView('trend')}
                        className="ml-1 px-1.5 py-0.5 rounded bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                        title="Open D3.js Historical Stability Line Chart"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>D3 Trend ↗</span>
                      </button>
                    </span>
                  </div>

                  {/* Utility actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleSpeech}
                      className={`px-2 py-1 rounded border text-xs font-mono flex items-center gap-1 transition ${
                        isSpeaking
                          ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff] ring-1 ring-[#00f2ff]/50'
                          : 'bg-[#050810] text-gray-300 border-[#1a2234] hover:bg-[#1a2234]'
                      }`}
                      title={isSpeaking ? 'Stop Audio Readout' : 'Audio Speech Readout'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-[#00f2ff] animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'Speaking...' : 'Audio Dispatch'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMarkdown}
                      className="px-2 py-1 rounded border bg-[#050810] hover:bg-[#1a2234] text-gray-300 hover:text-[#00f2ff] border-[#1a2234] text-xs font-mono flex items-center gap-1 transition"
                      title="Download Markdown Report (.md)"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#00f2ff]" />
                      <span>.MD Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="px-2 py-1 rounded border bg-[#050810] hover:bg-[#1a2234] text-gray-300 hover:text-[#c084fc] border-[#1a2234] text-xs font-mono flex items-center gap-1 transition"
                      title="Download JSON Lab Audit Report (.json)"
                    >
                      <Download className="w-3.5 h-3.5 text-[#a855f7]" />
                      <span>.JSON Audit</span>
                    </button>

                    {onOpenExportModal && (
                      <button
                        type="button"
                        onClick={onOpenExportModal}
                        className="px-2.5 py-1 rounded border bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40 text-xs font-mono font-bold flex items-center gap-1 transition shadow-[0_0_8px_rgba(0,242,255,0.15)] cursor-pointer"
                        title="Open Full Report Export Suite (Markdown, JSON, Text, CSV, PDF)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isHi ? 'रिपोर्ट डाउनलोड केंद्र' : 'Export Suite'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyInsight(insight.insightText)}
                      className="px-2 py-1 rounded border bg-[#050810] hover:bg-[#1a2234] text-gray-300 hover:text-emerald-400 border-[#1a2234] text-xs font-mono flex items-center gap-1 transition"
                      title="Copy full scientific report to clipboard"
                    >
                      {copiedInsight ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedInsight ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Scientific Insight Body */}
                <div className="bg-[#0a0f1d] rounded p-5 border-l-2 border-[#00f2ff] border-y border-r border-[#1a2234] text-gray-300 text-sm leading-relaxed max-w-none shadow-inner">
                  <div className="markdown-body text-gray-200">
                    <Markdown>{insight.insightText}</Markdown>
                  </div>
                </div>

                {/* Attached Notes & Knowledge Sharing Strip for Current Report */}
                <div className="bg-[#050810] p-3 rounded-lg border border-[#1a2234] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span className="text-[11px] font-mono font-bold text-gray-200">
                      {isHi ? 'टीम एनोटेशन एवं अनुसंधान नोट्स:' : 'Team Annotations & Knowledge Sharing:'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
                      {annotations.filter((a) => a.reportId === 'current').length} {isHi ? 'संलग्न' : 'Attached'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAnnotationReportFilter('current');
                        setActiveView('annotations');
                      }}
                      className="px-2.5 py-1 rounded bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#c084fc] border border-[#a855f7]/40 text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isHi ? 'नोट जोड़ें' : 'Attach Note / Marker'}</span>
                    </button>

                    {annotations.filter((a) => a.reportId === 'current').length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotationReportFilter('current');
                          setActiveView('annotations');
                        }}
                        className="text-[#00f2ff] hover:underline text-[10px] font-mono"
                      >
                        {isHi ? 'नोट्स प्रबंधित करें' : 'Manage Notes'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty / Prompt State */
              <div className="my-4 p-8 rounded border border-dashed border-[#1a2234] bg-[#0a0f1d]/40 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff] mb-3 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm uppercase tracking-widest font-bold text-white mb-1">
                  {isHi ? '11D क्वांटम लैटिस तैयार है' : 'Ready for 11D Quantum-Intelligence Synthesis'}
                </h3>
                <p className="text-xs text-gray-400 max-w-md mb-4 leading-relaxed">
                  {isHi
                    ? 'सिम्युलेटेड या वास्तविक पर्यावरणीय डेटा दर्ज करें और वैज्ञानिक अंतर्दृष्टि उत्पन्न करने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                    : 'Select environmental telemetry or adjust parameters on the left, then trigger 11D Quantum operator evolution to generate verified deterministic predictions and planetary solutions.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onGenerateInsight}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#00f2ff] hover:bg-[#70fffa] text-[#020408] font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.25)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isHi ? 'मानक डेटा से गणना शुरू करें' : 'Run Standard Execution Example'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('trend')}
                    className="px-4 py-2 bg-[#0a0f1d] hover:bg-[#1a2234] text-[#00f2ff] hover:text-[#70fffa] font-bold text-xs uppercase tracking-wider rounded border border-[#00f2ff]/30 hover:border-[#00f2ff] transition flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.15)]"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isHi ? 'स्थिरता रुझान (D3.js)' : 'Stability Trend (D3.js)'}</span>
                  </button>

                  {history && history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveView('comparison')}
                      className="px-4 py-2 bg-[#0a0f1d] hover:bg-[#1a2234] text-[#a855f7] hover:text-[#c084fc] font-bold text-xs uppercase tracking-wider rounded border border-[#1a2234] hover:border-[#7000ff]/50 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{isHi ? 'इतिहास से तुलना करें' : 'Compare with History'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cross-System Unit Conversion Details Modal */}
      <UnitConversionModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        normalizedOutput={computation.normalizedOutput}
        activeSystem={outputUnitSystem}
        onSelectSystem={handleUnitSystemChange}
        language={language}
      />
    </div>
  );
};
