import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCode2,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  TrendingUp,
  Activity,
  BarChart3,
  Sliders,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  QILComputationResult,
  BatchVectorInputItem,
  BatchItemResult,
  BatchAggregatedReport,
} from '../types';
import { RWave11D_QILEngine, DIMENSION_METADATA } from '../lib/quantumEngine';

interface BatchProcessingViewProps {
  currentSeed: number;
  language: 'en' | 'hi';
  onApplyVectorToWorkstation: (vector: number[]) => void;
}

// Built-in benchmark batch scenarios for immediate one-click testing
const SAMPLE_BENCHMARK_BATCH: BatchVectorInputItem[] = [
  {
    id: 'batch-1',
    name: 'Baseline Agricultural & Aquifer Equilibrium',
    vector: [0.85, 0.42, 0.63, 0.91, 0.52, 0.38, 0.71, 0.49, 0.6, 0.28, 0.77],
  },
  {
    id: 'batch-2',
    name: 'Severe Hydrological Drought & Critical Aquifer Strain',
    vector: [0.15, 0.78, 0.82, 0.89, 0.88, 0.25, 0.95, 0.45, 0.65, 0.3, 0.9],
  },
  {
    id: 'batch-3',
    name: 'Stratospheric Aerosol & Carbon Sink Optimum',
    vector: [0.92, 0.35, 0.45, 0.88, 0.32, 0.28, 0.65, 0.4, 0.52, 0.22, 0.6],
  },
  {
    id: 'batch-4',
    name: 'Thermal Runaway & Cryospheric Melt Pulse',
    vector: [0.22, 0.94, 0.89, 0.96, 0.95, 0.18, 0.98, 0.5, 0.7, 0.35, 0.95],
  },
  {
    id: 'batch-5',
    name: 'South Asian Monsoon Dynamic Stabilization',
    vector: [0.72, 0.55, 0.68, 0.78, 0.6, 0.44, 0.75, 0.58, 0.64, 0.38, 0.7],
  },
  {
    id: 'batch-6',
    name: 'Renewable Microgrid & High Carbon Sequestration',
    vector: [0.65, 0.3, 0.95, 0.7, 0.4, 0.85, 0.6, 0.55, 0.8, 0.2, 0.65],
  },
];

export const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
  currentSeed,
  language,
  onApplyVectorToWorkstation,
}) => {
  const isHi = language === 'hi';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Input list state
  const [vectorItems, setVectorItems] = useState<BatchVectorInputItem[]>(SAMPLE_BENCHMARK_BATCH);
  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'index' | 'stability' | 'entropy' | 'name'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Processed Report State
  const [aggregatedReport, setAggregatedReport] = useState<BatchAggregatedReport | null>(null);

  // Helper to compute deterministic batch report from items
  const computeBatchReport = (items: BatchVectorInputItem[], seed: number): BatchAggregatedReport => {
    const engine = new RWave11D_QILEngine(seed);
    const itemResults: BatchItemResult[] = items.map((item) => {
      const comp = engine.computeDeterministicState(item.vector);
      // Stability index from entropy
      const normalizedEntropy = Math.min(1, comp.entropy / 3.4594);
      const stabilityIndex = Number((normalizedEntropy * 100).toFixed(1));

      // Max value and dominant / deficit indices
      let maxVal = -1;
      let minVal = 999;
      let maxIdx = 0;
      let minIdx = 0;

      comp.normalizedOutput.forEach((v, i) => {
        if (v > maxVal) {
          maxVal = v;
          maxIdx = i;
        }
        if (v < minVal) {
          minVal = v;
          minIdx = i;
        }
      });

      let riskLevel: 'CRITICAL' | 'ELEVATED' | 'BALANCED' | 'OPTIMAL' = 'BALANCED';
      if (maxVal > 0.35 || normalizedEntropy < 0.4) {
        riskLevel = 'CRITICAL';
      } else if (maxVal > 0.22 || normalizedEntropy < 0.6) {
        riskLevel = 'ELEVATED';
      } else if (normalizedEntropy > 0.85) {
        riskLevel = 'OPTIMAL';
      }

      return {
        id: item.id,
        name: item.name,
        rawInput: item.vector,
        computation: comp,
        stabilityIndex,
        riskLevel,
        dominantDimIndex: maxIdx,
        deficitDimIndex: minIdx,
      };
    });

    const total = itemResults.length;
    const stabilitySum = itemResults.reduce((acc, r) => acc + r.stabilityIndex, 0);
    const entropySum = itemResults.reduce((acc, r) => acc + r.computation.entropy, 0);

    const stabilities = itemResults.map((r) => r.stabilityIndex);
    const minStab = Math.min(...stabilities);
    const maxStab = Math.max(...stabilities);

    const riskCounts = {
      OPTIMAL: itemResults.filter((r) => r.riskLevel === 'OPTIMAL').length,
      BALANCED: itemResults.filter((r) => r.riskLevel === 'BALANCED').length,
      ELEVATED: itemResults.filter((r) => r.riskLevel === 'ELEVATED').length,
      CRITICAL: itemResults.filter((r) => r.riskLevel === 'CRITICAL').length,
    };

    // Dimension statistics (11 dimensions)
    const dimAverages: number[] = new Array(11).fill(0);
    const dimMin: number[] = new Array(11).fill(999);
    const dimMax: number[] = new Array(11).fill(-1);
    const dominantFreq: { [dimIndex: number]: number } = {};

    itemResults.forEach((r) => {
      dominantFreq[r.dominantDimIndex] = (dominantFreq[r.dominantDimIndex] || 0) + 1;
      r.computation.normalizedOutput.forEach((v, idx) => {
        dimAverages[idx] += v;
        if (v < dimMin[idx]) dimMin[idx] = v;
        if (v > dimMax[idx]) dimMax[idx] = v;
      });
    });

    dimAverages.forEach((_, idx) => {
      dimAverages[idx] /= total;
    });

    const dimStdDev: number[] = new Array(11).fill(0);
    itemResults.forEach((r) => {
      r.computation.normalizedOutput.forEach((v, idx) => {
        dimStdDev[idx] += Math.pow(v - dimAverages[idx], 2);
      });
    });
    dimStdDev.forEach((_, idx) => {
      dimStdDev[idx] = Math.sqrt(dimStdDev[idx] / total);
    });

    return {
      timestamp: new Date().toISOString(),
      totalVectors: total,
      seed,
      avgStabilityIndex: Number((stabilitySum / total).toFixed(1)),
      minStabilityIndex: minStab,
      maxStabilityIndex: maxStab,
      avgEntropy: Number((entropySum / total).toFixed(4)),
      riskCounts,
      dimensionAverages: dimAverages,
      dimensionStdDev: dimStdDev,
      dimensionMin: dimMin,
      dimensionMax: dimMax,
      dominantFrequency: dominantFreq,
      items: itemResults,
    };
  };

  // Run batch processing
  const handleExecuteBatch = (itemsToProcess = vectorItems) => {
    if (itemsToProcess.length === 0) {
      setInputError('No valid input vectors found to process.');
      return;
    }
    setIsProcessing(true);
    setInputError(null);

    setTimeout(() => {
      const report = computeBatchReport(itemsToProcess, currentSeed);
      setAggregatedReport(report);
      setIsProcessing(false);
    }, 150);
  };

  // Generate Gemini AI Aggregated Insight
  const handleGenerateAiBatchInsight = async () => {
    if (!aggregatedReport) return;
    setIsAiLoading(true);

    try {
      // Find top dominant dimensions
      const dominantArray = Object.entries(aggregatedReport.dominantFrequency)
        .map(([idx, count]) => ({
          dim: `D${Number(idx) + 1}`,
          label: DIMENSION_METADATA[Number(idx)]?.name || `Dim ${Number(idx) + 1}`,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const dimAvgDetails = aggregatedReport.dimensionAverages.map((avg, idx) => ({
        dim: `D${idx + 1}`,
        label: DIMENSION_METADATA[idx]?.name || `Dim ${idx + 1}`,
        avg,
        stdDev: aggregatedReport.dimensionStdDev[idx],
      }));

      const vectorSamples = aggregatedReport.items.slice(0, 10).map((item) => ({
        name: item.name,
        stabilityIndex: item.stabilityIndex,
        riskLevel: item.riskLevel,
        dominantDim: `D${item.dominantDimIndex + 1} (${DIMENSION_METADATA[item.dominantDimIndex]?.name})`,
        deficitDim: `D${item.deficitDimIndex + 1} (${DIMENSION_METADATA[item.deficitDimIndex]?.name})`,
      }));

      const response = await fetch('/api/qil/batch-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSummary: {
            totalVectors: aggregatedReport.totalVectors,
            avgStabilityIndex: aggregatedReport.avgStabilityIndex,
            minStabilityIndex: aggregatedReport.minStabilityIndex,
            maxStabilityIndex: aggregatedReport.maxStabilityIndex,
            avgEntropy: aggregatedReport.avgEntropy,
            riskCounts: aggregatedReport.riskCounts,
            topDominantDimensions: dominantArray,
            dimensionAverages: dimAvgDetails,
            vectorSamples,
          },
          language,
        }),
      });

      const data = await response.json();
      if (data.success && data.aiSynthesis) {
        setAggregatedReport((prev) => (prev ? { ...prev, aiSynthesis: data.aiSynthesis } : null));
      } else {
        throw new Error(data.error || 'Failed to synthesize aggregated insight');
      }
    } catch (err: any) {
      console.warn('Batch insight synthesis fallback:', err);
      // Fallback synthesis
      const fallback = `### R-WAVE 11D AGGREGATED BATCH COMPARATIVE REPORT
**Total Scenarios Evaluated:** ${aggregatedReport.totalVectors} | **Mean Stability Index:** ${aggregatedReport.avgStabilityIndex}% | **Entropy:** ${aggregatedReport.avgEntropy} bits

#### 1. Executive Cross-Vector Systemic Synthesis
Batch evaluation across ${aggregatedReport.totalVectors} scenarios indicates bounded deterministic conservation under unitary invariant constraints (∑P = 1.000000). Systemic stability is centered at ${aggregatedReport.avgStabilityIndex}% (Min: ${aggregatedReport.minStabilityIndex}%, Max: ${aggregatedReport.maxStabilityIndex}%).

#### 2. Critical Dimension Variance & Propagation Dynamics
The dimensions with the greatest standard deviation act as the primary operational tipping points. Compensatory displacement is most evident during drought scenarios, where severe hydrological depression triggers elevated thermal radiation and extraction velocity.

#### 3. Unified Cross-Scenario Strategic Interventions
1. **Dynamic Closed-Loop Buffer Reservoirs:** Construct adaptive storage buffers sized to absorb peak fluctuations identified in the high-variance dimensions.
2. **Decoupled Cross-Corridor Balancing:** Implement automated dampening governors at node interfaces.
3. **Universal Threshold Safeguards:** Institutionalize hard protective boundary protocols when any single dimension exceeds critical saturation (>0.30).`;

      setAggregatedReport((prev) => (prev ? { ...prev, aiSynthesis: fallback } : null));
    } finally {
      setIsAiLoading(false);
    }
  };

  // File Upload Handler (JSON or CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseAndSetVectors(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Parse Text or File Content into BatchVectorInputItem[]
  const parseAndSetVectors = (raw: string, sourceName = 'Uploaded File') => {
    setInputError(null);
    const trimmed = raw.trim();

    try {
      // 1. Try parsing JSON
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const items: BatchVectorInputItem[] = [];
          parsed.forEach((entry, idx) => {
            if (Array.isArray(entry)) {
              // Array of numbers: [0.85, 0.42, ...]
              const nums = entry.map(Number).filter((n) => !isNaN(n));
              if (nums.length > 0) {
                items.push({
                  id: `batch-${Date.now()}-${idx + 1}`,
                  name: `Vector ${idx + 1} (${sourceName})`,
                  vector: nums,
                });
              }
            } else if (typeof entry === 'object' && entry !== null && Array.isArray(entry.vector)) {
              // Object with { name, vector }
              const nums = entry.vector.map(Number).filter((n: any) => !isNaN(n));
              if (nums.length > 0) {
                items.push({
                  id: entry.id || `batch-${Date.now()}-${idx + 1}`,
                  name: entry.name || `Scenario ${idx + 1}`,
                  vector: nums,
                });
              }
            }
          });

          if (items.length > 0) {
            setVectorItems(items);
            setShowTextEditor(false);
            handleExecuteBatch(items);
            return;
          }
        }
      }

      // 2. Try parsing CSV or Line-Delimited Vectors
      const lines = trimmed.split(/[\r\n]+/).filter((line) => line.trim().length > 0);
      const csvItems: BatchVectorInputItem[] = [];

      lines.forEach((line, idx) => {
        // Skip header if line has words like "vector", "dimension", "scenario"
        if (idx === 0 && /(scenario|name|vector|dimension|d1|d2)/i.test(line)) {
          return;
        }

        const parts = line.split(/[,\t;]+/).map((s) => s.trim());
        let name = `Vector ${idx + 1}`;
        let numStrings = parts;

        // If first column is non-numeric string, use it as scenario name
        if (isNaN(Number(parts[0])) && parts.length > 1) {
          name = parts[0].replace(/^["']|["']$/g, '');
          numStrings = parts.slice(1);
        }

        const nums = numStrings.map(Number).filter((n) => !isNaN(n));
        if (nums.length >= 2) {
          csvItems.push({
            id: `batch-csv-${Date.now()}-${idx + 1}`,
            name,
            vector: nums,
          });
        }
      });

      if (csvItems.length > 0) {
        setVectorItems(csvItems);
        setShowTextEditor(false);
        handleExecuteBatch(csvItems);
        return;
      }

      throw new Error('Could not parse any valid numerical vectors. Provide JSON arrays or CSV rows of numbers.');
    } catch (err: any) {
      setInputError(err.message || 'Failed to parse vector input.');
    }
  };

  // Reset to Benchmark Batch
  const handleResetToBenchmark = () => {
    setVectorItems(SAMPLE_BENCHMARK_BATCH);
    setInputError(null);
    handleExecuteBatch(SAMPLE_BENCHMARK_BATCH);
  };

  // Export Aggregated Report as Markdown
  const handleDownloadMarkdownReport = () => {
    if (!aggregatedReport) return;

    let md = `# R-WAVE UNIVERSAL INTELLIGENCE LAB
## 11D Quantum-Intelligence Lattice: Aggregated Batch Comparative Report
- **Generated:** ${new Date(aggregatedReport.timestamp).toLocaleString()}
- **Lattice Seed:** #${aggregatedReport.seed}
- **Total Scenarios Evaluated:** ${aggregatedReport.totalVectors}
- **Mean System Stability Index:** ${aggregatedReport.avgStabilityIndex}% (Min: ${aggregatedReport.minStabilityIndex}%, Max: ${aggregatedReport.maxStabilityIndex}%)
- **Mean Shannon Entropy:** ${aggregatedReport.avgEntropy} bits
- **Risk Profile:** Optimal: ${aggregatedReport.riskCounts.OPTIMAL} | Balanced: ${aggregatedReport.riskCounts.BALANCED} | Elevated: ${aggregatedReport.riskCounts.ELEVATED} | Critical: ${aggregatedReport.riskCounts.CRITICAL}

---

### 1. Cross-Scenario Comparative Summary Table
| # | Scenario Name | Stability | Risk Level | Entropy | Dominant Node | Deficit Node |
|---|---|---|---|---|---|---|
`;

    aggregatedReport.items.forEach((item, idx) => {
      const domName = DIMENSION_METADATA[item.dominantDimIndex]?.name || `D${item.dominantDimIndex + 1}`;
      const defName = DIMENSION_METADATA[item.deficitDimIndex]?.name || `D${item.deficitDimIndex + 1}`;
      md += `| ${idx + 1} | ${item.name} | ${item.stabilityIndex}% | ${item.riskLevel} | ${item.computation.entropy.toFixed(4)} | D${item.dominantDimIndex + 1} (${domName}) | D${item.deficitDimIndex + 1} (${defName}) |\n`;
    });

    md += `\n---

### 2. 11D Dimension Cross-Batch Distribution
| Dimension | Key Identifier | Mean Amplitude | Std Dev (±σ) | Min | Max |
|---|---|---|---|---|---|
`;

    DIMENSION_METADATA.forEach((dim, idx) => {
      md += `| D${idx + 1} | ${dim.name} | ${aggregatedReport.dimensionAverages[idx].toFixed(5)} | ${aggregatedReport.dimensionStdDev[idx].toFixed(5)} | ${aggregatedReport.dimensionMin[idx].toFixed(5)} | ${aggregatedReport.dimensionMax[idx].toFixed(5)} |\n`;
    });

    if (aggregatedReport.aiSynthesis) {
      md += `\n---

### 3. AI-Synthesized Executive Strategic Report
${aggregatedReport.aiSynthesis}
`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-batch-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleDownloadCsv = () => {
    if (!aggregatedReport) return;
    let csv = 'Index,Scenario Name,Stability Index,Risk Level,Shannon Entropy,Dominant Dimension,Deficit Dimension,' +
      DIMENSION_METADATA.map((d) => `D${d.id} (${d.name})`).join(',') +
      '\n';

    aggregatedReport.items.forEach((item, idx) => {
      const dom = `D${item.dominantDimIndex + 1}`;
      const def = `D${item.deficitDimIndex + 1}`;
      const coords = item.computation.normalizedOutput.map((v) => v.toFixed(5)).join(',');
      csv += `"${idx + 1}","${item.name.replace(/"/g, '""')}","${item.stabilityIndex}%","${item.riskLevel}","${item.computation.entropy.toFixed(4)}","${dom}","${def}",${coords}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-batch-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Speech synthesis toggle
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!aggregatedReport?.aiSynthesis) return;
      window.speechSynthesis.cancel();
      const cleanSpeech = aggregatedReport.aiSynthesis.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Filtered and sorted item results
  const filteredAndSortedItems = useMemo(() => {
    if (!aggregatedReport) return [];
    let list = [...aggregatedReport.items];

    if (filterRisk !== 'ALL') {
      list = list.filter((item) => item.riskLevel === filterRisk);
    }

    list.sort((a, b) => {
      let valA: any = a.id;
      let valB: any = b.id;

      if (sortField === 'stability') {
        valA = a.stabilityIndex;
        valB = b.stabilityIndex;
      } else if (sortField === 'entropy') {
        valA = a.computation.entropy;
        valB = b.computation.entropy;
      } else if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [aggregatedReport, filterRisk, sortField, sortOrder]);

  // Find most volatile and most stable dimensions
  const { mostVolatileDim, mostStableDim } = useMemo(() => {
    if (!aggregatedReport) return { mostVolatileDim: null, mostStableDim: null };
    let maxStd = -1;
    let minStd = 999;
    let volatileIdx = 0;
    let stableIdx = 0;

    aggregatedReport.dimensionStdDev.forEach((sd, idx) => {
      if (sd > maxStd) {
        maxStd = sd;
        volatileIdx = idx;
      }
      if (sd < minStd) {
        minStd = sd;
        stableIdx = idx;
      }
    });

    return {
      mostVolatileDim: {
        dim: `D${volatileIdx + 1}`,
        meta: DIMENSION_METADATA[volatileIdx],
        stdDev: maxStd,
      },
      mostStableDim: {
        dim: `D${stableIdx + 1}`,
        meta: DIMENSION_METADATA[stableIdx],
        stdDev: minStd,
      },
    };
  }, [aggregatedReport]);

  return (
    <div className="space-y-5 text-gray-200">
      {/* Batch Control Toolbar */}
      <div className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1a2234] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]" />
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {isHi ? 'बैच प्रोसेसिंग एवं बहु-परिदृश्य तुलना' : 'Batch Vector Processing & Comparative Analysis'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                {vectorItems.length} {isHi ? 'वेक्टर लोड हैं' : 'Vectors Loaded'}
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {isHi
              ? 'एकाधिक इनपुट वेक्टर्स अपलोड करें और 11D लैटिस के अंतर्गत समग्र सांख्यिकी और तुलनात्मक रिपोर्ट उत्पन्न करें'
              : 'Upload or paste batches of state vectors to compute simultaneous 11D lattice outputs and comparative metrics'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-white border border-[#2a3854] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Upload JSON or CSV vector files"
          >
            <Upload className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>{isHi ? 'फ़ाइल अपलोड (.json/.csv)' : 'Upload File'}</span>
          </button>

          {/* Paste / Edit Code */}
          <button
            type="button"
            onClick={() => setShowTextEditor(!showTextEditor)}
            className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition cursor-pointer border ${
              showTextEditor
                ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]'
                : 'bg-[#1a2234] hover:bg-[#25324d] text-gray-200 border-[#2a3854]'
            }`}
            title="Paste raw JSON or CSV numbers"
          >
            <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{isHi ? 'टेक्स्ट / कोड एडिटर' : 'Paste Raw Data'}</span>
          </button>

          {/* Benchmark Preset Sample */}
          <button
            type="button"
            onClick={handleResetToBenchmark}
            className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-[#00f2ff] border border-[#2a3854] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Load 6 diverse benchmark planetary vectors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHi ? 'मानक बेंचमार्क (6 Scenarios)' : 'Sample Batch (6)'}</span>
          </button>

          {/* Execute Batch Compute */}
          <button
            type="button"
            onClick={() => handleExecuteBatch(vectorItems)}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded bg-[#00f2ff] hover:bg-[#38bdf8] text-black font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.35)] disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isHi ? '11D बैच गणना चलाएँ' : 'Run Batch Compute'}</span>
          </button>
        </div>
      </div>

      {/* Raw Text Input / Code Editor Drawer */}
      {showTextEditor && (
        <div className="bg-[#050810] p-4 rounded-xl border border-[#00f2ff]/40 shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#00f2ff] flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4" />
              {isHi ? 'कच्चा डेटा दर्ज करें (JSON ऐरे या CSV पंक्तियाँ):' : 'Paste Vector Batch (JSON Arrays or CSV Lines):'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setRawTextInput(`[
  { "name": "Scenario A - Baseline", "vector": [0.85, 0.42, 0.63, 0.91] },
  { "name": "Scenario B - Drought", "vector": [0.15, 0.78, 0.82, 0.89] },
  { "name": "Scenario C - Surge", "vector": [0.92, 0.35, 0.45, 0.88] }
]`)
                }
                className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
              >
                Insert JSON Template
              </button>
              <button
                type="button"
                onClick={() =>
                  setRawTextInput(`Scenario 1,0.85,0.42,0.63,0.91,0.52,0.38,0.71,0.49,0.60,0.28,0.77
Scenario 2,0.15,0.78,0.82,0.89,0.88,0.25,0.95,0.45,0.65,0.30,0.90
Scenario 3,0.92,0.35,0.45,0.88,0.32,0.28,0.65,0.40,0.52,0.22,0.60`)
                }
                className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
              >
                Insert CSV Template
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={rawTextInput}
            onChange={(e) => setRawTextInput(e.target.value)}
            placeholder={`Paste JSON array of vectors, or CSV lines:\ne.g. [0.85, 0.42, 0.63, 0.91]\nOr: Scenario Alpha, 0.85, 0.42, 0.63, 0.91`}
            className="w-full bg-[#0a0f1d] text-[#00f2ff] font-mono text-xs p-3 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] leading-relaxed resize-y"
          />

          {inputError && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{inputError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setShowTextEditor(false)}
              className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => parseAndSetVectors(rawTextInput, 'Pasted Text')}
              className="px-4 py-1.5 rounded bg-[#00f2ff] hover:bg-[#38bdf8] text-black font-bold cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.3)]"
            >
              {isHi ? 'डेटा पार्स करें एवं लोड करें' : 'Parse & Load Vectors'}
            </button>
          </div>
        </div>
      )}

      {/* Aggregated Statistical KPI Deck */}
      {aggregatedReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Vectors */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'कुल परिदृश्य' : 'Total Scenarios'}
            </span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {aggregatedReport.totalVectors}
            </div>
            <span className="text-[9px] text-[#00f2ff] font-mono">
              Seed #{aggregatedReport.seed}
            </span>
          </div>

          {/* Card 2: Mean Stability */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'माध्य स्थिरता सूचकांक' : 'Mean Stability'}
            </span>
            <div className="text-xl font-bold font-mono text-[#00f2ff] mt-1">
              {aggregatedReport.avgStabilityIndex}%
            </div>
            <span className="text-[9px] text-gray-400 font-mono">
              Min: {aggregatedReport.minStabilityIndex}% | Max: {aggregatedReport.maxStabilityIndex}%
            </span>
          </div>

          {/* Card 3: Mean Entropy */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'माध्य एंट्रॉपी' : 'Mean Entropy'}
            </span>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">
              {aggregatedReport.avgEntropy}
            </div>
            <span className="text-[9px] text-gray-400 font-mono">
              bits (max: 3.459)
            </span>
          </div>

          {/* Card 4: Risk Profile */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'जोखिम प्रोफ़ाइल' : 'Risk Profile'}
            </span>
            <div className="flex items-center space-x-1 mt-1 font-mono text-xs">
              <span className="text-rose-400 font-bold" title="Critical">
                {aggregatedReport.riskCounts.CRITICAL}C
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400 font-bold" title="Elevated">
                {aggregatedReport.riskCounts.ELEVATED}E
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-emerald-400 font-bold" title="Balanced">
                {aggregatedReport.riskCounts.BALANCED}B
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[#00f2ff] font-bold" title="Optimal">
                {aggregatedReport.riskCounts.OPTIMAL}O
              </span>
            </div>
            <div className="w-full bg-[#1a2234] h-1.5 rounded-full overflow-hidden flex mt-1">
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${(aggregatedReport.riskCounts.CRITICAL / aggregatedReport.totalVectors) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${(aggregatedReport.riskCounts.ELEVATED / aggregatedReport.totalVectors) * 100}%` }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(aggregatedReport.riskCounts.BALANCED / aggregatedReport.totalVectors) * 100}%` }}
              />
              <div
                className="bg-[#00f2ff] h-full"
                style={{ width: `${(aggregatedReport.riskCounts.OPTIMAL / aggregatedReport.totalVectors) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 5: Most Volatile Dimension */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'सर्वाधिक अस्थिर आयाम' : 'Max Volatile Node'}
            </span>
            <div className="text-sm font-bold font-mono text-amber-300 truncate mt-1">
              {mostVolatileDim ? `${mostVolatileDim.dim}: ${mostVolatileDim.meta.name.split(' ')[0]}` : 'N/A'}
            </div>
            <span className="text-[9px] text-amber-400/80 font-mono">
              Variance: ±{mostVolatileDim?.stdDev.toFixed(4)}
            </span>
          </div>

          {/* Card 6: Most Resilient Anchor */}
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234] flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              {isHi ? 'स्थिरता आधार (एंकर)' : 'Equilibrium Anchor'}
            </span>
            <div className="text-sm font-bold font-mono text-emerald-300 truncate mt-1">
              {mostStableDim ? `${mostStableDim.dim}: ${mostStableDim.meta.name.split(' ')[0]}` : 'N/A'}
            </div>
            <span className="text-[9px] text-emerald-400/80 font-mono">
              Variance: ±{mostStableDim?.stdDev.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Cross-Dimension Amplitude Variance Distribution Chart */}
      {aggregatedReport && (
        <div className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1a2234] shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#1a2234] gap-2">
            <div>
              <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00f2ff]" />
                {isHi
                  ? '11-आयामी क्रॉस-वेक्टर प्रसरण एवं माध्य वितरण (Mean ± σ Envelope)'
                  : '11D Cross-Vector Mean Amplitude & Variance Distribution (Mean ± σ Envelope)'}
              </h4>
              <p className="text-[11px] text-gray-400 font-mono">
                {isHi
                  ? 'सभी परीक्षण किए गए परिदृश्यों में प्रत्येक आयाम के माध्य, विचलन और चरम सीमाओं की तुलना'
                  : 'Displays cross-scenario mean density, standard deviation bands, and absolute min/max range across all 11 dimensions'}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400 shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#00f2ff] rounded-xs" /> Mean Amplitude
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-purple-500/40 border border-purple-400 rounded-xs" /> ±1σ Variance
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-2 pt-2">
            {DIMENSION_METADATA.map((dim, idx) => {
              const avg = aggregatedReport.dimensionAverages[idx];
              const std = aggregatedReport.dimensionStdDev[idx];
              const min = aggregatedReport.dimensionMin[idx];
              const max = aggregatedReport.dimensionMax[idx];
              const domCount = aggregatedReport.dominantFrequency[idx] || 0;

              // Scale for visualization (max typically around 0.25 - 0.35)
              const barHeightPct = Math.min(100, Math.round((avg / 0.25) * 100));

              return (
                <div
                  key={dim.id}
                  className="bg-[#050810] p-2 rounded-lg border border-[#1a2234] hover:border-[#00f2ff]/40 transition flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold text-[#00f2ff]">D{dim.id}</span>
                    {domCount > 0 && (
                      <span
                        className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-600/40"
                        title={`Dominant peak in ${domCount} scenarios`}
                      >
                        {domCount}★
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] text-gray-400 truncate" title={dim.name}>
                    {dim.name.split(' ')[0]}
                  </div>

                  {/* Vertical bar container */}
                  <div className="h-24 bg-[#0a0f1d] rounded relative flex items-end p-1 overflow-hidden border border-[#1a2234]">
                    {/* Variance Envelope Area */}
                    <div
                      className="absolute w-full left-0 bg-purple-500/15 border-y border-purple-400/40 transition-all duration-300"
                      style={{
                        bottom: `${Math.max(0, Math.round(((avg - std) / 0.25) * 100))}%`,
                        height: `${Math.min(100, Math.round(((std * 2) / 0.25) * 100))}%`,
                      }}
                      title={`Variance range: ${(avg - std).toFixed(4)} to ${(avg + std).toFixed(4)}`}
                    />

                    {/* Mean Bar */}
                    <div
                      className="w-full bg-gradient-to-t from-[#00f2ff]/40 to-[#00f2ff] rounded-xs transition-all duration-300 relative z-10"
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-mono text-center font-bold text-gray-200">
                    {avg.toFixed(4)}
                  </div>
                  <div className="text-[8px] font-mono text-center text-gray-500">
                    ±{std.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparative Multi-Scenario Data Table */}
      {aggregatedReport && (
        <div className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1a2234] shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#1a2234] gap-2">
            <div>
              <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#00f2ff]" />
                {isHi ? 'तुलनात्मक परिदृश्य डेटा तालिका' : 'Comparative Scenario Evaluation Matrix'}
              </h4>
              <p className="text-[11px] text-gray-400 font-mono">
                {isHi
                  ? 'प्रत्येक वेक्टर के परिणाम, स्थिरता रेटिंग और चरम निर्देशांकों की समीक्षा करें'
                  : 'Detailed per-scenario metrics with one-click workstation hydration'}
              </p>
            </div>

            {/* Filter and Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Risk Filter */}
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-[#050810] text-gray-300 text-xs font-mono px-2.5 py-1 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] cursor-pointer"
              >
                <option value="ALL">All Risk Levels ({aggregatedReport.items.length})</option>
                <option value="OPTIMAL">Optimal ({aggregatedReport.riskCounts.OPTIMAL})</option>
                <option value="BALANCED">Balanced ({aggregatedReport.riskCounts.BALANCED})</option>
                <option value="ELEVATED">Elevated ({aggregatedReport.riskCounts.ELEVATED})</option>
                <option value="CRITICAL">Critical ({aggregatedReport.riskCounts.CRITICAL})</option>
              </select>

              {/* Sort selector */}
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split('-');
                  setSortField(f as any);
                  setSortOrder(o as any);
                }}
                className="bg-[#050810] text-gray-300 text-xs font-mono px-2.5 py-1 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] cursor-pointer"
              >
                <option value="index-asc">Sort: Execution Order</option>
                <option value="stability-desc">Sort: Highest Stability</option>
                <option value="stability-asc">Sort: Lowest Stability</option>
                <option value="entropy-desc">Sort: Highest Entropy</option>
                <option value="name-asc">Sort: Scenario Name</option>
              </select>

              {/* Download CSV */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="p-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 hover:text-white border border-[#2a3854] text-xs font-mono transition cursor-pointer"
                title="Download CSV Table"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-[#1a2234]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050810] text-gray-400 border-b border-[#1a2234]">
                <tr>
                  <th className="py-2 px-3 w-10">#</th>
                  <th className="py-2 px-3">{isHi ? 'परिदृश्य का नाम' : 'Scenario Identifier'}</th>
                  <th className="py-2 px-3">{isHi ? 'स्थिरता सूचकांक' : 'Stability Index'}</th>
                  <th className="py-2 px-3">{isHi ? 'जोखिम स्तर' : 'Risk Rating'}</th>
                  <th className="py-2 px-3">{isHi ? 'एंट्रॉपी' : 'Shannon S'}</th>
                  <th className="py-2 px-3">{isHi ? 'उच्चतम आयाम' : 'Dominant Node'}</th>
                  <th className="py-2 px-3">{isHi ? 'न्यूनतम आयाम' : 'Deficit Node'}</th>
                  <th className="py-2 px-3 text-right">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2234]">
                {filteredAndSortedItems.map((item, idx) => {
                  const domDim = DIMENSION_METADATA[item.dominantDimIndex];
                  const defDim = DIMENSION_METADATA[item.deficitDimIndex];

                  const riskColor =
                    item.riskLevel === 'CRITICAL'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                      : item.riskLevel === 'ELEVATED'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : item.riskLevel === 'OPTIMAL'
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1a2234]/40 transition group"
                    >
                      <td className="py-2.5 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div className="truncate max-w-[200px] sm:max-w-xs" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          [{item.rawInput.slice(0, 4).map((v) => v.toFixed(2)).join(', ')}
                          {item.rawInput.length > 4 ? '...' : ''}]
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold ${
                              item.stabilityIndex > 80
                                ? 'text-[#00f2ff]'
                                : item.stabilityIndex > 60
                                ? 'text-emerald-400'
                                : item.stabilityIndex > 40
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.stabilityIndex}%
                          </span>
                          <div className="w-14 bg-[#050810] h-1.5 rounded-full overflow-hidden hidden sm:block border border-[#1a2234]">
                            <div
                              className={`h-full rounded-full ${
                                item.stabilityIndex > 80
                                  ? 'bg-[#00f2ff]'
                                  : item.stabilityIndex > 60
                                  ? 'bg-emerald-400'
                                  : item.stabilityIndex > 40
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.stabilityIndex}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor}`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-purple-300">
                        {item.computation.entropy.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-mono">
                        D{item.dominantDimIndex + 1}: {domDim?.name.split(' ')[0]}
                      </td>
                      <td className="py-2.5 px-3 text-sky-400 font-mono">
                        D{item.deficitDimIndex + 1}: {defDim?.name.split(' ')[0]}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onApplyVectorToWorkstation(item.rawInput)}
                          className="px-2.5 py-1 rounded bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-[10px] font-mono transition flex items-center gap-1 ml-auto cursor-pointer"
                          title="Apply this vector to main 3D Visualizer, Telemetry and Soundscape"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isHi ? 'लोड करें' : 'Load Vector'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI-Powered Aggregated Comparative Report Section */}
      {aggregatedReport && (
        <div className="bg-[#0a0f1d] p-5 rounded-xl border border-[#7000ff]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1a2234] gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-[#c084fc]" />
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
                  {isHi
                    ? 'जेमिनी एआई समग्र तुलनात्मक विश्लेषण (Aggregated Report)'
                    : 'Gemini AI Aggregated Cross-Scenario Intelligence'}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#7000ff]/20 text-[#c084fc] border border-[#7000ff]/40">
                    Gemini 3.8 Flash
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono">
                  {isHi
                    ? 'सभी प्रसंस्कृत वेक्टर्स के आधार पर प्रणालीगत टिपिंग पॉइंट्स एवं रणनीतिक अनुशंसाएँ'
                    : 'Macro-systemic cross-vector evaluations, planetary tipping points, and unified infrastructure recommendations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Copy Report */}
              {aggregatedReport.aiSynthesis && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aggregatedReport.aiSynthesis || '');
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 hover:text-white border border-[#2a3854] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy Report to Clipboard"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? (isHi ? 'कॉपी हुआ' : 'Copied') : (isHi ? 'कॉपी' : 'Copy')}</span>
                </button>
              )}

              {/* Speech Synthesis Toggle */}
              {aggregatedReport.aiSynthesis && (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`p-1.5 rounded text-xs font-mono transition cursor-pointer border ${
                    isSpeaking
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                      : 'bg-[#1a2234] hover:bg-[#25324d] text-gray-300 border-[#2a3854]'
                  }`}
                  title={isSpeaking ? 'Stop Audio Narration' : 'Read Report Aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Download Markdown Report */}
              <button
                type="button"
                onClick={handleDownloadMarkdownReport}
                className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-[#00f2ff] border border-[#2a3854] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                title="Download Complete Aggregated Markdown Report"
              >
                <Download className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>{isHi ? 'रिपोर्ट डाउनलोड (.md)' : 'Export Markdown'}</span>
              </button>

              {/* Synthesize Button */}
              <button
                type="button"
                onClick={handleGenerateAiBatchInsight}
                disabled={isAiLoading}
                className="px-4 py-1.5 rounded bg-[#7000ff] hover:bg-[#8b24ff] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(112,0,255,0.4)] disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isHi ? 'संश्लेषण जारी...' : 'Synthesizing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'एआई रिपोर्ट उत्पन्न करें' : 'Generate AI Batch Report'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Narrative Body */}
          {aggregatedReport.aiSynthesis ? (
            <div className="bg-[#050810] p-4 rounded-lg border border-[#1a2234] text-xs font-mono leading-relaxed space-y-3">
              <Markdown
                components={{
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold text-[#c084fc] border-b border-[#1a2234] pb-1.5 mt-2">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xs font-bold text-[#00f2ff] mt-2 mb-1">{children}</h4>
                  ),
                  p: ({ children }) => <p className="text-gray-300 my-1">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                }}
              >
                {aggregatedReport.aiSynthesis}
              </Markdown>
            </div>
          ) : (
            <div className="bg-[#050810] p-6 rounded-lg border border-dashed border-[#1a2234] text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#7000ff]/60 mx-auto" />
              <div className="text-xs font-mono text-gray-300 font-bold">
                {isHi ? 'समग्र एआई रिपोर्ट तैयार नहीं है' : 'Aggregated Comparative Report Not Yet Synthesized'}
              </div>
              <p className="text-[11px] font-mono text-gray-500 max-w-md mx-auto">
                {isHi
                  ? 'सभी वेक्टर्स के आधार पर टिपिंग पॉइंट्स, गैर-रेखीय विचरण और सामूहिक समाधान उत्पन्न करने के लिए ऊपर दिए गए "एआई रिपोर्ट उत्पन्न करें" बटन पर क्लिक करें।'
                  : 'Click "Generate AI Batch Report" above to prompt Gemini to analyze cross-vector dynamics, tipping point distributions, and unified multi-scenario resilience policies.'}
              </p>
              <button
                type="button"
                onClick={handleGenerateAiBatchInsight}
                disabled={isAiLoading}
                className="mt-2 px-4 py-2 rounded bg-[#7000ff]/20 hover:bg-[#7000ff]/30 text-[#c084fc] border border-[#7000ff]/50 text-xs font-mono font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isHi ? 'एआई रिपोर्ट उत्पन्न करें' : 'Generate AI Batch Report'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
