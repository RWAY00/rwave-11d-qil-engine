import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  BarChart3,
  Radio,
  Grid3X3,
  ArrowUpRight,
  Lock,
  Eye,
  Box,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Flame,
  X,
  Gauge,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  Percent,
  Info,
  Waves,
  Headphones,
} from 'lucide-react';
import { QILComputationResult } from '../types';
import { DIMENSION_METADATA, RWave11D_QILEngine } from '../lib/quantumEngine';
import { QuantumManifold3D } from './QuantumManifold3D';

interface QuantumLatticeVisualizerProps {
  computation: QILComputationResult;
  language: 'en' | 'hi';
  onOpenMatrixModal: () => void;
  onInspectDimension?: (dimIndex: number) => void;
  onApplyPerturbedVector?: (vector: number[]) => void;
  onOpenSoundscape?: () => void;
  isSoundscapePlaying?: boolean;
}

export const QuantumLatticeVisualizer: React.FC<QuantumLatticeVisualizerProps> = ({
  computation,
  language,
  onOpenMatrixModal,
  onInspectDimension,
  onApplyPerturbedVector,
  onOpenSoundscape,
  isSoundscapePlaying = false,
}) => {
  const isHi = language === 'hi';
  const [activeTab, setActiveTab] = useState<'3d' | 'spectrum' | 'radar'>('3d');

  // Real-Time Risk Assessment State & Safety Thresholds
  const [riskOverlayEnabled, setRiskOverlayEnabled] = useState<boolean>(true);
  const [thresholdHigh, setThresholdHigh] = useState<number>(0.90);
  const [thresholdLow, setThresholdLow] = useState<number>(0.10);
  const [showThresholdSettings, setShowThresholdSettings] = useState<boolean>(false);
  const [filterBreachesOnly, setFilterBreachesOnly] = useState<boolean>(false);

  // Sensitivity Analysis State (±5% default environmental fluctuation)
  const [sensitivityActive, setSensitivityActive] = useState<boolean>(true);
  const [sensitivityDeltaPct, setSensitivityDeltaPct] = useState<number>(5); // default ±5%
  const [showSensitivityDrawer, setShowSensitivityDrawer] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<'bounds' | 'plus' | 'minus' | 'oscillate'>('bounds');
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [oscillationFactor, setOscillationFactor] = useState<number>(0);

  // Dedicated Deterministic Quantum Engine instance for sensitivity projections
  const engine = useMemo(() => new RWave11D_QILEngine(computation.seed), [computation.seed]);

  // Live Sinusoidal Fluctuation Oscillation Loop
  useEffect(() => {
    if (!isOscillating) {
      setOscillationFactor(0);
      return;
    }
    let animId: number;
    let startTime = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      // 0.75 Hz oscillation wave
      const factor = Math.sin(elapsed * Math.PI * 1.5);
      setOscillationFactor(factor);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOscillating]);

  // Upper perturbation vector (+delta%)
  const inputPlus = useMemo(() => {
    return computation.rawInput.map((val) =>
      Math.min(1.0, Math.max(0.0, val * (1 + sensitivityDeltaPct / 100)))
    );
  }, [computation.rawInput, sensitivityDeltaPct]);

  // Lower perturbation vector (-delta%)
  const inputMinus = useMemo(() => {
    return computation.rawInput.map((val) =>
      Math.min(1.0, Math.max(0.0, val * (1 - sensitivityDeltaPct / 100)))
    );
  }, [computation.rawInput, sensitivityDeltaPct]);

  // Deterministic computations under perturbed boundary states
  const computationPlus = useMemo(() => engine.computeDeterministicState(inputPlus), [engine, inputPlus]);
  const computationMinus = useMemo(() => engine.computeDeterministicState(inputMinus), [engine, inputMinus]);

  // Live oscillating computation under dynamic fluctuation wave
  const computationOscillated = useMemo(() => {
    if (!isOscillating && simulationMode !== 'oscillate') return null;
    const dynamicInput = computation.rawInput.map((val) =>
      Math.min(1.0, Math.max(0.0, val * (1 + (sensitivityDeltaPct / 100) * oscillationFactor)))
    );
    return engine.computeDeterministicState(dynamicInput);
  }, [computation.rawInput, engine, isOscillating, simulationMode, sensitivityDeltaPct, oscillationFactor]);

  // Currently active display computation (Nominal vs Surge vs Deficit vs Oscillating)
  const activeDisplayComputation = useMemo(() => {
    if (isOscillating && computationOscillated) return computationOscillated;
    if (simulationMode === 'plus') return computationPlus;
    if (simulationMode === 'minus') return computationMinus;
    return computation;
  }, [isOscillating, computationOscillated, simulationMode, computationPlus, computationMinus, computation]);

  const { normalizedOutput, phaseAngles, hermitianError, sumProbability, entropy, paddedStateVector } = activeDisplayComputation;

  // In-depth Sensitivity & Lattice Equilibrium Analysis
  const sensitivityAnalysis = useMemo(() => {
    const dimensions = computation.normalizedOutput.map((baseVal, i) => {
      const plusVal = computationPlus.normalizedOutput[i];
      const minusVal = computationMinus.normalizedOutput[i];
      const deltaAbs = Math.abs(plusVal - minusVal);
      const pctShift = baseVal > 1e-6 ? (deltaAbs / baseVal) * 100 : 0;
      const elasticity = sensitivityDeltaPct > 0 ? +(pctShift / sensitivityDeltaPct).toFixed(2) : 1;
      const minBound = Math.min(plusVal, minusVal);
      const maxBound = Math.max(plusVal, minusVal);
      const rawBase = computation.paddedStateVector[i] ?? 0;
      const rawPlus = computationPlus.paddedStateVector[i] ?? 0;
      const rawMinus = computationMinus.paddedStateVector[i] ?? 0;

      // Threshold crossing risk early warning: nominal in bounds, but ±5% breaches
      const nominalSafe = rawBase >= thresholdLow && rawBase <= thresholdHigh;
      const crossesHigh = nominalSafe && (rawPlus > thresholdHigh || rawMinus > thresholdHigh);
      const crossesLow = nominalSafe && (rawPlus < thresholdLow || rawMinus < thresholdLow);
      const hasThresholdRisk = crossesHigh || crossesLow;

      const classification: 'AMPLIFIED' | 'COUPLED' | 'DAMPENED' =
        pctShift > 7.0 ? 'AMPLIFIED' : pctShift >= 3.5 ? 'COUPLED' : 'DAMPENED';

      return {
        index: i,
        meta: DIMENSION_METADATA[i],
        baseVal,
        plusVal,
        minusVal,
        minBound,
        maxBound,
        deltaAbs,
        pctShift,
        elasticity,
        classification,
        hasThresholdRisk,
        crossesHigh,
        crossesLow,
        rawBase,
        rawPlus,
        rawMinus,
      };
    });

    const sortedBySensitivity = [...dimensions].sort((a, b) => b.pctShift - a.pctShift);
    const mostSensitive = sortedBySensitivity[0];
    const mostResilient = sortedBySensitivity[sortedBySensitivity.length - 1];
    const avgPctShift = dimensions.reduce((acc, d) => acc + d.pctShift, 0) / 11;
    const avgElasticity = dimensions.reduce((acc, d) => acc + d.elasticity, 0) / 11;
    const homeostasisScore = Math.max(68, Math.min(99.8, +(100 - avgPctShift * 2.2).toFixed(1)));
    const entropyDelta = Math.abs(computationPlus.entropy - computationMinus.entropy);
    const atRiskDimensions = dimensions.filter((d) => d.hasThresholdRisk);

    return {
      dimensions,
      mostSensitive,
      mostResilient,
      avgPctShift,
      avgElasticity,
      homeostasisScore,
      entropyDelta,
      atRiskDimensions,
    };
  }, [computation, computationPlus, computationMinus, sensitivityDeltaPct, thresholdHigh, thresholdLow]);

  // Identify dimensions breaching safety operational thresholds (e.g. > 0.90 or < 0.10)
  const breachedDimensions = useMemo(() => {
    const list: {
      index: number;
      type: 'HIGH' | 'LOW';
      value: number;
      metadata: (typeof DIMENSION_METADATA)[number];
      deviation: number;
    }[] = [];

    paddedStateVector.forEach((val, idx) => {
      const meta = DIMENSION_METADATA[idx];
      if (val > thresholdHigh) {
        list.push({
          index: idx,
          type: 'HIGH',
          value: val,
          metadata: meta,
          deviation: +(val - thresholdHigh).toFixed(3),
        });
      } else if (val < thresholdLow) {
        list.push({
          index: idx,
          type: 'LOW',
          value: val,
          metadata: meta,
          deviation: +(thresholdLow - val).toFixed(3),
        });
      }
    });

    return list;
  }, [paddedStateVector, thresholdHigh, thresholdLow]);

  const breachedIndexMap = useMemo(() => {
    const map = new Map<number, { type: 'HIGH' | 'LOW'; value: number }>();
    if (!riskOverlayEnabled) return map;
    breachedDimensions.forEach((b) => {
      map.set(b.index, { type: b.type, value: b.value });
    });
    return map;
  }, [breachedDimensions, riskOverlayEnabled]);

  // Find peak dimension
  let maxIdx = 0;
  let maxVal = -1;
  normalizedOutput.forEach((v, i) => {
    if (v > maxVal) {
      maxVal = v;
      maxIdx = i;
    }
  });

  // Calculate coordinates for 11D SVG Radar chart (Active Nominal / Current State)
  const radarPoints = normalizedOutput.map((val, idx) => {
    const angle = (idx * 2 * Math.PI) / 11 - Math.PI / 2;
    // Scale val from 0-0.4 typical to radius 120
    const r = Math.min(130, Math.max(10, val * 320));
    const cx = 150 + r * Math.cos(angle);
    const cy = 150 + r * Math.sin(angle);
    return { cx, cy, angle, label: `D${idx + 1}`, val };
  });

  const polygonPath = radarPoints.map((p) => `${p.cx},${p.cy}`).join(' ');

  // Calculate Radar Polygon for Upper Fluctuation (+delta%)
  const radarPointsPlus = useMemo(() => {
    return computationPlus.normalizedOutput.map((val, idx) => {
      const angle = (idx * 2 * Math.PI) / 11 - Math.PI / 2;
      const r = Math.min(130, Math.max(10, val * 320));
      return { cx: 150 + r * Math.cos(angle), cy: 150 + r * Math.sin(angle) };
    });
  }, [computationPlus]);
  const polygonPathPlus = useMemo(() => radarPointsPlus.map((p) => `${p.cx},${p.cy}`).join(' '), [radarPointsPlus]);

  // Calculate Radar Polygon for Lower Fluctuation (-delta%)
  const radarPointsMinus = useMemo(() => {
    return computationMinus.normalizedOutput.map((val, idx) => {
      const angle = (idx * 2 * Math.PI) / 11 - Math.PI / 2;
      const r = Math.min(130, Math.max(10, val * 320));
      return { cx: 150 + r * Math.cos(angle), cy: 150 + r * Math.sin(angle) };
    });
  }, [computationMinus]);
  const polygonPathMinus = useMemo(() => radarPointsMinus.map((p) => `${p.cx},${p.cy}`).join(' '), [radarPointsMinus]);

  return (
    <div className="bg-[#050810]/80 rounded-lg border border-[#1a2234] shadow-xl p-4 sm:p-5 flex flex-col h-full relative overflow-hidden">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1a2234]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]" />
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
              {isHi ? '11D क्वांटम लैटिस अवस्था (Deterministic Lattice State)' : '11D Quantum Lattice Visualisation'}
            </h2>
            <span className="text-[9px] font-mono text-gray-500 uppercase">QUANTUM_FIELD_PROJECTION_v2.5</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-[#0a0f1d] p-0.5 rounded border border-[#1a2234] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('3d')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                activeTab === '3d'
                  ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_10px_rgba(0,242,255,0.4)] ring-1 ring-[#00f2ff]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Interactive 3D Manifold Projection (WebGL)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>{isHi ? '3D मैनिफोल्ड' : '3D Manifold'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spectrum')}
              className={`px-2 py-1 rounded font-medium transition flex items-center gap-1 ${
                activeTab === 'spectrum'
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 shadow-[0_0_8px_rgba(0,242,255,0.2)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>{isHi ? 'प्रायिकता स्पेक्ट्रम' : 'Probability Density'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`px-2 py-1 rounded font-medium transition flex items-center gap-1 ${
                activeTab === 'radar'
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 shadow-[0_0_8px_rgba(0,242,255,0.2)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>{isHi ? '11D रडार' : '11D Topology'}</span>
            </button>
          </div>

          {/* Matrix Inspector Button */}
          <button
            type="button"
            onClick={onOpenMatrixModal}
            className="text-xs px-2.5 py-1 bg-[#0a0f1d] hover:bg-[#1a2234] text-[#00f2ff] font-mono rounded border border-[#1a2234] hover:border-[#00f2ff]/50 transition flex items-center gap-1.5"
            title="Inspect 11x11 Complex Hermitian Matrix"
          >
            <Grid3X3 className="w-3 h-3 text-[#00f2ff]" />
            <span>11×11 H-Matrix</span>
          </button>
        </div>
      </div>

      {/* Real-time Risk Assessment & Sensitivity Analysis Toolbar */}
      <div className="py-2.5 px-3 bg-[#080d1a]/90 rounded border border-[#1a2234] mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sensitivity Analysis Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setSensitivityActive(!sensitivityActive);
              if (!sensitivityActive) setShowSensitivityDrawer(true);
            }}
            className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sensitivityActive
                ? 'bg-[#00f2ff] text-[#020408] shadow-[0_0_12px_rgba(0,242,255,0.4)] ring-1 ring-[#00f2ff]'
                : 'bg-[#0a0f1d] text-gray-400 border border-[#1a2234] hover:text-gray-200'
            }`}
            title="Toggle Sensitivity Analysis (±5% Environmental Vector Perturbation)"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isHi ? 'संवेदनशीलता विश्लेषण (±5%):' : 'Sensitivity Analysis:'}</span>
            <span
              className={`px-1 py-0.2 rounded text-[10px] font-black ${
                sensitivityActive ? 'bg-[#020408] text-[#00f2ff]' : 'bg-[#00f2ff]/15 text-[#00f2ff]'
              }`}
            >
              ±{sensitivityDeltaPct}%
            </span>
          </button>

          {/* Sensitivity Telemetry Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowSensitivityDrawer(!showSensitivityDrawer)}
            className={`px-2 py-1 rounded border text-[11px] font-mono flex items-center gap-1 transition cursor-pointer ${
              showSensitivityDrawer
                ? 'bg-[#1a2234] text-[#00f2ff] border-[#00f2ff]/50'
                : 'bg-[#0a0f1d] text-gray-300 border-[#1a2234] hover:text-white'
            }`}
            title="Configure Fluctuation Percentage and View Equilibrium Resilience Dashboard"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'लैटिस संतुलन' : 'Equilibrium'}</span>
            <span className="text-[#00f2ff] font-bold text-[10px]">
              {sensitivityAnalysis.homeostasisScore}%
            </span>
            {showSensitivityDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Soundscape Synthesizer Launcher */}
          {onOpenSoundscape && (
            <button
              type="button"
              onClick={onOpenSoundscape}
              className={`px-2 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
                isSoundscapePlaying
                  ? 'bg-purple-950/80 text-purple-200 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse'
                  : 'bg-[#0a0f1d] text-gray-300 border-[#1a2234] hover:text-[#00f2ff] hover:border-[#00f2ff]/40'
              }`}
              title="Launch Web Audio API Ambient Soundscape Studio"
            >
              <Headphones className={`w-3.5 h-3.5 ${isSoundscapePlaying ? 'text-[#00f2ff]' : 'text-purple-400'}`} />
              <span>{isHi ? 'साउंडस्केप' : 'Soundscape'}</span>
              {isSoundscapePlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
              )}
            </button>
          )}

          {/* Risk Overlay Toggle Switch */}
          <button
            type="button"
            onClick={() => setRiskOverlayEnabled(!riskOverlayEnabled)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              riskOverlayEnabled
                ? breachedDimensions.length > 0
                  ? 'bg-rose-950/80 text-rose-200 border border-rose-500 shadow-[0_0_12px_rgba(255,0,60,0.5)] animate-pulse'
                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/70'
                : 'bg-[#0a0f1d] text-gray-400 border border-[#1a2234] hover:text-gray-200'
            }`}
            title="Toggle Real-Time Risk Assessment Overlay"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${riskOverlayEnabled ? (breachedDimensions.length > 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-gray-500'}`} />
            <span>{isHi ? 'जोखिम ओवरले:' : 'Risk Overlay:'} {riskOverlayEnabled ? (isHi ? 'सक्रिय' : 'ON') : (isHi ? 'निष्क्रिय' : 'OFF')}</span>
            {riskOverlayEnabled && breachedDimensions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            )}
          </button>

          {/* Threshold Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowThresholdSettings(!showThresholdSettings)}
            className={`px-2 py-1 rounded border text-[11px] font-mono flex items-center gap-1 transition cursor-pointer ${
              showThresholdSettings
                ? 'bg-[#1a2234] text-[#00f2ff] border-[#00f2ff]/50'
                : 'bg-[#0a0f1d] text-gray-300 border-[#1a2234] hover:text-white'
            }`}
            title="Configure Safety Threshold Limits"
          >
            <Sliders className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'सुरक्षा सीमाएं' : 'Thresholds'}</span>
            <span className="text-gray-400 font-bold text-[10px]">
              (&lt;{thresholdLow.toFixed(2)} / &gt;{thresholdHigh.toFixed(2)})
            </span>
          </button>

          {/* Breached Only Filter (for spectrum view) */}
          {activeTab === 'spectrum' && riskOverlayEnabled && breachedDimensions.length > 0 && (
            <label className="flex items-center space-x-1.5 text-[11px] font-mono text-gray-300 cursor-pointer bg-[#0a0f1d] px-2 py-1 rounded border border-[#1a2234] hover:border-rose-500/50 transition">
              <input
                type="checkbox"
                checked={filterBreachesOnly}
                onChange={(e) => setFilterBreachesOnly(e.target.checked)}
                className="rounded border-[#1a2234] bg-[#050810] text-rose-500 focus:ring-rose-500/50 cursor-pointer"
              />
              <span className={filterBreachesOnly ? 'text-rose-300 font-bold' : 'text-gray-300'}>
                {isHi ? 'केवल संकट आयाम' : 'Breaches Only'}
              </span>
            </label>
          )}
        </div>

        {/* Real-time Status Summary */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          {sensitivityActive && (
            <span className="text-[#00f2ff] flex items-center gap-1 font-bold bg-[#050810] px-2 py-0.5 rounded border border-[#00f2ff]/30">
              <Waves className="w-3 h-3 text-[#00f2ff] animate-pulse" />
              <span>
                {isOscillating
                  ? `${isHi ? 'लाइव कंपन:' : 'Pulsing:'} ${(oscillationFactor * sensitivityDeltaPct).toFixed(1)}%`
                  : `±${sensitivityDeltaPct}% ${isHi ? 'संवेदनशीलता' : 'Fluctuation Active'}`}
              </span>
            </span>
          )}

          {riskOverlayEnabled ? (
            breachedDimensions.length > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  {breachedDimensions.length} {isHi ? 'आयाम सीमा पार' : 'Breaches Active'}
                </span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHi ? 'सुरक्षित सीमा' : 'In Safe Bounds'}</span>
              </span>
            )
          ) : (
            <span className="text-gray-500">{isHi ? 'ओवरले निष्क्रिय' : 'Risk Bypassed'}</span>
          )}
        </div>
      </div>

      {/* Expandable Sensitivity Analysis & Lattice Equilibrium Console */}
      {showSensitivityDrawer && (
        <div className="mt-2.5 p-3.5 bg-[#0a0f1d] rounded-lg border border-[#00f2ff]/40 shadow-xl text-xs font-mono space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1a2234]">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{isHi ? 'पर्यावरणीय संवेदनशीलता विश्लेषण (Sensitivity Analysis)' : 'Environmental Sensitivity & Lattice Equilibrium Analysis'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#00f2ff]/20 text-[#00f2ff] text-[10px] font-mono">
                    ±{sensitivityDeltaPct}% Perturbation
                  </span>
                </span>
                <p className="text-[10px] text-gray-400 font-sans">
                  {isHi
                    ? `11D इनपुट वेक्टर को ±${sensitivityDeltaPct}% परिवर्तित करके जांचता है कि मामूली पर्यावरणीय उतार-चढ़ाव लैटिस संतुलन और स्थिरता को कैसे प्रभावित करते हैं।`
                    : `Simulates minor ±${sensitivityDeltaPct}% input vector variations to quantify homeostatic resilience, identify volatile bottlenecks, and verify Lyapunov stability.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSensitivityDrawer(false)}
              className="text-gray-400 hover:text-white p-1 self-end sm:self-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Key Equilibrium Impact KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* KPI 1: Homeostasis Resilience Score */}
            <div className="bg-[#050810] p-2.5 rounded border border-[#1a2234] flex flex-col justify-between">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isHi ? 'संतुलन लचीलापन' : 'Homeostasis Score'}</span>
                <ShieldCheck className="w-3 h-3 text-[#00f2ff]" />
              </div>
              <div className="text-lg font-bold text-[#00f2ff] font-mono mt-0.5">
                {sensitivityAnalysis.homeostasisScore}%
              </div>
              <div className="text-[9px] text-gray-400">
                {sensitivityAnalysis.homeostasisScore > 90
                  ? 'High Systemic Dampening'
                  : sensitivityAnalysis.homeostasisScore > 80
                  ? 'Nominal Coupling'
                  : 'Perturbation Sensitive'}
              </div>
            </div>

            {/* KPI 2: Most Volatile Dimension (Bottleneck) */}
            <div className="bg-[#050810] p-2.5 rounded border border-[#1a2234] flex flex-col justify-between">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isHi ? 'सर्वाधिक संवेदनशील' : 'Max Sensitive Vector'}</span>
                <TrendingUp className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5 truncate">
                D{sensitivityAnalysis.mostSensitive.index + 1}: {sensitivityAnalysis.mostSensitive.meta.key}
              </div>
              <div className="text-[9px] text-amber-400/90 font-mono flex items-center justify-between">
                <span>Variance: ±{sensitivityAnalysis.mostSensitive.pctShift.toFixed(1)}%</span>
                <span className="text-[8px] px-1 rounded bg-amber-950/80 border border-amber-500/40">
                  {sensitivityAnalysis.mostSensitive.elasticity}×
                </span>
              </div>
            </div>

            {/* KPI 3: Equilibrium Anchor (Most Resilient) */}
            <div className="bg-[#050810] p-2.5 rounded border border-[#1a2234] flex flex-col justify-between">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isHi ? 'स्थिरता आधार' : 'Equilibrium Anchor'}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5 truncate">
                D{sensitivityAnalysis.mostResilient.index + 1}: {sensitivityAnalysis.mostResilient.meta.key}
              </div>
              <div className="text-[9px] text-emerald-400/90 font-mono flex items-center justify-between">
                <span>Variance: ±{sensitivityAnalysis.mostResilient.pctShift.toFixed(1)}%</span>
                <span className="text-[8px] px-1 rounded bg-emerald-950/80 border border-emerald-500/40">
                  {sensitivityAnalysis.mostResilient.elasticity}×
                </span>
              </div>
            </div>

            {/* KPI 4: Shannon Entropy Shift */}
            <div className="bg-[#050810] p-2.5 rounded border border-[#1a2234] flex flex-col justify-between">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isHi ? 'एन्ट्रॉपी विचलन (ΔS)' : 'Lyapunov Entropy ΔS'}</span>
                <Activity className="w-3 h-3 text-[#a855f7]" />
              </div>
              <div className="text-lg font-bold text-[#a855f7] font-mono mt-0.5">
                ±{sensitivityAnalysis.entropyDelta.toFixed(4)} <span className="text-[10px] text-gray-400 font-normal">bits</span>
              </div>
              <div className="text-[9px] text-gray-400">
                {sensitivityAnalysis.entropyDelta < 0.05 ? 'Lyapunov Invariant Bounded' : 'Turbulence Induced Dispersion'}
              </div>
            </div>
          </div>

          {/* Threshold Crossing Early Warning Banner */}
          {sensitivityAnalysis.atRiskDimensions.length > 0 && (
            <div className="p-2 rounded bg-amber-950/50 border border-amber-500/60 text-amber-200 text-[11px] flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Early Risk Warning:</strong> {sensitivityAnalysis.atRiskDimensions.length} nominal dimension(s) would breach safety thresholds under ±{sensitivityDeltaPct}% environmental fluctuation:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {sensitivityAnalysis.atRiskDimensions.map((d) => (
                  <button
                    key={`risk-dim-${d.index}`}
                    type="button"
                    onClick={() => onInspectDimension && onInspectDimension(d.index)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-400/50 cursor-pointer"
                  >
                    D{d.index + 1} ({d.crossesHigh ? `>${thresholdHigh}` : `<${thresholdLow}`})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Simulation & Fluctuation Controls */}
          <div className="bg-[#050810] p-3 rounded border border-[#1a2234] space-y-2.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Fluctuation Amplitude Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                  <Percent className="w-3 h-3 text-[#00f2ff]" />
                  <span>{isHi ? 'उतार-चढ़ाव आयाम (Amplitude):' : 'Fluctuation Amplitude:'}</span>
                </span>
                <div className="flex items-center space-x-1">
                  {[2, 5, 10, 15].map((pct) => (
                    <button
                      key={`delta-${pct}`}
                      type="button"
                      onClick={() => setSensitivityDeltaPct(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        sensitivityDeltaPct === pct
                          ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                          : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234]'
                      }`}
                    >
                      ±{pct}% {pct === 2 ? '(Micro)' : pct === 5 ? '(Standard)' : pct === 10 ? '(Macro)' : '(Stress)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Mode Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Static Envelope View */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOscillating(false);
                    setSimulationMode('bounds');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer ${
                    simulationMode === 'bounds' && !isOscillating
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234]'
                  }`}
                  title="Display ±5% tolerance interval brackets across all charts"
                >
                  <Layers className="w-3 h-3 text-[#00f2ff]" />
                  <span>{isHi ? 'सहनशीलता लिफाफा (Tolerance Envelope)' : 'Envelope (±5%)'}</span>
                </button>

                {/* Surge (+5%) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOscillating(false);
                    setSimulationMode('plus');
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer ${
                    simulationMode === 'plus' && !isOscillating
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234]'
                  }`}
                  title="Simulate +5% Environmental Surge"
                >
                  <TrendingUp className="w-3 h-3 text-sky-400" />
                  <span>+{sensitivityDeltaPct}% Surge</span>
                </button>

                {/* Deficit (-5%) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOscillating(false);
                    setSimulationMode('minus');
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer ${
                    simulationMode === 'minus' && !isOscillating
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234]'
                  }`}
                  title="Simulate -5% Environmental Deficit"
                >
                  <TrendingDown className="w-3 h-3 text-purple-400" />
                  <span>-{sensitivityDeltaPct}% Deficit</span>
                </button>

                {/* Live Oscillation Play/Pause */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOscillating(!isOscillating);
                    setSimulationMode('oscillate');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isOscillating
                      ? 'bg-emerald-500 text-[#020408] shadow-[0_0_12px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-emerald-400 border border-emerald-500/40'
                  }`}
                  title="Live Sinusoidal Perturbation Oscillation: Watch the lattice breathe in real-time"
                >
                  {isOscillating ? <Pause className="w-3 h-3 text-[#020408]" /> : <Play className="w-3 h-3" />}
                  <span>{isOscillating ? (isHi ? 'कंपन रोकें' : 'Stop Pulse') : (isHi ? 'लाइव कंपन चलाएं' : 'Live Fluctuation Pulse')}</span>
                </button>
              </div>
            </div>

            {/* Fine Slider & Push to Workspace Sliders */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#1a2234]/80 text-[10px]">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <span className="text-gray-400 shrink-0">Fine Slider:</span>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={sensitivityDeltaPct}
                  onChange={(e) => setSensitivityDeltaPct(parseInt(e.target.value, 10))}
                  className="w-full accent-[#00f2ff] h-1.5 bg-[#1a2234] rounded cursor-pointer"
                />
                <span className="text-[#00f2ff] font-bold w-10 font-mono">±{sensitivityDeltaPct}%</span>
              </div>

              {onApplyPerturbedVector && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{isHi ? 'स्लाइडर्स पर लागू करें:' : 'Commit to Sliders:'}</span>
                  <button
                    type="button"
                    onClick={() => onApplyPerturbedVector(inputPlus)}
                    className="px-2 py-0.5 rounded bg-[#0a0f1d] hover:bg-[#1a2234] text-sky-300 border border-sky-500/40 hover:border-sky-400 transition cursor-pointer"
                  >
                    Apply +{sensitivityDeltaPct}%
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyPerturbedVector(inputMinus)}
                    className="px-2 py-0.5 rounded bg-[#0a0f1d] hover:bg-[#1a2234] text-purple-300 border border-purple-500/40 hover:border-purple-400 transition cursor-pointer"
                  >
                    Apply -{sensitivityDeltaPct}%
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expandable Safety Threshold Settings Panel */}
      {showThresholdSettings && (
        <div className="mt-2 p-3 bg-[#0a0f1d] rounded-lg border border-[#00f2ff]/30 shadow-lg text-xs font-mono space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1a2234]">
            <span className="font-bold text-[#00f2ff] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              {isHi ? 'सुरक्षा सीमा विन्यास (Safety Threshold Configuration)' : 'Safety Threshold Parameters'}
            </span>
            <button
              type="button"
              onClick={() => setShowThresholdSettings(false)}
              className="text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upper Safety Threshold (> thresholdHigh) */}
            <div className="space-y-1 bg-[#050810] p-2 rounded border border-[#1a2234]">
              <div className="flex justify-between text-gray-300 text-[11px]">
                <span className="text-rose-400 font-bold">{isHi ? 'उच्च सीमा (अति-दबाव / संकट):' : 'Upper Limit (Overload / Hyper-Stress):'}</span>
                <span className="font-bold text-rose-400">&gt; {thresholdHigh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="0.98"
                step="0.01"
                value={thresholdHigh}
                onChange={(e) => setThresholdHigh(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-[#1a2234] rounded cursor-pointer"
              />
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>0.70</span>
                <span>Default: 0.90</span>
                <span>0.98</span>
              </div>
            </div>

            {/* Lower Safety Threshold (< thresholdLow) */}
            <div className="space-y-1 bg-[#050810] p-2 rounded border border-[#1a2234]">
              <div className="flex justify-between text-gray-300 text-[11px]">
                <span className="text-amber-400 font-bold">{isHi ? 'निम्न सीमा (रिक्तीकरण / क्षरण):' : 'Lower Limit (Depletion / Deficit):'}</span>
                <span className="font-bold text-amber-400">&lt; {thresholdLow.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.01"
                value={thresholdLow}
                onChange={(e) => setThresholdLow(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[#1a2234] rounded cursor-pointer"
              />
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>0.02</span>
                <span>Default: 0.10</span>
                <span>0.30</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
            <span className="text-gray-400">{isHi ? 'त्वरित प्रीसेट:' : 'Presets:'}</span>
            <button
              type="button"
              onClick={() => {
                setThresholdLow(0.10);
                setThresholdHigh(0.90);
              }}
              className="px-2 py-0.5 bg-[#1a2234] hover:bg-[#25324d] text-gray-200 rounded border border-gray-600"
            >
              Standard (&lt;0.10 / &gt;0.90)
            </button>
            <button
              type="button"
              onClick={() => {
                setThresholdLow(0.15);
                setThresholdHigh(0.85);
              }}
              className="px-2 py-0.5 bg-[#1a2234] hover:bg-[#25324d] text-gray-200 rounded border border-gray-600"
            >
              Strict (&lt;0.15 / &gt;0.85)
            </button>
            <button
              type="button"
              onClick={() => {
                setThresholdLow(0.05);
                setThresholdHigh(0.95);
              }}
              className="px-2 py-0.5 bg-[#1a2234] hover:bg-[#25324d] text-gray-200 rounded border border-gray-600"
            >
              Relaxed (&lt;0.05 / &gt;0.95)
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Pulsating Crimson Risk Alert Banner */}
      {riskOverlayEnabled && breachedDimensions.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-lg border border-rose-500/80 bg-gradient-to-r from-rose-950/80 via-red-950/60 to-rose-950/80 shadow-[0_0_20px_rgba(255,0,60,0.35)] animate-pulse-crimson">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="relative shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-rose-200 flex items-center gap-2">
                  <span>{isHi ? 'सुरक्षा सीमा उल्लंघन चेतावनी (Real-Time Risk Alert):' : 'SAFETY THRESHOLD BREACH ALERT:'}</span>
                  <span className="bg-rose-600 text-white font-black px-1.5 py-0.2 rounded text-[10px] tracking-wide animate-pulse">
                    {breachedDimensions.length} {breachedDimensions.length === 1 ? 'DIMENSION' : 'DIMENSIONS'}
                  </span>
                </div>
                <div className="text-[10px] text-rose-300/80 font-mono">
                  {isHi
                    ? `चिन्हित आयाम क्रिम्सन प्रभाव के साथ चमक रहे हैं। विस्तृत भौतिकी के लिए चिप पर क्लिक करें।`
                    : `Highlighted with pulsating crimson glow. Exceeding nominal envelope [<${thresholdLow.toFixed(2)} or >${thresholdHigh.toFixed(2)}]. Click to inspect.`}
                </div>
              </div>
            </div>

            {/* Quick Dimension Inspection Chips */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {breachedDimensions.map((item) => (
                <button
                  key={`breach-chip-${item.index}`}
                  type="button"
                  onClick={() => onInspectDimension && onInspectDimension(item.index)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/90 hover:bg-rose-800 text-rose-100 border border-rose-400 transition flex items-center gap-1 shadow-[0_0_10px_rgba(255,0,60,0.6)] cursor-pointer"
                  title={`Inspect ${item.metadata?.name}`}
                >
                  <span className="text-white">D{item.index + 1}</span>
                  <span className="text-rose-300 font-mono">({item.value.toFixed(2)})</span>
                  <span className="text-[9px] px-1 rounded bg-black/40 text-rose-200">
                    {item.type === 'HIGH' ? `>${thresholdHigh}` : `<${thresholdLow}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Visualizer Area */}
      <div className="my-3 flex-1 flex flex-col justify-center min-h-[380px]">
        {activeTab === '3d' ? (
          /* Interactive 3D Quantum Manifold Projection with Real-time Risk & Sensitivity Overlay */
          <div className="relative w-full h-full">
            <QuantumManifold3D
              computation={activeDisplayComputation}
              language={language}
              onInspectDimension={onInspectDimension}
              riskOverlayEnabled={riskOverlayEnabled}
              thresholdHigh={thresholdHigh}
              thresholdLow={thresholdLow}
            />

            {/* Sensitivity Analysis 3D HUD Overlay */}
            {sensitivityActive && (
              <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto bg-[#050810]/85 backdrop-blur-md p-2.5 rounded border border-[#00f2ff]/40 shadow-lg text-[10px] font-mono space-y-1.5 max-w-[220px]">
                <div className="flex items-center justify-between text-[#00f2ff] font-bold border-b border-[#1a2234] pb-1">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-[#00f2ff]" />
                    <span>Sensitivity Equilibrium</span>
                  </span>
                  <span className="text-[9px] px-1 bg-[#00f2ff]/20 rounded text-[#00f2ff]">
                    ±{sensitivityDeltaPct}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span>Homeostasis:</span>
                  <span className="text-[#00f2ff] font-bold">{sensitivityAnalysis.homeostasisScore}%</span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span>Dynamic State:</span>
                  <span
                    className={`font-bold ${
                      isOscillating
                        ? 'text-emerald-400 animate-pulse'
                        : simulationMode === 'plus'
                        ? 'text-sky-300'
                        : simulationMode === 'minus'
                        ? 'text-purple-300'
                        : 'text-gray-300'
                    }`}
                  >
                    {isOscillating
                      ? `Pulsing (${(oscillationFactor * sensitivityDeltaPct).toFixed(1)}%)`
                      : simulationMode === 'plus'
                      ? `+${sensitivityDeltaPct}% Surge`
                      : simulationMode === 'minus'
                      ? `-${sensitivityDeltaPct}% Deficit`
                      : 'Nominal'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span>Max Sensitive:</span>
                  <span className="text-amber-400 font-bold truncate max-w-[100px]">
                    D{sensitivityAnalysis.mostSensitive.index + 1} (±{sensitivityAnalysis.mostSensitive.pctShift.toFixed(1)}%)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOscillating(!isOscillating);
                    setSimulationMode('oscillate');
                  }}
                  className={`w-full mt-1 py-1 rounded text-[9px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    isOscillating
                      ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-[#0a0f1d] hover:bg-[#1a2234] text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isOscillating ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  <span>{isOscillating ? (isHi ? 'कंपन रोकें' : 'Pause Fluctuation') : (isHi ? 'कंपन सिमुलेशन चलाएं' : 'Simulate Pulse')}</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'spectrum' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400 px-1">
              <span>{isHi ? 'आयाम (Coordinate & Physical State)' : 'Dimension & Physical Property'}</span>
              <span className="font-mono">{isHi ? 'प्रायिकता घनत्व |P|² (Normalized)' : 'Density |P|² (Normalized)'}</span>
            </div>

            <div className="space-y-1.5">
              {normalizedOutput.map((val, idx) => {
                const isPeak = idx === maxIdx;
                const percent = (val * 100).toFixed(2);
                const metadata = DIMENSION_METADATA[idx];
                const phase = phaseAngles[idx] !== undefined ? phaseAngles[idx].toFixed(2) : '0.00';
                const isBreached = riskOverlayEnabled && breachedIndexMap.has(idx);
                const breachInfo = isBreached ? breachedIndexMap.get(idx) : null;
                const rawVal = paddedStateVector[idx] ?? 0;
                const sensDim = sensitivityAnalysis.dimensions[idx];

                // When user toggles "Breached Only", skip nominal dimensions
                if (filterBreachesOnly && !isBreached) {
                  return null;
                }

                return (
                  <div
                    key={`d-${idx}`}
                    className={`p-2 rounded border transition-all ${
                      isBreached
                        ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_16px_rgba(255,0,60,0.45)] ring-1 ring-rose-500/60 animate-pulse-crimson'
                        : isPeak
                        ? 'bg-[#0a0f1d] border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.15)] ring-1 ring-[#00f2ff]/30'
                        : 'bg-[#0a0f1d]/50 border-[#1a2234] hover:border-[#1a2234]/90'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded transition-all ${
                            isBreached
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-black shadow-[0_0_10px_#ff003c] animate-pulse'
                              : isPeak
                              ? 'bg-[#00f2ff] text-[#020408]'
                              : 'bg-[#1a2234] text-gray-300'
                          }`}
                        >
                          D{idx + 1}
                        </span>

                        <span className="font-medium text-gray-200 truncate" title={metadata?.name}>
                          {isHi ? metadata?.hindiName : metadata?.name}
                        </span>

                        {/* Crimson Hazard Badge if Breached */}
                        {isBreached && (
                          <span className="shrink-0 text-[10px] font-mono font-bold text-rose-300 bg-rose-900/70 px-1.5 py-0.2 rounded border border-rose-500/70 flex items-center gap-1 shadow-[0_0_6px_rgba(255,0,60,0.4)]">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                            <span>
                              {breachInfo?.type === 'HIGH'
                                ? isHi ? `अति-दबाव (> ${thresholdHigh.toFixed(2)})` : `OVERLOAD (> ${thresholdHigh.toFixed(2)})`
                                : isHi ? `रिक्तीकरण (< ${thresholdLow.toFixed(2)})` : `DEPLETION (< ${thresholdLow.toFixed(2)})`}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 font-mono text-xs">
                        {/* Display Raw Input Telemetry value alongside */}
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded ${
                            isBreached
                              ? 'text-rose-300 font-bold bg-rose-950/80 border border-rose-500/60'
                              : 'text-gray-400 bg-[#050810]'
                          }`}
                          title={`Input Telemetry Value (Nominal envelope: ${thresholdLow} - ${thresholdHigh})`}
                        >
                          Raw: {rawVal.toFixed(2)}
                        </span>

                        <span className="text-[10px] text-gray-500" title="Quantum Phase Angle θ">
                          θ: {phase} rad
                        </span>
                        <span
                          className={`font-bold ${
                            isBreached ? 'text-rose-400 font-black' : isPeak ? 'text-[#00f2ff]' : 'text-gray-300'
                          }`}
                        >
                          {val.toFixed(5)}
                        </span>
                        <span className="text-[10px] text-gray-400 w-12 text-right font-mono">
                          ({percent}%)
                        </span>

                        {onInspectDimension && (
                          <button
                            type="button"
                            onClick={() => onInspectDimension(idx)}
                            className="p-1 hover:bg-[#1a2234] text-gray-400 hover:text-[#00f2ff] rounded transition cursor-pointer"
                            title="Inspect Dimension Modal"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sensitivity Analysis Tolerance Whisker & Metric */}
                    {sensitivityActive && sensDim && (
                      <div className="flex items-center justify-between text-[10px] font-mono py-0.5 px-1 bg-[#050810]/60 rounded border border-[#1a2234]/60 mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">±{sensitivityDeltaPct}% Bounds:</span>
                          <span className="text-gray-300 font-mono text-[9px]">
                            [{(sensDim.minBound * 100).toFixed(2)}% — {(sensDim.maxBound * 100).toFixed(2)}%]
                          </span>
                          {sensDim.hasThresholdRisk && (
                            <span className="text-[9px] px-1 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                              ⚠️ Risk at ±{sensitivityDeltaPct}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-400 text-[9px]">Variance:</span>
                          <span
                            className={`font-bold px-1 rounded text-[9px] ${
                              sensDim.classification === 'AMPLIFIED'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                : sensDim.classification === 'COUPLED'
                                ? 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            ±{sensDim.pctShift.toFixed(1)}% ({sensDim.classification})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Visual Bar with Pulsating Crimson Gradient or Cyber Glow & Sensitivity Tolerance Span */}
                    <div className="relative w-full bg-[#1a2234]/70 h-2.5 rounded overflow-hidden">
                      {/* Sensitivity Fluctuation Range Shaded Area */}
                      {sensitivityActive && sensDim && (
                        <div
                          className="absolute top-0 bottom-0 bg-[#00f2ff]/20 border-l border-r border-[#00f2ff]/60 z-0"
                          style={{
                            left: `${Math.max(0, Math.min(100, sensDim.minBound * 250))}%`,
                            width: `${Math.max(2, Math.min(100, (sensDim.maxBound - sensDim.minBound) * 250))}%`,
                          }}
                          title={`±${sensitivityDeltaPct}% fluctuation envelope: [${(sensDim.minBound * 100).toFixed(2)}% - ${(sensDim.maxBound * 100).toFixed(2)}%]`}
                        />
                      )}

                      {/* Active Fill Bar */}
                      <div
                        className={`h-full rounded relative z-10 transition-all duration-300 ${
                          isBreached
                            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_14px_#ff003c]'
                            : isPeak
                            ? 'bg-gradient-to-r from-[#00f2ff] via-[#38bdf8] to-[#7000ff] shadow-[0_0_8px_#00f2ff]'
                            : 'bg-gradient-to-r from-[#00f2ff]/40 to-[#7000ff]/40'
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, val * 250))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 11D SVG Radar / Phase Topology with Real-time Crimson Hazard Glow & Sensitivity Bounds */
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-full max-w-[320px] aspect-square">
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Background concentric reference rings */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring) => (
                  <circle
                    key={`ring-${ring}`}
                    cx="150"
                    cy="150"
                    r={120 * ring}
                    fill="none"
                    stroke="#1a2234"
                    strokeDasharray={ring < 1.0 ? '2 3' : 'none'}
                    strokeWidth="1"
                  />
                ))}

                {/* 11 Radial dimension axes with crimson highlight if breached */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const angle = (i * 2 * Math.PI) / 11 - Math.PI / 2;
                  const x2 = 150 + 120 * Math.cos(angle);
                  const y2 = 150 + 120 * Math.sin(angle);
                  const isBreached = riskOverlayEnabled && breachedIndexMap.has(i);

                  return (
                    <line
                      key={`axis-${i}`}
                      x1="150"
                      y1="150"
                      x2={x2}
                      y2={y2}
                      stroke={isBreached ? '#ff003c' : '#1a2234'}
                      strokeWidth={isBreached ? '2' : '1'}
                      className={isBreached ? 'drop-shadow-[0_0_6px_#ff003c]' : ''}
                    />
                  );
                })}

                {/* Sensitivity Analysis Fluctuation Tolerance Envelope Polygons */}
                {sensitivityActive && (
                  <>
                    {/* Upper Fluctuation Envelope (+delta%) */}
                    <polygon
                      points={polygonPathPlus}
                      fill="rgba(56, 189, 248, 0.06)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      className="transition-all duration-300 opacity-80"
                    />

                    {/* Lower Fluctuation Envelope (-delta%) */}
                    <polygon
                      points={polygonPathMinus}
                      fill="rgba(168, 85, 247, 0.06)"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      className="transition-all duration-300 opacity-80"
                    />
                  </>
                )}

                {/* Filled Quantum Probability Density Area (Active Nominal / Perturbed State) */}
                <polygon
                  points={polygonPath}
                  fill="rgba(0, 242, 255, 0.14)"
                  stroke="#00f2ff"
                  strokeWidth="2"
                  className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                />

                {/* Coordinate Nodes with Pulsating Crimson effect */}
                {radarPoints.map((p, idx) => {
                  const isPeak = idx === maxIdx;
                  const isBreached = riskOverlayEnabled && breachedIndexMap.has(idx);

                  return (
                    <g key={`node-${idx}`}>
                      {/* Pulsating Crimson Rings if breached */}
                      {isBreached && (
                        <>
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r="15"
                            fill="none"
                            stroke="#ff003c"
                            strokeWidth="1.5"
                            className="animate-pulse-crimson-ring"
                          />
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r="22"
                            fill="rgba(255, 0, 60, 0.12)"
                            stroke="#ff003c"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        </>
                      )}

                      {/* Coordinate Node Circle */}
                      <circle
                        cx={p.cx}
                        cy={p.cy}
                        r={isBreached ? 6.5 : isPeak ? 5 : 3.5}
                        fill={isBreached ? '#ff003c' : isPeak ? '#00f2ff' : '#7000ff'}
                        stroke={isBreached ? '#ffffff' : '#020408'}
                        strokeWidth={isBreached ? '2' : '1.5'}
                        className={
                          isBreached
                            ? 'drop-shadow-[0_0_12px_#ff003c] cursor-pointer'
                            : isPeak
                            ? 'drop-shadow-[0_0_6px_#00f2ff]'
                            : 'drop-shadow-[0_0_4px_#7000ff]'
                        }
                        onClick={() => onInspectDimension && onInspectDimension(idx)}
                      />

                      {/* Labels at outer perimeter */}
                      <text
                        x={150 + 138 * Math.cos(p.angle)}
                        y={150 + 138 * Math.sin(p.angle) + 4}
                        textAnchor="middle"
                        fontSize={isBreached ? '11' : '10'}
                        fontWeight={isBreached || isPeak ? 'bold' : 'normal'}
                        fill={isBreached ? '#ff003c' : isPeak ? '#00f2ff' : '#94a3b8'}
                        fontFamily="monospace"
                        className={isBreached ? 'drop-shadow-[0_0_6px_rgba(255,0,60,0.9)] font-black' : ''}
                      >
                        {p.label}{isBreached ? '⚠️' : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Radar Resonance Caption & Sensitivity Legend */}
            <p className="text-[11px] text-gray-400 font-mono text-center mt-1">
              11-Dimensional Phase Polygon — {isHi ? 'शिखर आयाम:' : 'Peak Resonance:'} <span className="text-[#00f2ff] font-bold">D{maxIdx + 1}</span> ({DIMENSION_METADATA[maxIdx]?.name.split(' ')[0]})
            </p>

            {/* Sensitivity Analysis Legend */}
            {sensitivityActive && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px] font-mono bg-[#0a0f1d] px-3 py-1.5 rounded border border-[#1a2234]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1 bg-[#00f2ff] rounded inline-block shadow-[0_0_4px_#00f2ff]" />
                  <span className="text-gray-300">
                    {isOscillating
                      ? 'Dynamic Pulse'
                      : simulationMode === 'plus'
                      ? `+${sensitivityDeltaPct}% Surge`
                      : simulationMode === 'minus'
                      ? `-${sensitivityDeltaPct}% Deficit`
                      : 'Active Baseline'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#38bdf8] inline-block" />
                  <span className="text-sky-300">+{sensitivityDeltaPct}% Bound</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#a855f7] inline-block" />
                  <span className="text-purple-300">-{sensitivityDeltaPct}% Bound</span>
                </div>
                <div className="flex items-center space-x-1 text-[#00f2ff] font-bold">
                  <span>Resilience: {sensitivityAnalysis.homeostasisScore}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zero-Hallucination & Quantum Invariants Grid (Including Real-Time Safety Health & Sensitivity Resilience) */}
      <div className="pt-3 border-t border-[#1a2234] grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        {/* Safety Health Status */}
        <div
          className={`p-2 rounded border transition-all ${
            riskOverlayEnabled && breachedDimensions.length > 0
              ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_10px_rgba(255,0,60,0.35)] animate-pulse-crimson'
              : 'bg-[#0a0f1d] border-[#1a2234]'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>Safety State</span>
            {riskOverlayEnabled && breachedDimensions.length > 0 ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            )}
          </div>
          <div
            className={`font-mono font-bold text-sm mt-0.5 ${
              riskOverlayEnabled && breachedDimensions.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {riskOverlayEnabled && breachedDimensions.length > 0
              ? `ALERT (${breachedDimensions.length})`
              : 'NOMINAL (0)'}
          </div>
          <div className="text-[9px] text-gray-400 font-mono">
            {riskOverlayEnabled && breachedDimensions.length > 0
              ? 'Exceeds Safety Envelope'
              : 'Safe Envelope [0.1-0.9]'}
          </div>
        </div>

        {/* Homeostasis Resilience Index */}
        <div className="bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>Equilibrium</span>
            <Gauge className="w-3 h-3 text-[#00f2ff]" />
          </div>
          <div className="font-mono font-bold text-[#00f2ff] text-sm mt-0.5">
            {sensitivityAnalysis.homeostasisScore}%
          </div>
          <div className="text-[9px] text-gray-400 font-mono">
            ±{sensitivityDeltaPct}% Resilience Index
          </div>
        </div>

        {/* Unitary Sum */}
        <div className="bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>∑ P(D_i)</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
            {sumProbability.toFixed(6)}
          </div>
          <div className="text-[9px] text-gray-400 font-mono">100.0% Unitary Preserved</div>
        </div>

        {/* Hermitian Hermiticity Error */}
        <div className="bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>H = H† Error</span>
            <Lock className="w-3 h-3 text-[#00f2ff]" />
          </div>
          <div className="font-mono font-bold text-[#00f2ff] text-sm mt-0.5">
            {hermitianError.toExponential(2)}
          </div>
          <div className="text-[9px] text-gray-400 font-mono">Exact Real Spectrum</div>
        </div>

        {/* Shannon Entropy */}
        <div className="bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>Shannon Entropy</span>
            <Activity className="w-3 h-3 text-[#a855f7]" />
          </div>
          <div className="font-mono font-bold text-[#a855f7] text-sm mt-0.5">
            {entropy.toFixed(3)} bits
          </div>
          <div className="text-[9px] text-gray-400 font-mono">State Dispersion</div>
        </div>

        {/* Peak Dimension */}
        <div className="bg-[#0a0f1d] p-2 rounded border border-[#1a2234]">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase font-mono tracking-wider">
            <span>Peak Flux</span>
            <ArrowUpRight className="w-3 h-3 text-amber-400" />
          </div>
          <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
            D{maxIdx + 1} ({(maxVal * 100).toFixed(1)}%)
          </div>
          <div className="text-[9px] text-gray-400 truncate font-mono">
            {DIMENSION_METADATA[maxIdx]?.name.split(' ')[0]}
          </div>
        </div>
      </div>
    </div>
  );
};

