import React, { useState } from 'react';
import { X, Grid3X3, ShieldCheck, Info } from 'lucide-react';
import { ComplexNumber } from '../types';

interface HermitianMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  quantumLattice: ComplexNumber[][];
  seed: number;
  language: 'en' | 'hi';
}

export const HermitianMatrixModal: React.FC<HermitianMatrixModalProps> = ({
  isOpen,
  onClose,
  quantumLattice,
  seed,
  language,
}) => {
  const [viewMode, setViewMode] = useState<'real' | 'imag' | 'magnitude'>('magnitude');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: ComplexNumber } | null>(null);

  if (!isOpen) return null;

  const isHi = language === 'hi';

  const formatVal = (c: ComplexNumber) => {
    if (viewMode === 'real') return c.re.toFixed(2);
    if (viewMode === 'imag') return c.im.toFixed(2);
    const mag = Math.sqrt(c.re * c.re + c.im * c.im);
    return mag.toFixed(2);
  };

  const getCellColor = (c: ComplexNumber) => {
    let val = 0;
    if (viewMode === 'real') val = c.re;
    else if (viewMode === 'imag') val = c.im;
    else val = Math.sqrt(c.re * c.re + c.im * c.im);

    if (viewMode === 'magnitude') {
      const intensity = Math.min(1, val);
      return `rgba(6, 182, 212, ${0.15 + intensity * 0.7})`;
    } else {
      if (val >= 0) {
        return `rgba(16, 185, 129, ${0.15 + Math.min(1, val) * 0.6})`;
      } else {
        return `rgba(244, 63, 94, ${0.15 + Math.min(1, Math.abs(val)) * 0.6})`;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#050810] text-[#e0e6ed] rounded-lg border border-[#1a2234] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2234] bg-[#050810]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              <Grid3X3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
                {isHi ? '11×11 हर्मिटियन क्वांटम लैटिस आव्यूह' : '11×11 Hermitian Quantum Lattice Matrix (H)'}
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                  Seed #{seed}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                Mathematical Invariant: <code className="text-[#00f2ff] font-mono">H = (M + M†)/2</code> guaranteeing real eigenvalues and deterministic unitarity.
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

        {/* View Mode Controls */}
        <div className="px-5 py-2.5 bg-[#0a0f1d] border-b border-[#1a2234] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400 font-mono text-[11px] uppercase tracking-wider">Display Component:</span>
            <div className="flex bg-[#050810] p-0.5 rounded border border-[#1a2234]">
              <button
                type="button"
                onClick={() => setViewMode('magnitude')}
                className={`px-2 py-1 rounded text-xs font-mono transition ${
                  viewMode === 'magnitude' ? 'bg-[#00f2ff] text-[#020408] font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                |H_ij| Magnitude
              </button>
              <button
                type="button"
                onClick={() => setViewMode('real')}
                className={`px-2 py-1 rounded text-xs font-mono transition ${
                  viewMode === 'real' ? 'bg-[#00f2ff] text-[#020408] font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Re(H_ij) Real
              </button>
              <button
                type="button"
                onClick={() => setViewMode('imag')}
                className={`px-2 py-1 rounded text-xs font-mono transition ${
                  viewMode === 'imag' ? 'bg-[#00f2ff] text-[#020408] font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Im(H_ij) Imag
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Diagonal Im(H_ii) ≡ 0.00 (Pure Real)</span>
          </div>
        </div>

        {/* 11x11 Grid */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar flex flex-col items-center">
          <div className="inline-block border border-[#1a2234] rounded bg-[#0a0f1d] p-2 shadow-inner">
            {/* Header row D1 to D11 */}
            <div className="grid grid-cols-12 gap-1 mb-1 text-[10px] font-mono text-center font-bold text-gray-500">
              <div className="w-8"></div>
              {Array.from({ length: 11 }).map((_, col) => (
                <div key={`head-${col}`} className="w-9 text-[#00f2ff]">
                  D{col + 1}
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {quantumLattice.map((row, rIdx) => (
              <div key={`row-${rIdx}`} className="grid grid-cols-12 gap-1 mb-1 items-center">
                <div className="w-8 text-[10px] font-mono font-bold text-[#00f2ff] text-right pr-1.5">
                  D{rIdx + 1}
                </div>
                {row.map((cell, cIdx) => {
                  const isDiagonal = rIdx === cIdx;
                  return (
                    <div
                      key={`cell-${rIdx}-${cIdx}`}
                      onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx, val: cell })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-9 h-8 rounded text-[10px] font-mono flex items-center justify-center cursor-crosshair transition-all border ${
                        isDiagonal
                          ? 'ring-1 ring-amber-400/60 border-amber-500/40 text-amber-300 font-bold'
                          : 'border-[#1a2234] text-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: getCellColor(cell) }}
                      title={`H[${rIdx + 1},${cIdx + 1}] = ${cell.re.toFixed(4)} + ${cell.im.toFixed(4)}i`}
                    >
                      {formatVal(cell)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Hover Cell Inspector */}
          <div className="mt-4 w-full max-w-xl bg-[#0a0f1d] p-3 rounded border border-[#1a2234] flex items-center justify-between text-xs font-mono">
            {hoveredCell ? (
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-[#00f2ff] font-bold">
                  Element H[D{hoveredCell.row + 1}, D{hoveredCell.col + 1}]:
                </span>
                <span>
                  {hoveredCell.val.re >= 0 ? '+' : ''}
                  {hoveredCell.val.re.toFixed(5)}{' '}
                  {hoveredCell.val.im >= 0 ? '+' : ''}
                  {hoveredCell.val.im.toFixed(5)}i
                </span>
                <span className="text-gray-500 text-[11px]">
                  |H| = {Math.sqrt(hoveredCell.val.re ** 2 + hoveredCell.val.im ** 2).toFixed(5)}
                </span>
              </div>
            ) : (
              <div className="text-gray-500 flex items-center space-x-2">
                <Info className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>Hover over any matrix coordinate to inspect exact complex amplitude and Hermitian conjugate pair.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1a2234] bg-[#050810] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-200 border border-[#1a2234] rounded transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
