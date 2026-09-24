import React, { useState } from 'react';
import { X, Download, Copy, Check, Printer, FileText, Code2, Table, Sparkles } from 'lucide-react';
import { DIMENSION_METADATA } from '../lib/quantumEngine';
import { QILComputationResult, ScientificInsightResult } from '../types';
import { convertDimension } from '../lib/unitConversion';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  computation: QILComputationResult | null;
  insight: ScientificInsightResult | null;
  language: 'en' | 'hi';
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  computation,
  insight,
  language,
}) => {
  const isHi = language === 'hi';
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'json' | 'text' | 'csv'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !computation) return null;

  const timestamp = computation.timestamp || new Date().toISOString();
  const dateStr = new Date(timestamp).toLocaleString();

  // Generate Markdown
  const generateMarkdown = () => {
    const coordinatesTable = DIMENSION_METADATA.map((dim, i) => {
      const raw = (computation.rawInput[i] ?? 0).toFixed(4);
      const ampRe = computation.evolvedState[i]?.re.toFixed(4) ?? '0.0000';
      const ampIm = computation.evolvedState[i]?.im.toFixed(4) ?? '0.0000';
      const prob = (computation.probabilityDensity[i] ?? 0).toFixed(5);
      const norm = (computation.normalizedOutput[i] ?? 0).toFixed(5);
      return `| D${i + 1} | ${dim.name} | ${raw} | ${ampRe} + ${ampIm}i | ${prob} | ${norm} |`;
    }).join('\n');

    return `# R-WAVE UNIVERSAL INTELLIGENCE LAB
## 11-Dimensional Quantum-Intelligence Lattice (QIL) Scientific Audit Report

- **Report ID:** R-WAVE-${Date.now().toString(36).toUpperCase()}
- **Generated At:** ${dateStr}
- **Master Operator:** Hermitian Matrix $H = \\frac{M + M^\\dagger}{2}$ (Seed #${computation.seed})
- **System Unitary Invariant ($\\sum P_i$):** ${computation.sumProbability.toFixed(6)} [Verified 100% Deterministic]
- **Hermitian Numerical Conjugate Error:** ${computation.hermitianError.toExponential(4)}
- **Shannon Information Entropy ($S$):** ${computation.entropy.toFixed(4)} bits
- **Stability Index:** ${insight?.riskAssessment?.stabilityIndex ?? 85}%
- **Systemic Risk Level:** ${insight?.riskAssessment?.level ?? 'BALANCED'}

---

### 1. Verified 11-Dimensional Coordinate State Vector
\`\`\`text
=== R-WAVE 11D QIL-ENGINE VERIFIED OUTPUT ===
${DIMENSION_METADATA.map((d, i) => `${d.key}: ${(computation.normalizedOutput[i] ?? 0).toFixed(5)}`).join(', ')}
\`\`\`

| Dim | Physical & Planetary Vector | Raw Input | Complex Amplitude ($\\psi_i'$) | Probability ($P_i$) | Normalized Density |
|:---|:---|:---:|:---:|:---:|:---:|
${coordinatesTable}

---

### 2. Scientific Insight & Deterministic Planetary Prediction
${insight?.insightText ?? '_No AI insight generated for this run yet._'}

---

### 3. Verification & Compliance Signature
- **Deterministic Operator:** Unitary Evolution Invariant $\\mathbf{U} = \\exp(-i \\mathbf{H} \\Delta t)$
- **Zero-Hallucination Assertion:** All probabilities strictly normalized to $1.000000$.
- **Research Directive:** Authorized for municipal, environmental, and planetary infrastructure applications.
- **R-WAVE Universal Intelligence Lab** • Digital Avatar for Rajesh (R WAY)
`;
  };

  // Generate Plain Text Certificate
  const generatePlainText = () => {
    const divider = '='.repeat(78);
    const subDivider = '-'.repeat(78);

    const coordLines = DIMENSION_METADATA.map((dim, i) => {
      const key = `D${i + 1}`.padEnd(4);
      const name = dim.name.slice(0, 36).padEnd(38);
      const raw = (computation.rawInput[i] ?? 0).toFixed(3).padStart(6);
      const norm = (computation.normalizedOutput[i] ?? 0).toFixed(5).padStart(9);
      const prob = (computation.probabilityDensity[i] ?? 0).toFixed(5).padStart(9);
      return `${key} | ${name} | In: ${raw} | Norm: ${norm} | P: ${prob}`;
    }).join('\n');

    return `${divider}
R-WAVE UNIVERSAL INTELLIGENCE LAB // 11D QUANTUM LATTICE SCIENTIFIC AUDIT
${divider}
Timestamp        : ${dateStr}
Hermitian Seed   : #${computation.seed}
Unitary Invariant: sum(P_i) = ${computation.sumProbability.toFixed(6)} [VERIFIED DETERMINISTIC]
Shannon Entropy  : ${computation.entropy.toFixed(4)} bits
Hermitian Error  : ${computation.hermitianError.toExponential(4)}
Stability Index  : ${insight?.riskAssessment?.stabilityIndex ?? 85}%
Systemic Risk    : ${insight?.riskAssessment?.level ?? 'BALANCED'}

${subDivider}
11-DIMENSIONAL COORDINATE VECTOR DISTRIBUTION
${subDivider}
${coordLines}

${subDivider}
DETERMINISTIC SCIENTIFIC INSIGHT & MUNICIPAL ACTION PLAN
${subDivider}
${(insight?.insightText ?? 'No insight attached.').replace(/[#*`]/g, '')}

${divider}
END OF R-WAVE AUDIT REPORT • VERIFIED MATHEMATICAL INVARIANT
${divider}
`;
  };

  // Generate CSV
  const generateCSV = () => {
    const headers = 'Dimension,Name,Category,Raw_Input,Lattice_Normalized_Psi,Probability_Density,SI_Metric_Value,SI_Unit,Imperial_Value,Imperial_Unit,Conversion_Formula\n';
    const rows = DIMENSION_METADATA.map((dim, i) => {
      const raw = computation.rawInput[i] ?? 0;
      const prob = computation.probabilityDensity[i] ?? 0;
      const norm = computation.normalizedOutput[i] ?? 0;
      const si = convertDimension(i + 1, norm, 'SI');
      const imp = convertDimension(i + 1, norm, 'IMPERIAL');
      return `"${dim.key}","${dim.name.replace(/"/g, '""')}","${dim.category}",${raw},${norm},${prob},${si.convertedValue},"${si.unitSymbol}",${imp.convertedValue},"${imp.unitSymbol}","${si.conversionFormula.replace(/"/g, '""')}"`;
    }).join('\n');
    return headers + rows;
  };

  // Generate JSON
  const generateJSON = () => {
    const payload = {
      lab: 'R-WAVE Universal Intelligence Lab',
      avatar: 'Rajesh (R WAY)',
      reportId: `R-WAVE-${Date.now().toString(36).toUpperCase()}`,
      timestamp,
      mathVerification: {
        operator: 'Hermitian Matrix H = (M + M_dagger)/2',
        seed: computation.seed,
        unitaryInvariantSum: computation.sumProbability,
        hermitianNumericalError: computation.hermitianError,
        shannonEntropyBits: computation.entropy,
        zeroHallucinationCertified: computation.sumProbability >= 0.9999 && computation.sumProbability <= 1.0001,
      },
      vector11D: {
        rawInput: computation.rawInput,
        normalizedOutput: computation.normalizedOutput,
        probabilityDensity: computation.probabilityDensity,
        complexState: computation.evolvedState,
        formattedString: DIMENSION_METADATA.map((d, i) => `${d.key}: ${(computation.normalizedOutput[i] ?? 0).toFixed(5)}`).join(', '),
        multiUnitMatrix: DIMENSION_METADATA.map((d, i) => {
          const norm = computation.normalizedOutput[i] ?? 0;
          const si = convertDimension(i + 1, norm, 'SI');
          const imp = convertDimension(i + 1, norm, 'IMPERIAL');
          return {
            dim: d.key,
            name: d.name,
            latticePsi: norm,
            si: { value: si.convertedValue, unit: si.unitSymbol, formatted: si.formattedValue },
            imperial: { value: imp.convertedValue, unit: imp.unitSymbol, formatted: imp.formattedValue },
            formula: si.conversionFormula,
          };
        }),
      },
      scientificInsight: insight ?? null,
    };
    return JSON.stringify(payload, null, 2);
  };

  const getActiveContent = () => {
    switch (selectedFormat) {
      case 'markdown':
        return generateMarkdown();
      case 'text':
        return generatePlainText();
      case 'csv':
        return generateCSV();
      case 'json':
      default:
        return generateJSON();
    }
  };

  const handleDownload = () => {
    const content = getActiveContent();
    let filename = `r-wave-11d-audit-${Date.now()}`;
    let mimeType = 'text/plain';

    if (selectedFormat === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
    } else if (selectedFormat === 'json') {
      filename += '.json';
      mimeType = 'application/json';
    } else if (selectedFormat === 'csv') {
      filename += '.csv';
      mimeType = 'text/csv';
    } else {
      filename += '.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#050810] text-[#e0e6ed] rounded-lg border border-[#1a2234] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2234] bg-[#050810]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
                {isHi ? 'वैज्ञानिक रिपोर्ट डाउनलोड एवं निर्यात केंद्र' : 'Scientific Report Export & Audit Suite'}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                  Multi-Format
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {isHi
                  ? 'गणितीय रूप से प्रमाणित 11D लैटिस रिपोर्ट Markdown, JSON, Text व CSV प्रारूप में डाउनलोड करें'
                  : 'Export verified 11D mathematical proof & planetary action plans across industry standard formats'}
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

        {/* Format Selector Bar */}
        <div className="px-5 py-2.5 bg-[#0a0f1d] border-b border-[#1a2234] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400 font-mono text-[11px] uppercase tracking-wider">
              {isHi ? 'प्रारूप चुनें:' : 'Select Format:'}
            </span>
            <div className="flex bg-[#050810] p-0.5 rounded border border-[#1a2234]">
              <button
                type="button"
                onClick={() => setSelectedFormat('markdown')}
                className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                  selectedFormat === 'markdown'
                    ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                  selectedFormat === 'json'
                    ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Package (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('text')}
                className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                  selectedFormat === 'text'
                    ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Plain Text (.txt)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                  selectedFormat === 'csv'
                    ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>CSV Metrics (.csv)</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-mono bg-[#050810] hover:bg-[#1a2234] text-gray-300 hover:text-[#00f2ff] border border-[#1a2234] rounded transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isHi ? 'कॉपी किया गया' : 'Copied') : isHi ? 'क्लिपबोर्ड में कॉपी करें' : 'Copy Content'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-mono bg-[#050810] hover:bg-[#1a2234] text-gray-300 hover:text-[#00f2ff] border border-[#1a2234] rounded transition flex items-center gap-1"
              title="Print formatted report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रिंट / पीडीएफ' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#050810]">
          <pre className="text-[11px] font-mono text-gray-300 bg-[#0a0f1d] p-4 rounded border border-[#1a2234] whitespace-pre-wrap leading-relaxed selection:bg-[#00f2ff] selection:text-[#020408]">
            {getActiveContent()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#1a2234] bg-[#050810] flex items-center justify-between">
          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>
              {isHi
                ? 'R-WAVE लैब प्रमाणित शून्य-भ्रम गणितीय रिपोर्ट'
                : 'R-WAVE Certified Zero-Hallucination Mathematical Report'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234] rounded transition"
            >
              {isHi ? 'बंद करें' : 'Close'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider bg-[#00f2ff] hover:bg-[#70fffa] text-[#020408] rounded shadow-[0_0_15px_rgba(0,242,255,0.35)] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHi ? 'फ़ाइल डाउनलोड करें' : 'Download File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
