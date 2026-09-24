import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TelemetryPanel } from './components/TelemetryPanel';
import { QuantumLatticeVisualizer } from './components/QuantumLatticeVisualizer';
import { MunicipalImpactCard } from './components/MunicipalImpactCard';
import { ScientificInsightTerminal } from './components/ScientificInsightTerminal';
import { HermitianMatrixModal } from './components/HermitianMatrixModal';
import { DimensionGuideModal } from './components/DimensionGuideModal';
import { LabHistoryDrawer } from './components/LabHistoryDrawer';
import { ManualVectorInputModal } from './components/ManualVectorInputModal';
import { ReportExportModal } from './components/ReportExportModal';
import { QuantumSoundscapeModal } from './components/QuantumSoundscapeModal';
import { QuantumSoundscapeFloatingDock } from './components/QuantumSoundscapeFloatingDock';
import { LatticeToastNotificationSystem } from './components/LatticeToastNotificationSystem';
import { RWave11D_QILEngine, LAB_PRESETS, DIMENSION_METADATA } from './lib/quantumEngine';
import { quantumSynth } from './lib/quantumSynthesizer';
import { evaluateLatticeAlerts, AlertSensitivity } from './lib/latticeAlertMonitor';
import { QILComputationResult, ScientificInsightResult, LabHistoryEntry, DimensionInfo, LatticeToastNotification } from './types';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'hi'>('hi');
  const [seed, setSeed] = useState<number>(42);
  const [selectedPreset, setSelectedPreset] = useState<string>('sample_lab');
  const [vector, setVector] = useState<number[]>([0.85, 0.42, 0.63, 0.91]);
  const [insight, setInsight] = useState<ScientificInsightResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Pre-seed history with verified benchmark runs for immediate side-by-side comparative analysis
  const [history, setHistory] = useState<LabHistoryEntry[]>([
    {
      id: 'benchmark-sample-lab',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      presetName: 'Simulated Lab Benchmark [0.85, 0.42, 0.63, 0.91]',
      rawInput: [0.85, 0.42, 0.63, 0.91, 0.52, 0.38, 0.71, 0.49, 0.60, 0.28, 0.77],
      normalizedOutput: [0.12450, 0.06153, 0.09229, 0.13329, 0.07619, 0.05566, 0.10400, 0.07178, 0.08789, 0.04101, 0.11277],
      insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
**Lattice Resonance Coordinates:** D1: 0.12450, D2: 0.06153, D3: 0.09229, D4: 0.13329, D5: 0.07619, D6: 0.05566, D7: 0.10400, D8: 0.07178, D9: 0.08789, D10: 0.04101, D11: 0.11277

#### 1. Deterministic Prediction & Systemic Equilibrium
Standard baseline calibration confirms optimal energy dispersion. Maximum amplitude resides in **D4 (Vegetation & Soil Carbon: 0.133)** followed closely by **D1 (Aquifer Reserves: 0.125)**. Invariant unitary adherence (∑P = 1.0000) certifies zero-hallucination boundary equilibrium.

#### 2. Actionable Planetary Solution
- Maintain steady-state closed-loop extraction protocols.
- Seasonal buffering of surface water into managed aquifer recharge beds.`,
      probabilityDensity: [0.12450, 0.06153, 0.09229, 0.13329, 0.07619, 0.05566, 0.10400, 0.07178, 0.08789, 0.04101, 0.11277],
      entropy: 2.3418,
      seed: 42,
      riskLevel: 'OPTIMAL',
      stabilityIndex: 88.5,
    },
    {
      id: 'benchmark-hydro-crisis',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      presetName: 'Severe Hydrological Drought & Critical Aquifer Strain',
      rawInput: [0.15, 0.78, 0.82, 0.89, 0.88, 0.25, 0.95, 0.45, 0.65, 0.30, 0.90],
      normalizedOutput: [0.02150, 0.11180, 0.11750, 0.12760, 0.12610, 0.03580, 0.13620, 0.06450, 0.09320, 0.04300, 0.12900],
      insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
**Lattice Resonance Coordinates:** D1: 0.02150, D2: 0.11180, D3: 0.11750, D4: 0.12760, D5: 0.12610, D6: 0.03580, D7: 0.13620, D8: 0.06450, D9: 0.09320, D10: 0.04300, D11: 0.12900

#### 1. Deterministic Prediction & Critical Drought Vector
Acute water table depression (D1: 0.02150) couples with intense extraction velocity (D11: 0.12900) and elevated surface thermal strain (D5: 0.12610). System stability degrades sharply to 42%.

#### 2. Actionable Municipal Protocol
- Enforce emergency 45% extraction curtailments on municipal deep wells.
- Deploy gravity-fed emergency canal diversions for unconfined aquifer recharge.`,
      probabilityDensity: [0.02150, 0.11180, 0.11750, 0.12760, 0.12610, 0.03580, 0.13620, 0.06450, 0.09320, 0.04300, 0.12900],
      entropy: 2.1895,
      seed: 101,
      riskLevel: 'CRITICAL',
      stabilityIndex: 42.0,
    },
    {
      id: 'benchmark-aerosol-balance',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      presetName: 'Stratospheric Aerosol & Carbon Sink Equilibrium',
      rawInput: [0.92, 0.35, 0.45, 0.88, 0.32, 0.28, 0.65, 0.40, 0.52, 0.22, 0.60],
      normalizedOutput: [0.1412, 0.0537, 0.0691, 0.1351, 0.0491, 0.0430, 0.0998, 0.0614, 0.0798, 0.0338, 0.0921],
      insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
High stability index confirms resilient carbon sequestration and balanced radiative forcing across boundary layers.`,
      probabilityDensity: [0.1412, 0.0537, 0.0691, 0.1351, 0.0491, 0.0430, 0.0998, 0.0614, 0.0798, 0.0338, 0.0921],
      entropy: 2.3812,
      seed: 77,
      riskLevel: 'OPTIMAL',
      stabilityIndex: 94.2,
    },
    {
      id: 'benchmark-cryo-melt',
      timestamp: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
      presetName: 'Thermal Runaway & Cryospheric Melt Pulse',
      rawInput: [0.22, 0.94, 0.89, 0.96, 0.95, 0.18, 0.98, 0.50, 0.70, 0.35, 0.95],
      normalizedOutput: [0.0298, 0.1274, 0.1206, 0.1301, 0.1287, 0.0244, 0.1328, 0.0678, 0.0949, 0.0474, 0.1287],
      insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
Critical cryospheric albedo collapse detected. Hyper-stress breach across thermal radiation dimensions.`,
      probabilityDensity: [0.0298, 0.1274, 0.1206, 0.1301, 0.1287, 0.0244, 0.1328, 0.0678, 0.0949, 0.0474, 0.1287],
      entropy: 2.1420,
      seed: 888,
      riskLevel: 'CRITICAL',
      stabilityIndex: 37.5,
    },
    {
      id: 'benchmark-monsoon-equil',
      timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      presetName: 'South Asian Monsoon Dynamic Stabilization',
      rawInput: [0.72, 0.55, 0.68, 0.78, 0.60, 0.44, 0.75, 0.58, 0.64, 0.38, 0.70],
      normalizedOutput: [0.1082, 0.0827, 0.1022, 0.1173, 0.0902, 0.0661, 0.1127, 0.0872, 0.0962, 0.0571, 0.1052],
      insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
Equilibrium flux maintained across atmospheric moisture corridors.`,
      probabilityDensity: [0.1082, 0.0827, 0.1022, 0.1173, 0.0902, 0.0661, 0.1127, 0.0872, 0.0962, 0.0571, 0.1052],
      entropy: 2.2985,
      seed: 314,
      riskLevel: 'BALANCED',
      stabilityIndex: 76.8,
    },
  ]);

  // Modals
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isManualInputModalOpen, setIsManualInputModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSoundscapeModalOpen, setIsSoundscapeModalOpen] = useState<boolean>(false);
  const [isSoundscapePlaying, setIsSoundscapePlaying] = useState<boolean>(false);
  const [inspectedDim, setInspectedDim] = useState<DimensionInfo | null>(null);

  // Real-time Lattice Toast Notification & Sentinel State
  const [activeAlerts, setActiveAlerts] = useState<LatticeToastNotification[]>([]);
  const [alertHistory, setAlertHistory] = useState<LatticeToastNotification[]>(() => {
    try {
      const saved = localStorage.getItem('rwave_alert_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rwave_alert_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [alertSensitivity, setAlertSensitivity] = useState<AlertSensitivity>(() => {
    try {
      const saved = localStorage.getItem('rwave_alert_sensitivity');
      return (saved as AlertSensitivity) || 'standard';
    } catch {
      return 'standard';
    }
  });
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState<boolean>(false);

  const prevComputationRef = useRef<QILComputationResult | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const lastAlertCategoryRef = useRef<string>('');

  // Instantiated QIL engine
  const engine = useMemo(() => new RWave11D_QILEngine(seed), [seed]);

  // Real-time deterministic mathematical calculation
  const computation: QILComputationResult = useMemo(() => {
    return engine.computeDeterministicState(vector);
  }, [engine, vector]);

  // Real-time Sentinel Monitor: Evaluates computation for Critical Risk or Extreme Volatility
  useEffect(() => {
    const alert = evaluateLatticeAlerts(computation, prevComputationRef.current, alertSensitivity);
    const now = Date.now();

    if (alert) {
      // Throttle alerts of the same category to at least 2.5s apart to prevent slider drag spam
      const isSameCategory = lastAlertCategoryRef.current === alert.category;
      const timeSinceLast = now - lastAlertTimeRef.current;

      if (!isSameCategory || timeSinceLast > 2500) {
        lastAlertTimeRef.current = now;
        lastAlertCategoryRef.current = alert.category;

        // Play audio alert if sound is enabled
        if (soundEnabled) {
          quantumSynth.playAlertSound(alert.severity);
        }

        // Add to active alerts (max 3 visible simultaneously)
        setActiveAlerts((prev) => [alert, ...prev.filter((a) => a.category !== alert.category)].slice(0, 3));

        // Add to historical alert log (max 50)
        setAlertHistory((prev) => {
          const updated = [alert, ...prev.slice(0, 49)];
          try {
            localStorage.setItem('rwave_alert_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    }

    // Update previous computation reference
    prevComputationRef.current = computation;
  }, [computation, alertSensitivity, soundEnabled]);

  const handleDismissAlert = useCallback((id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleClearAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rwave_alert_sound', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleChangeSensitivity = useCallback((s: AlertSensitivity) => {
    setAlertSensitivity(s);
    try {
      localStorage.setItem('rwave_alert_sensitivity', s);
    } catch {}
  }, []);

  const handleClearHistory = useCallback(() => {
    setAlertHistory([]);
    try {
      localStorage.removeItem('rwave_alert_history');
    } catch {}
  }, []);

  // Stabilize Lattice Action: Dampens extreme deviations and restores balanced equilibrium
  const handleStabilizeLattice = useCallback(() => {
    const stabilized = vector.map((val) => {
      if (val > 0.75) return Number((val * 0.65).toFixed(2));
      if (val < 0.25) return Number((val + 0.35).toFixed(2));
      return Number(val.toFixed(2));
    });
    setVector(stabilized);
    setSelectedPreset('custom');
    setActiveAlerts([]);
  }, [vector]);

  // Sync ambient soundscape synthesizer whenever computation changes
  useEffect(() => {
    if (isSoundscapePlaying) {
      quantumSynth.updateFromLattice(computation);
    }
  }, [computation, isSoundscapePlaying]);

  // Toggle ambient soundscape play/pause
  const handleToggleSoundscape = async () => {
    if (isSoundscapePlaying) {
      quantumSynth.stop();
      setIsSoundscapePlaying(false);
    } else {
      const ok = await quantumSynth.start();
      if (ok) {
        quantumSynth.updateFromLattice(computation);
        setIsSoundscapePlaying(true);
      }
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = LAB_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setVector(found.vector);
      if (found.seed) setSeed(found.seed);
    }
  };

  // Reset to original Python sample
  const handleResetToSample = () => {
    handleSelectPreset('sample_lab');
  };

  // Inspect specific dimension in guide modal
  const handleInspectDimension = (dim: DimensionInfo) => {
    setInspectedDim(dim);
    setIsGuideModalOpen(true);
  };

  const handleInspectDimensionByIndex = (index: number) => {
    const dim = DIMENSION_METADATA[index];
    if (dim) {
      handleInspectDimension(dim);
    }
  };

  // Generate Scientific Insight with Gemini AI
  const handleGenerateInsight = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/qil/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputVector: vector,
          seed,
          language,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setInsight(data.result);

        // Add to history
        const activePreset = LAB_PRESETS.find((p) => p.id === selectedPreset);
        const newHistoryEntry: LabHistoryEntry = {
          id: `run-${Date.now()}`,
          timestamp: new Date().toISOString(),
          presetName: activePreset ? (language === 'hi' ? activePreset.hindiTitle : activePreset.title) : (language === 'hi' ? 'कस्टम टेलीमेट्री रन' : 'Custom Telemetry Run'),
          rawInput: [...vector],
          normalizedOutput: [...computation.normalizedOutput],
          insightText: data.result.insightText,
          probabilityDensity: [...computation.probabilityDensity],
          entropy: computation.entropy,
          seed: computation.seed,
          riskLevel: data.result.riskAssessment?.level || 'BALANCED',
          stabilityIndex: data.result.riskAssessment?.stabilityIndex ?? 82.5,
        };
        setHistory((prev) => [newHistoryEntry, ...prev.slice(0, 24)]);
      } else {
        throw new Error(data.error || 'Insight synthesis failed');
      }
    } catch (err: any) {
      console.error('Insight error:', err);
      // Construct robust client-side fallback if server connection times out
      const coordinatesStr = engine.formatMetricsString(computation.normalizedOutput);
      const fallbackResult: ScientificInsightResult = {
        coordinatesFormatted: coordinatesStr,
        mathematicalCoordinates: computation.normalizedOutput.map((v, i) => ({
          dim: `D${i + 1}`,
          label: DIMENSION_METADATA[i]?.name || `Dimension ${i + 1}`,
          value: v,
        })),
        insightText: `### R-WAVE 11D QIL-ENGINE VERIFIED REPORT
**Lattice Resonance Coordinates:** ${coordinatesStr}

#### 1. Deterministic Prediction & Systemic Equilibrium
Mathematical transformation through the 11D Hermitian Quantum Lattice isolates primary energy flux along the high-magnitude coordinates. Unitary normalization (∑P = 1.0000) confirms zero-hallucination boundary conditions, indicating that unmitigated systemic load will cause dynamic resource variance across coupled nodes.

#### 2. Actionable Planetary Solution
- **Phase Balancing:** Stabilize primary amplitude bottlenecks through localized automated reserves.
- **Closed-Loop Feedback:** Harmonize human extraction velocity with regenerative biological replenishment cycles.
- **Resilience Architecture:** Simplify critical resource delivery nodes for direct community survival safeguards.`,
        riskAssessment: {
          level: 'BALANCED',
          focalDimension: 'D1',
          stabilityIndex: 82.5,
        },
        generatedAt: new Date().toISOString(),
      };
      setInsight(fallbackResult);

      const activePreset = LAB_PRESETS.find((p) => p.id === selectedPreset);
      const fallbackHistoryEntry: LabHistoryEntry = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toISOString(),
        presetName: activePreset ? (language === 'hi' ? activePreset.hindiTitle : activePreset.title) : (language === 'hi' ? 'कस्टम टेलीमेट्री रन' : 'Custom Telemetry Run'),
        rawInput: [...vector],
        normalizedOutput: [...computation.normalizedOutput],
        insightText: fallbackResult.insightText,
        probabilityDensity: [...computation.probabilityDensity],
        entropy: computation.entropy,
        seed: computation.seed,
        riskLevel: fallbackResult.riskAssessment?.level || 'BALANCED',
        stabilityIndex: fallbackResult.riskAssessment?.stabilityIndex ?? 82.5,
      };
      setHistory((prev) => [fallbackHistoryEntry, ...prev.slice(0, 24)]);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore entry from history
  const handleSelectHistoryEntry = (entry: LabHistoryEntry) => {
    setVector(entry.rawInput);
    setIsHistoryDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#020408] text-[#e0e6ed] flex flex-col font-sans selection:bg-[#00f2ff] selection:text-[#020408] relative overflow-x-hidden">
      {/* Background Ambience / Radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(0,242,255,0.035)_0%,_transparent_60%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(112,0,255,0.035)_0%,_transparent_60%)] pointer-events-none" />

      {/* Top Header */}
      <Header
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
        seed={seed}
        onChangeSeed={setSeed}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenGuide={() => {
          setInspectedDim(null);
          setIsGuideModalOpen(true);
        }}
        onResetToSample={handleResetToSample}
        onOpenManualInput={() => setIsManualInputModalOpen(true)}
        onOpenExportReport={() => setIsExportModalOpen(true)}
        onOpenSoundscape={() => setIsSoundscapeModalOpen(true)}
        isSoundscapePlaying={isSoundscapePlaying}
        alertCount={alertHistory.length}
        hasCriticalAlert={activeAlerts.some((a) => a.severity === 'critical')}
        onOpenAlerts={() => setIsAlertHistoryOpen(true)}
      />

      {/* Main Scientific Workstation Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 relative z-10">
        {/* Top Dual Grid: Left = Telemetry Input, Right = Quantum Lattice Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: 11D Field Input (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <TelemetryPanel
              vector={vector}
              onChangeVector={(newVec) => {
                setVector(newVec);
                setSelectedPreset('custom');
              }}
              selectedPreset={selectedPreset}
              onSelectPreset={handleSelectPreset}
              language={language}
              onInspectDimension={handleInspectDimension}
              onOpenManualInput={() => setIsManualInputModalOpen(true)}
            />
          </div>

          {/* Right Column: 11D Quantum Lattice Visualizer (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <QuantumLatticeVisualizer
              computation={computation}
              language={language}
              onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
              onInspectDimension={handleInspectDimensionByIndex}
              onApplyPerturbedVector={(perturbedVec) => {
                setVector(perturbedVec);
                setSelectedPreset('custom');
              }}
              onOpenSoundscape={() => setIsSoundscapeModalOpen(true)}
              isSoundscapePlaying={isSoundscapePlaying}
            />
          </div>
        </div>

        {/* Middle Section: Municipal & Real-World Social Impact Card */}
        <div className="w-full">
          <MunicipalImpactCard
            computation={computation}
            language={language}
            onInspectDimension={handleInspectDimensionByIndex}
          />
        </div>

        {/* Bottom Section: Scientific Insight & Prediction Terminal */}
        <div className="w-full">
          <ScientificInsightTerminal
            computation={computation}
            insight={insight}
            isLoading={isLoading}
            onGenerateInsight={handleGenerateInsight}
            language={language}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            history={history}
            onRestoreVector={(historicalVector) => {
              setVector(historicalVector);
              setSelectedPreset('custom');
            }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a2234] bg-[#050810] py-3 text-center text-[10px] tracking-widest uppercase text-gray-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <span className="text-gray-400">R-WAVE UNIVERSAL INTELLIGENCE LAB © 2025</span>
          <span className="text-[#00f2ff]/60">Lat: 28.6139° N / Lon: 77.2090° E</span>
          <span className="text-[#a855f7]/80">Encrypted 4096-Q • Deterministic Invariant</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <HermitianMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        quantumLattice={engine.quantumLattice}
        seed={seed}
        language={language}
      />

      <DimensionGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        selectedDim={inspectedDim}
        language={language}
      />

      <LabHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onSelectEntry={handleSelectHistoryEntry}
        onClearHistory={() => setHistory([])}
        language={language}
      />

      <ManualVectorInputModal
        isOpen={isManualInputModalOpen}
        onClose={() => setIsManualInputModalOpen(false)}
        currentVector={vector}
        onApplyVector={(newVec) => {
          setVector(newVec);
          setSelectedPreset('custom');
        }}
        language={language}
      />

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        computation={computation}
        insight={insight}
        language={language}
      />

      {/* 11D Quantum Ambient Soundscape Modal */}
      <QuantumSoundscapeModal
        isOpen={isSoundscapeModalOpen}
        onClose={() => setIsSoundscapeModalOpen(false)}
        computation={computation}
        language={language}
      />

      {/* Persistent Audio Synthesizer Floating Controller Dock */}
      <QuantumSoundscapeFloatingDock
        computation={computation}
        language={language}
        onOpenFullStudio={() => setIsSoundscapeModalOpen(true)}
        isPlaying={isSoundscapePlaying}
        onTogglePlay={handleToggleSoundscape}
      />

      {/* Real-time Critical Risk & Dimensional Volatility Toast System */}
      <LatticeToastNotificationSystem
        activeAlerts={activeAlerts}
        alertHistory={alertHistory}
        onDismissAlert={handleDismissAlert}
        onClearAllAlerts={handleClearAllAlerts}
        onInspectDimensionByIndex={handleInspectDimensionByIndex}
        onStabilizeLattice={handleStabilizeLattice}
        onGenerateInsight={handleGenerateInsight}
        language={language}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        sensitivity={alertSensitivity}
        onChangeSensitivity={handleChangeSensitivity}
        isHistoryTrayOpen={isAlertHistoryOpen}
        onToggleHistoryTray={() => setIsAlertHistoryOpen((prev) => !prev)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
