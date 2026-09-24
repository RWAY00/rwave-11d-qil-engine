import React from 'react';
import { X, History, Trash2, ArrowUpRight, Clock, FileText } from 'lucide-react';
import { LabHistoryEntry } from '../types';

interface LabHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: LabHistoryEntry[];
  onSelectEntry: (entry: LabHistoryEntry) => void;
  onClearHistory: () => void;
  language: 'en' | 'hi';
}

export const LabHistoryDrawer: React.FC<LabHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectEntry,
  onClearHistory,
  language,
}) => {
  if (!isOpen) return null;
  const isHi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-[#050810] text-[#e0e6ed] w-full max-w-md h-full border-l border-[#1a2234] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2234] bg-[#050810]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#7000ff] shadow-[0_0_10px_rgba(112,0,255,0.3)]">
              <History className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
                {isHi ? 'प्रयोगशाला इतिहास (Laboratory Runs)' : 'Laboratory Run History'}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{history.length} runs recorded in active session</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-[#1a2234] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#00f2ff]" />
              <span>No simulation runs recorded yet. Execute 11D Evolution to log telemetry runs.</span>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="p-3.5 rounded border border-[#1a2234] bg-[#0a0f1d] hover:border-[#00f2ff] cursor-pointer transition group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#00f2ff]">
                    {entry.presetName || 'Custom Telemetry Run'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="font-mono text-[11px] text-gray-400 bg-[#050810] p-2 rounded border border-[#1a2234] truncate mb-2">
                  Input: [{entry.rawInput.map((v) => v.toFixed(2)).join(', ')}]
                </div>

                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {entry.insightText.replace(/[#*`]/g, '')}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#00f2ff] group-hover:text-[#70fffa]">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Load telemetry vector
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a2234] bg-[#050810] flex items-center justify-between">
          <button
            type="button"
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded border border-rose-900/50 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-200 border border-[#1a2234] rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
