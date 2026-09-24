import React from 'react';
import { Droplets, Flame, Zap, TreePine, ShieldCheck, AlertTriangle, Activity, ArrowUpRight } from 'lucide-react';
import { DIMENSION_METADATA } from '../lib/quantumEngine';
import { QILComputationResult } from '../types';

interface MunicipalImpactCardProps {
  computation: QILComputationResult;
  language: 'en' | 'hi';
  onInspectDimension?: (index: number) => void;
}

export const MunicipalImpactCard: React.FC<MunicipalImpactCardProps> = ({
  computation,
  language,
  onInspectDimension,
}) => {
  const isHi = language === 'hi';
  const norm = computation.normalizedOutput;

  // Derive specialized municipal & planetary indices from 11D coordinates
  // D1: Hydro (0), D2: Carbon (1), D3: Grid (2), D4: Biome (3), D5: Albedo (4), D6: Cryo (5), D7: Soil (6), D8: Ocean (7), D9: Aerosol (8), D10: Litho (9), D11: Anthro (10)
  const d1 = norm[0] ?? 0.5;
  const d2 = norm[1] ?? 0.5;
  const d3 = norm[2] ?? 0.5;
  const d4 = norm[3] ?? 0.5;
  const d5 = norm[4] ?? 0.5;
  const d7 = norm[6] ?? 0.5;
  const d9 = norm[8] ?? 0.5;
  const d11 = norm[10] ?? 0.5;

  // 1. Water Reserve Stability %
  const waterSecurityScore = Math.max(10, Math.min(99, Math.round(d1 * 100 * (1.1 - d11 * 0.3))));

  // 2. Urban Heat & Thermal Index (0-100)
  const thermalIndex = Math.max(5, Math.min(98, Math.round(((d2 * 0.4 + d5 * 0.35 + d9 * 0.25) / 0.8) * 100)));

  // 3. Grid Reserve Capacity Margin %
  const gridCapacityMargin = Math.max(8, Math.min(96, Math.round((1 - d3 * 0.75 - d11 * 0.15) * 100)));

  // 4. Ecological Biome & Food Security %
  const ecologicalHealth = Math.max(12, Math.min(99, Math.round(((d7 * 0.6 + (1 - d4) * 0.4) / 0.9) * 100)));

  // Find the highest strain dimension (Bottleneck Dimension)
  let maxDimIdx = 0;
  let maxDimVal = -1;
  norm.forEach((val, idx) => {
    if (val > maxDimVal) {
      maxDimVal = val;
      maxDimIdx = idx;
    }
  });
  const bottleneckDim = DIMENSION_METADATA[maxDimIdx];

  const getStatusBadge = (score: number, invert = false) => {
    const isGood = invert ? score < 45 : score >= 65;
    const isModerate = invert ? score >= 45 && score < 75 : score >= 40 && score < 65;

    if (isGood) {
      return {
        label: isHi ? 'संतुलित / इष्टतम' : 'STABLE / OPTIMAL',
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      };
    }
    if (isModerate) {
      return {
        label: isHi ? 'सतर्कता आवश्यक' : 'ELEVATED STRAIN',
        color: 'bg-amber-950/80 text-amber-300 border-amber-800',
      };
    }
    return {
      label: isHi ? 'गंभीर तनाव' : 'CRITICAL ALERT',
      color: 'bg-rose-950/80 text-rose-300 border-rose-800',
    };
  };

  return (
    <div className="bg-[#050810]/90 rounded-lg border border-[#1a2234] shadow-xl p-4 sm:p-5 flex flex-col space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1a2234]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff]">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
              {isHi ? 'नागरिक व सामाजिक प्रभाव सूचकांक' : 'Municipal & Social Impact Assessment'}
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                Live Translation
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {isHi
                ? '11D लैटिस निर्देशांकों का प्रत्यक्ष जन-जीवन व नगरीय प्रणालियों पर प्रभाव'
                : 'Deterministic translation of 11D coordinates into real-world municipal infrastructure resilience'}
            </p>
          </div>
        </div>

        {/* Bottleneck indicator */}
        <div
          onClick={() => onInspectDimension && onInspectDimension(maxDimIdx)}
          className="flex items-center space-x-2 bg-[#0a0f1d] hover:bg-[#1a2234] border border-[#1a2234] hover:border-[#00f2ff]/50 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer self-start sm:self-auto group"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 group-hover:text-[#00f2ff]" />
          <span className="text-gray-400">{isHi ? 'मुख्य संवेदनशीलता:' : 'Critical Vector:'}</span>
          <span className="text-[#00f2ff] font-bold">
            {bottleneckDim?.key} ({bottleneckDim?.name.split(' ')[0]})
          </span>
          <ArrowUpRight className="w-3 h-3 text-gray-500 group-hover:text-[#00f2ff]" />
        </div>
      </div>

      {/* 4 Core Municipal Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Water Security */}
        <div className="bg-[#0a0f1d] p-3.5 rounded border border-[#1a2234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>{isHi ? 'जल सुरक्षा व भंडारण' : 'Water Table Security'}</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(waterSecurityScore).color}`}>
                {getStatusBadge(waterSecurityScore).label}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              {waterSecurityScore}%
              <span className="text-xs text-gray-500 font-normal ml-1">reserve index</span>
            </div>
          </div>
          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234] mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#00f2ff] to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${waterSecurityScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Thermal Stress */}
        <div className="bg-[#0a0f1d] p-3.5 rounded border border-[#1a2234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHi ? 'नगरीय तापीय तनाव' : 'Urban Heat Strain'}</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(thermalIndex, true).color}`}>
                {getStatusBadge(thermalIndex, true).label}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              {thermalIndex}
              <span className="text-xs text-gray-500 font-normal ml-1">/ 100 flux</span>
            </div>
          </div>
          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234] mt-2">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${thermalIndex}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Grid Reserve Margin */}
        <div className="bg-[#0a0f1d] p-3.5 rounded border border-[#1a2234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#a855f7]" />
                <span>{isHi ? 'ग्रिड ऊर्जा संतुलन' : 'Grid Stability Margin'}</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(gridCapacityMargin).color}`}>
                {getStatusBadge(gridCapacityMargin).label}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              {gridCapacityMargin}%
              <span className="text-xs text-gray-500 font-normal ml-1">resilience</span>
            </div>
          </div>
          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234] mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#7000ff] to-[#00f2ff] rounded-full transition-all duration-500"
              style={{ width: `${gridCapacityMargin}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Ecological Replenishment */}
        <div className="bg-[#0a0f1d] p-3.5 rounded border border-[#1a2234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHi ? 'मृदा व जैव पुनर्जनन' : 'Ecological Replenishment'}</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(ecologicalHealth).color}`}>
                {getStatusBadge(ecologicalHealth).label}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              {ecologicalHealth}%
              <span className="text-xs text-gray-500 font-normal ml-1">bio-throughput</span>
            </div>
          </div>
          <div className="w-full bg-[#050810] h-1.5 rounded-full overflow-hidden border border-[#1a2234] mt-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-500"
              style={{ width: `${ecologicalHealth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Direct Municipal Action Directive */}
      <div className="bg-[#0a0f1d] p-3.5 rounded border-l-2 border-[#00f2ff] border-y border-r border-[#1a2234] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-4 h-4 text-[#00f2ff] shrink-0" />
          <p className="text-gray-300 leading-relaxed">
            <strong className="text-white font-semibold mr-1">
              {isHi ? 'नगरीय निकाय क्रियान्वयन सलाह:' : 'Municipal Infrastructure Protocol:'}
            </strong>
            {waterSecurityScore < 50
              ? isHi
                ? 'भूजल दोहन पर तत्काल 35% कमी लागू करें और कृत्रिम पुनर्भरण कुओं में प्रवाह मोड़ें।'
                : 'Implement immediate 35% extraction caps on local aquifers and route seasonal runoff to artificial recharge beds.'
              : thermalIndex > 70
              ? isHi
                ? 'शहरी तापीय तनाव को नियंत्रित करने के लिए कूल-रूफ कोटिंग्स और अर्बन शेडिंग नेटवर्क सक्रिय करें।'
                : 'Activate urban shading and cool-roof protocols to counter elevated aerosol-carbon infrared trapping.'
              : isHi
              ? 'प्रणाली स्थिर अवस्था में है। नियमित बंद-लूप निगरानी बनाए रखें।'
              : 'System operating within stable thresholds. Maintain continuous closed-loop telemetry monitoring.'}
          </p>
        </div>
        <div className="text-[11px] font-mono text-gray-500 shrink-0">
          Entropy: <span className="text-[#00f2ff] font-bold">{computation.entropy.toFixed(3)} bits</span>
        </div>
      </div>
    </div>
  );
};
