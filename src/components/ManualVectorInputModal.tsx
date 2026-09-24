import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, ArrowRight, Sparkles, Copy, RefreshCw, FileText } from 'lucide-react';
import { DIMENSION_METADATA } from '../lib/quantumEngine';

interface ManualVectorInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVector: number[];
  onApplyVector: (newVector: number[]) => void;
  language: 'en' | 'hi';
}

const TEMPLATE_PRESETS = [
  { label: 'Sample Lab [0.85, 0.42, 0.63, 0.91]', val: '0.85, 0.42, 0.63, 0.91' },
  { label: 'Severe Hydro Crisis', val: '0.15, 0.78, 0.82, 0.89, 0.88, 0.25, 0.95, 0.45, 0.65, 0.30, 0.90' },
  { label: 'Equalized 0.50 Baseline', val: '0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50' },
  { label: 'Extreme Urban Peak', val: '0.50, 0.94, 0.92, 0.70, 0.81, 0.40, 0.55, 0.62, 0.89, 0.35, 0.84' },
];

export const ManualVectorInputModal: React.FC<ManualVectorInputModalProps> = ({
  isOpen,
  onClose,
  currentVector,
  onApplyVector,
  language,
}) => {
  const isHi = language === 'hi';
  const [rawText, setRawText] = useState('');
  const [parsedValues, setParsedValues] = useState<number[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Initialize input text when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawText(currentVector.map((v) => Number(v).toFixed(2)).join(', '));
    }
  }, [isOpen, currentVector]);

  // Parse text whenever rawText changes
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedValues([]);
      setParseError(null);
      return;
    }

    try {
      let cleaned = rawText.trim();
      // Handle JSON array format e.g. [0.85, 0.42]
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1);
      }

      // Handle key-value formatted entries like D1: 0.85, D2: 0.42 or D1=0.85
      cleaned = cleaned.replace(/D\d+\s*[:=]\s*/gi, '');

      // Split by commas, spaces, newlines, semicolons, tabs
      const tokens = cleaned
        .split(/[\s,;\n\t]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const numbers: number[] = [];
      for (const token of tokens) {
        const num = parseFloat(token);
        if (isNaN(num)) {
          throw new Error(isHi ? `अमान्य संख्या: "${token}"` : `Invalid number token: "${token}"`);
        }
        // Clamp between 0.00 and 1.00 for stability
        const clamped = Math.max(0, Math.min(1, num));
        numbers.push(Number(clamped.toFixed(4)));
      }

      if (numbers.length === 0) {
        setParsedValues([]);
        setParseError(isHi ? 'कोई संख्या नहीं मिली' : 'No numeric coordinates detected');
      } else {
        setParsedValues(numbers);
        setParseError(null);
      }
    } catch (err: any) {
      setParseError(err.message || (isHi ? 'पार्सिंग त्रुटि' : 'Parsing syntax error'));
      setParsedValues([]);
    }
  }, [rawText, isHi]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedValues.length > 0) {
      // Pad or truncate to 11 dimensions
      const finalVector = [...parsedValues];
      while (finalVector.length < 11) {
        const idx = finalVector.length;
        finalVector.push(DIMENSION_METADATA[idx]?.defaultValue ?? 0.5);
      }
      onApplyVector(finalVector.slice(0, 11));
      onClose();
    }
  };

  const handleApplyPreset = (val: string) => {
    setRawText(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#050810] text-[#e0e6ed] rounded-lg border border-[#1a2234] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2234] bg-[#050810]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0a0f1d] border border-[#1a2234] flex items-center justify-center text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
                {isHi ? 'मैन्युअल वेक्टर इनपुट टर्मिनल' : 'Manual Vector Telemetry Input Box'}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                  Raw Ingestion
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {isHi
                  ? 'अल्पविराम (comma), स्पेस या JSON प्रारूप में सीधे मान दर्ज या पेस्ट करें'
                  : 'Paste comma-separated values, JSON arrays, or raw numeric coordinates directly'}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Quick Presets */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              {isHi ? 'त्वरित टेम्पलेट्स (Quick Presets):' : 'Quick Template Examples:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_PRESETS.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(t.val)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 hover:text-[#00f2ff] border border-[#1a2234] transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#00f2ff]" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {isHi ? 'कच्चा डेटा / निर्देशांक स्ट्रिंग (Raw Vector String):' : 'Raw Vector Input String:'}
              </label>
              <span className="text-[11px] font-mono text-gray-500">
                {isHi ? 'समर्थित: 0.85, 0.42, 0.63 या [0.85, 0.42]' : 'Supports: 0.85, 0.42 or [0.85, 0.42]'}
              </span>
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="0.85, 0.42, 0.63, 0.91, 0.52, 0.38, 0.71, 0.49, 0.60, 0.28, 0.77"
              className="w-full bg-[#0a0f1d] text-[#00f2ff] font-mono text-xs p-3 rounded border border-[#1a2234] focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/50 leading-relaxed shadow-inner"
            />
          </div>

          {/* Parse Status & Dimension Live Preview */}
          <div className="bg-[#0a0f1d] p-3.5 rounded border border-[#1a2234]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {parseError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : parsedValues.length > 0 ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-mono font-bold">
                  {parseError ? (
                    <span className="text-rose-400">{parseError}</span>
                  ) : parsedValues.length > 0 ? (
                    <span className="text-emerald-400">
                      {isHi
                        ? `${parsedValues.length} निर्देशांक सफलतापूर्वक पार्स किए गए`
                        : `${parsedValues.length} coordinates successfully validated`}
                    </span>
                  ) : (
                    <span className="text-gray-500">{isHi ? 'मान दर्ज करने की प्रतीक्षा...' : 'Awaiting vector input...'}</span>
                  )}
                </span>
              </div>

              {parsedValues.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#050810] text-[#00f2ff] border border-[#1a2234]">
                  {parsedValues.length < 11
                    ? isHi
                      ? `शेष ${11 - parsedValues.length} आयाम डिफ़ॉल्ट से भरे जाएंगे`
                      : `Remaining ${11 - parsedValues.length} D auto-padded`
                    : isHi
                    ? 'पूर्ण 11-आयामी वेक्टर'
                    : 'Complete 11D Vector'}
                </span>
              )}
            </div>

            {/* Parsed Coordinate Grid */}
            {parsedValues.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 mt-2">
                {Array.from({ length: 11 }).map((_, idx) => {
                  const val = parsedValues[idx] !== undefined ? parsedValues[idx] : DIMENSION_METADATA[idx]?.defaultValue ?? 0.5;
                  const isAutoPadded = idx >= parsedValues.length;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded text-center font-mono text-[10px] border ${
                        isAutoPadded
                          ? 'bg-[#050810]/40 border-[#1a2234]/60 text-gray-500'
                          : 'bg-[#050810] border-[#00f2ff]/30 text-[#00f2ff]'
                      }`}
                    >
                      <div className="text-[9px] text-gray-400">D{idx + 1}</div>
                      <div className="font-bold">{val.toFixed(2)}</div>
                      {isAutoPadded && <div className="text-[8px] text-gray-600">(auto)</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#1a2234] bg-[#050810] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 border border-[#1a2234] rounded transition"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={parsedValues.length === 0}
            className="px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider bg-[#00f2ff] hover:bg-[#70fffa] text-[#020408] rounded shadow-[0_0_15px_rgba(0,242,255,0.35)] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isHi ? 'लैटिस में लोड करें' : 'Load Vector into Lattice'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
