import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Activity,
  Zap,
  X,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  History,
  Check,
  ChevronRight,
  Flame,
  Info,
} from 'lucide-react';
import { LatticeToastNotification } from '../types';
import { AlertSensitivity } from '../lib/latticeAlertMonitor';

interface LatticeToastNotificationSystemProps {
  activeAlerts: LatticeToastNotification[];
  alertHistory: LatticeToastNotification[];
  onDismissAlert: (id: string) => void;
  onClearAllAlerts: () => void;
  onInspectDimensionByIndex?: (index: number) => void;
  onStabilizeLattice?: () => void;
  onGenerateInsight?: () => void;
  language: 'en' | 'hi';
  soundEnabled: boolean;
  onToggleSound: () => void;
  sensitivity: AlertSensitivity;
  onChangeSensitivity: (s: AlertSensitivity) => void;
  isHistoryTrayOpen: boolean;
  onToggleHistoryTray: () => void;
  onClearHistory: () => void;
}

const TOAST_LIFETIME_MS = 9000;

export const LatticeToastNotificationSystem: React.FC<LatticeToastNotificationSystemProps> = ({
  activeAlerts,
  alertHistory,
  onDismissAlert,
  onClearAllAlerts,
  onInspectDimensionByIndex,
  onStabilizeLattice,
  onGenerateInsight,
  language,
  soundEnabled,
  onToggleSound,
  sensitivity,
  onChangeSensitivity,
  isHistoryTrayOpen,
  onToggleHistoryTray,
  onClearHistory,
}) => {
  const isHi = language === 'hi';

  return (
    <>
      {/* Floating Active Toast Stack */}
      <div
        className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-[calc(100vw-2rem)] sm:max-w-md pointer-events-none"
        aria-live="assertive"
        role="region"
        aria-label="Quantum Lattice System Alerts"
      >
        {activeAlerts.map((alert) => (
          <ToastCard
            key={alert.id}
            alert={alert}
            onDismiss={() => onDismissAlert(alert.id)}
            onInspectDimension={onInspectDimensionByIndex}
            onStabilizeLattice={onStabilizeLattice}
            onGenerateInsight={onGenerateInsight}
            isHi={isHi}
          />
        ))}
      </div>

      {/* Slide-out Notification Log & Settings Drawer */}
      {isHistoryTrayOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#050810] border-l border-[#1a2234] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#1a2234] flex items-center justify-between bg-[#0a0f1d]">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {isHi ? 'लैटिस जोखिम एवं अस्थिरता लॉग' : 'Lattice Alert Telemetry Hub'}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    {alertHistory.length} {isHi ? 'घटनाएं दर्ज की गईं' : 'telemetry breaches recorded'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleHistoryTray}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2234] transition cursor-pointer"
                aria-label="Close alert center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Settings Bar */}
            <div className="px-4 py-3 bg-[#080d19] border-b border-[#1a2234] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
              {/* Sound toggle */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/40'
                    : 'bg-[#1a2234]/40 text-gray-400 border-[#1a2234]'
                }`}
                title={soundEnabled ? 'Mute alert sounds' : 'Enable sonic alert chimes'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{soundEnabled ? (isHi ? 'ध्वनि चालू' : 'Audio On') : (isHi ? 'ध्वनि बंद' : 'Muted')}</span>
              </button>

              {/* Sensitivity selector */}
              <div className="flex items-center gap-1 bg-[#050810] p-0.5 rounded-md border border-[#1a2234] text-[10px]">
                <span className="text-gray-500 px-1.5">{isHi ? 'संवेदनशीलता:' : 'Trigger:'}</span>
                {(['standard', 'strict', 'high'] as AlertSensitivity[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeSensitivity(s)}
                    className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${
                      sensitivity === s
                        ? 'bg-[#00f2ff] text-black font-bold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {alertHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-gray-400 hover:text-rose-400 text-[10px] transition cursor-pointer ml-auto"
                >
                  {isHi ? 'इतिहास मिटाएं' : 'Clear Log'}
                </button>
              )}
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {alertHistory.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1a2234] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-mono font-bold text-gray-300 uppercase">
                    {isHi ? 'कोई जोखिम चेतावनी नहीं' : 'All Dimensions Nominal'}
                  </h4>
                  <p className="text-[11px] font-mono text-gray-500 mt-1">
                    {isHi
                      ? 'लैटिस संतुलन सामान्य सीमा में संचालित हो रहा है।'
                      : 'No critical risk breaches or extreme volatility detected in active state vector.'}
                  </p>
                </div>
              ) : (
                alertHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border text-xs font-mono transition ${
                      item.severity === 'critical'
                        ? 'bg-[#10080c] border-rose-900/60 text-gray-200'
                        : 'bg-[#100d08] border-amber-900/60 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5">
                        {item.severity === 'critical' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            item.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <h5 className="font-bold text-gray-100 text-xs mt-0.5">
                      {isHi ? item.hindiTitle : item.title}
                    </h5>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      {isHi ? item.hindiMessage : item.message}
                    </p>

                    <div className="mt-2 pt-2 border-t border-[#1a2234]/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400">
                      <span>
                        Stability: <strong className="text-[#00f2ff]">{item.stabilityIndex}%</strong>
                      </span>
                      {item.focalDimensionKey && (
                        <span>
                          Focal: <strong className="text-white">{item.focalDimensionKey}</strong> ({item.focalValue?.toFixed(4)} Ψ)
                        </span>
                      )}
                      {item.dimensionIndex !== undefined && onInspectDimensionByIndex && (
                        <button
                          type="button"
                          onClick={() => {
                            onInspectDimensionByIndex(item.dimensionIndex!);
                            onToggleHistoryTray();
                          }}
                          className="text-[#00f2ff] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                        >
                          <span>{isHi ? 'निरीक्षण' : 'Inspect'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-[#080d19] border-t border-[#1a2234] flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>R-WAVE Quantum Invariant Sentinel</span>
              </span>
              <button
                type="button"
                onClick={onToggleHistoryTray}
                className="text-[#00f2ff] hover:underline cursor-pointer"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface ToastCardProps {
  alert: LatticeToastNotification;
  onDismiss: () => void;
  onInspectDimension?: (index: number) => void;
  onStabilizeLattice?: () => void;
  onGenerateInsight?: () => void;
  isHi: boolean;
}

const ToastCard: React.FC<ToastCardProps> = ({
  alert,
  onDismiss,
  onInspectDimension,
  onStabilizeLattice,
  onGenerateInsight,
  isHi,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(TOAST_LIFETIME_MS);

  // Auto-dismiss countdown timer with pause-on-hover
  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / TOAST_LIFETIME_MS) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss]);

  const isCritical = alert.severity === 'critical';

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full rounded-xl p-3.5 border shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in-50 ${
        isCritical
          ? 'bg-[#0f070b]/95 border-rose-500/75 shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/40'
          : 'bg-[#0e0a05]/95 border-amber-500/75 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40'
      }`}
      role="alert"
    >
      {/* Top Banner: Category & Dismiss */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center space-x-2">
          <div
            className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Activity className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span
                className={`text-[9px] font-mono uppercase tracking-widest font-black px-1.5 py-0.2 rounded border ${
                  isCritical
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                {alert.category.replace('_', ' ')}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            </div>
            <h4 className="text-xs font-bold font-mono text-white tracking-wide mt-0.5">
              {isHi ? alert.hindiTitle : alert.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Dismiss alert"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message Body */}
      <p className="text-[11px] font-mono text-gray-300 leading-relaxed pl-8 pr-1 mb-2.5">
        {isHi ? alert.hindiMessage : alert.message}
      </p>

      {/* Real-time Diagnostics Grid */}
      <div className="pl-8 mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 rounded-lg bg-black/50 border border-white/10 text-[10px] font-mono">
          <div>
            <span className="text-gray-500 block">Stability Index</span>
            <span
              className={`font-bold ${
                alert.stabilityIndex < 45 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {alert.stabilityIndex}%
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Shannon Entropy</span>
            <span className="text-cyan-300 font-bold">{alert.entropy} bits</span>
          </div>

          {alert.focalDimensionKey && (
            <div className="col-span-2 sm:col-span-1">
              <span className="text-gray-500 block">Focal Stress</span>
              <span className="text-purple-300 font-bold truncate block">
                {alert.focalDimensionKey}: {alert.focalValue?.toFixed(4)} Ψ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pl-8 flex flex-wrap items-center gap-1.5 pt-1">
        {alert.dimensionIndex !== undefined && onInspectDimension && (
          <button
            type="button"
            onClick={() => {
              onInspectDimension(alert.dimensionIndex!);
              onDismiss();
            }}
            className="px-2.5 py-1 rounded bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/40 text-[#00f2ff] text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <span>{isHi ? 'आयाम गाइड देखें' : `Inspect ${alert.focalDimensionKey || 'Dimension'}`}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {onStabilizeLattice && (
          <button
            type="button"
            onClick={() => {
              onStabilizeLattice();
              onDismiss();
            }}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
            title="Dampen hyper-stressed dimensional vectors toward equilibrium"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>{isHi ? 'लैटिस संतुलित करें' : 'Stabilize Lattice'}</span>
          </button>
        )}

        {onGenerateInsight && (
          <button
            type="button"
            onClick={() => {
              onGenerateInsight();
              onDismiss();
            }}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer ml-auto"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>{isHi ? 'कार्य योजना बनाएं' : 'Synthesize Plan'}</span>
          </button>
        )}
      </div>

      {/* Progress countdown bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
        <div
          className={`h-full transition-all duration-100 ${
            isCritical
              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
              : 'bg-gradient-to-r from-amber-500 to-cyan-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
