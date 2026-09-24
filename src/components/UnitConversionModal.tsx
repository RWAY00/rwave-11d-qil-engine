import React from 'react';
import { X, Atom, Globe, Ruler, HelpCircle, Check, Info, ArrowRight } from 'lucide-react';
import { OutputUnitSystem, ConvertedDimensionValue } from '../types';
import { UNIT_SYSTEMS, convertAllDimensions } from '../lib/unitConversion';

interface UnitConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  normalizedOutput: number[];
  activeSystem: OutputUnitSystem;
  onSelectSystem: (system: OutputUnitSystem) => void;
  language: 'en' | 'hi';
}

export const UnitConversionModal: React.FC<UnitConversionModalProps> = ({
  isOpen,
  onClose,
  normalizedOutput,
  activeSystem,
  onSelectSystem,
  language,
}) => {
  if (!isOpen) return null;
  const isHi = language === 'hi';

  const convertedDimensions = convertAllDimensions(normalizedOutput, activeSystem);

  const renderIcon = (sys: OutputUnitSystem) => {
    switch (sys) {
      case 'LATTICE':
        return <Atom className="w-4 h-4 text-[#00f2ff]" />;
      case 'SI':
        return <Globe className="w-4 h-4 text-[#10b981]" />;
      case 'IMPERIAL':
        return <Ruler className="w-4 h-4 text-[#f59e0b]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#050810] border border-[#1a2234] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a2234] bg-[#0a0f1d]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30">
              <Globe className="w-5 h-5 text-[#00f2ff]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono tracking-wide flex items-center gap-2">
                {isHi ? '11D आउटपुट परिमाण एवं इकाई रूपांतरण' : '11D Output Unit System & Dimensional Conversion Matrix'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {isHi
                  ? 'क्वांटम लैटिस (Ψ), एसआई मीट्रिक (SI) तथा इंपीरियल (Imperial) इकाइयों के बीच सहज रूपांतरण'
                  : 'Convert quantum state invariant amplitudes into real-world physical metrics and imperial engineering units'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2234] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Selector Cards */}
        <div className="p-5 bg-[#070b14] border-b border-[#1a2234] grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['LATTICE', 'SI', 'IMPERIAL'] as OutputUnitSystem[]).map((sysKey) => {
            const sys = UNIT_SYSTEMS[sysKey];
            const isSelected = activeSystem === sysKey;

            return (
              <div
                key={sysKey}
                onClick={() => onSelectSystem(sysKey)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0a1224] border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)] ring-1 ring-[#00f2ff]/40'
                    : 'bg-[#0a0f1d] border-[#1a2234] hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderIcon(sysKey)}
                      <span className="text-xs font-bold font-mono text-white">
                        {isHi ? sys.hindiName : sys.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#00f2ff] flex items-center justify-center">
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#00f2ff] border border-[#00f2ff]/30 mb-2">
                    {sys.badge}
                  </span>
                  <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                    {isHi ? sys.hindiDescription : sys.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1a2234] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-500">
                    {sysKey === 'LATTICE' ? 'Dimensionless [0-1]' : sysKey === 'SI' ? 'Metric Planetary' : 'US Engineering'}
                  </span>
                  <span className={`font-bold ${isSelected ? 'text-[#00f2ff]' : 'text-gray-400'}`}>
                    {isSelected ? (isHi ? 'सक्रिय' : 'ACTIVE') : (isHi ? 'चुनें' : 'Select')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cross-System Conversion Table */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>{isHi ? '11D समकालिक रूपांतरण तुलना' : 'Simultaneous 11D Cross-System Dimensional Matrix'}</span>
            </h4>
            <span className="text-[10px] font-mono text-gray-400">
              ∑Ψ = {normalizedOutput.reduce((a, b) => a + b, 0).toFixed(5)} [Unitary Invariant Preserved]
            </span>
          </div>

          <div className="border border-[#1a2234] rounded-xl overflow-hidden bg-[#0a0f1d]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050810] text-gray-400 border-b border-[#1a2234] text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Dim</th>
                  <th className="py-2.5 px-3">Planetary Domain</th>
                  <th className="py-2.5 px-3 text-right">R-WAVE Lattice (Ψ)</th>
                  <th className="py-2.5 px-3 text-right">SI Metric Unit</th>
                  <th className="py-2.5 px-3 text-right">Imperial Unit</th>
                  <th className="py-2.5 px-3 text-left">Conversion Formula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2234]">
                {convertedDimensions.map((dim) => {
                  return (
                    <tr
                      key={dim.dimId}
                      className="hover:bg-[#0e1628] transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-bold text-[#00f2ff]">
                        {dim.key}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-gray-200 font-medium text-[11px]">
                          {isHi ? dim.hindiName : dim.name}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase">
                          {dim.category}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                        <span className={`px-1.5 py-0.5 rounded ${activeSystem === 'LATTICE' ? 'bg-[#00f2ff]/20 text-[#00f2ff] font-bold' : ''}`}>
                          {dim.latticeValue.toFixed(5)} Ψ
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                        <span className={`px-1.5 py-0.5 rounded ${activeSystem === 'SI' ? 'bg-emerald-500/20 font-bold' : ''}`}>
                          {dim.siFormatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                        <span className={`px-1.5 py-0.5 rounded ${activeSystem === 'IMPERIAL' ? 'bg-amber-500/20 font-bold' : ''}`}>
                          {dim.imperialFormatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-left text-gray-400 text-[10px]">
                        <code className="bg-[#050810] px-1.5 py-0.5 rounded border border-[#1a2234] text-gray-300">
                          {dim.conversionFormula}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0f1d] border-t border-[#1a2234] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="text-gray-400 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {isHi
                ? 'चयनित इकाई प्रणाली टर्मिनल आउटपुट, कॉपी क्लिपबोर्ड और एक्सपोर्ट्स में लागू होगी।'
                : 'Selected unit system dynamically updates all terminal coordinates, copy actions, and report exports.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#00f2ff] text-[#020408] font-bold text-xs uppercase tracking-wider hover:bg-[#70fffa] transition cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.3)]"
          >
            {isHi ? 'पुष्टि करें' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
