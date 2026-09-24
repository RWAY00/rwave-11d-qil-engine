import React from 'react';
import { X, BookOpen, Atom, Layers } from 'lucide-react';
import { DIMENSION_METADATA } from '../lib/quantumEngine';
import { DimensionInfo } from '../types';

interface DimensionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDim: DimensionInfo | null;
  language: 'en' | 'hi';
}

export const DimensionGuideModal: React.FC<DimensionGuideModalProps> = ({
  isOpen,
  onClose,
  selectedDim,
  language,
}) => {
  if (!isOpen) return null;
  const isHi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#050810] text-[#e0e6ed] rounded-lg border border-[#1a2234] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2234] bg-[#050810]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
                {isHi ? '11-आयामी क्वांटम लैटिस संदर्भ गाइड' : '11-Dimensional Planetary Vector Guide'}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                Universal Intelligence Lab Physics & Ecological State Coordinate Mapping
              </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {DIMENSION_METADATA.map((dim) => {
            const isHighlighted = selectedDim?.id === dim.id;
            return (
              <div
                key={dim.key}
                className={`p-3.5 rounded border transition-all ${
                  isHighlighted
                    ? 'bg-[#0a0f1d] border-[#00f2ff] ring-1 ring-[#00f2ff]/50'
                    : 'bg-[#0a0f1d] border-[#1a2234] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#050810] text-[#00f2ff] border border-[#1a2234]">
                      {dim.key}
                    </span>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                      {isHi ? dim.hindiName : dim.name}
                    </h4>
                  </div>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#050810] text-gray-400 border border-[#1a2234]">
                    {dim.category}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  {dim.description}
                </p>
                <div className="mt-2 text-[10px] font-mono text-gray-500 flex items-center justify-between">
                  <span>Unit: {dim.unit}</span>
                  <span className="text-[#00f2ff]/80">Default Baseline: {dim.defaultValue.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1a2234] bg-[#050810] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-200 border border-[#1a2234] rounded transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
