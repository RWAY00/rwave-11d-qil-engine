import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
  Flag,
  Plus,
  Trash2,
  Check,
  Copy,
  Download,
  Search,
  Filter,
  User,
  Clock,
  ExternalLink,
  MessageSquare,
  Tag,
  Share2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { ReportAnnotation, AnnotationMarkerType, LabHistoryEntry, QILComputationResult } from '../types';
import { DIMENSION_METADATA } from '../lib/quantumEngine';

interface ReportAnnotationManagerProps {
  annotations: ReportAnnotation[];
  onAddAnnotation: (annotation: Omit<ReportAnnotation, 'id' | 'timestamp'>) => void;
  onDeleteAnnotation: (id: string) => void;
  onToggleResolveAnnotation: (id: string) => void;
  history: LabHistoryEntry[];
  currentComputation: QILComputationResult;
  onSelectHistoricalReport?: (reportId: string) => void;
  language: 'en' | 'hi';
  activeReportIdFilter?: string | null;
  onClearReportFilter?: () => void;
}

export const MARKER_CONFIGS: Record<
  AnnotationMarkerType,
  {
    label: string;
    hindiLabel: string;
    description: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ElementType;
  }
> = {
  ANOMALY: {
    label: 'Lattice Anomaly',
    hindiLabel: 'लैटिस विसंगति (Anomaly)',
    description: 'Unusual flux divergence or parameter instability detected.',
    bgClass: 'bg-rose-950/80',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-700/80',
    icon: AlertTriangle,
  },
  HYPOTHESIS: {
    label: 'Team Hypothesis',
    hindiLabel: 'अनुसंधान परिकल्पना (Hypothesis)',
    description: 'Working theory regarding non-linear planetary coupling.',
    bgClass: 'bg-amber-950/80',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-700/80',
    icon: Lightbulb,
  },
  VERIFIED: {
    label: 'Peer Verified',
    hindiLabel: 'सत्यापित निष्कर्ष (Verified)',
    description: 'Mathematically cross-checked and verified by domain experts.',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-700/80',
    icon: CheckCircle2,
  },
  CRITICAL_REVIEW: {
    label: 'Critical Review',
    hindiLabel: 'महत्वपूर्ण समीक्षा (Review)',
    description: 'Flagged for urgent team intervention or safety review.',
    bgClass: 'bg-purple-950/80',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-700/80',
    icon: ShieldAlert,
  },
  FLAG: {
    label: 'Field Note',
    hindiLabel: 'फील्ड नोट / अवलोकन (Flag)',
    description: 'General observation or benchmark bookmark for team sharing.',
    bgClass: 'bg-[#00f2ff]/15',
    textClass: 'text-[#00f2ff]',
    borderClass: 'border-[#00f2ff]/40',
    icon: Flag,
  },
};

const AUTHOR_PRESETS = [
  'Dr. Sen (Lead Quantum)',
  'Hydrology Research Team',
  'Ecological Systems Specialist',
  'Field Operative (Station Alpha)',
  'Guest Peer Reviewer',
];

export const ReportAnnotationManager: React.FC<ReportAnnotationManagerProps> = ({
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onToggleResolveAnnotation,
  history,
  currentComputation,
  onSelectHistoricalReport,
  language,
  activeReportIdFilter,
  onClearReportFilter,
}) => {
  const isHi = language === 'hi';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [showResolved, setShowResolved] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // New Annotation Form State
  const [targetReportId, setTargetReportId] = useState<string>(
    activeReportIdFilter || (history.length > 0 ? history[0].id : 'current')
  );
  const [newAuthor, setNewAuthor] = useState(AUTHOR_PRESETS[0]);
  const [newMarkerType, setNewMarkerType] = useState<AnnotationMarkerType>('HYPOTHESIS');
  const [newPinnedDim, setNewPinnedDim] = useState<string>('General');
  const [newText, setNewText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Annotations
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((ann) => {
      // Report filter
      if (activeReportIdFilter && ann.reportId !== activeReportIdFilter) {
        return false;
      }
      // Marker type filter
      if (selectedTypeFilter !== 'ALL' && ann.markerType !== selectedTypeFilter) {
        return false;
      }
      // Resolved filter
      if (!showResolved && ann.resolved) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = ann.text.toLowerCase().includes(q);
        const matchesAuthor = ann.author.toLowerCase().includes(q);
        const matchesReport = (ann.reportTitle || '').toLowerCase().includes(q);
        const matchesDim = (ann.pinnedDimension || '').toLowerCase().includes(q);
        if (!matchesText && !matchesAuthor && !matchesReport && !matchesDim) {
          return false;
        }
      }
      return true;
    });
  }, [annotations, activeReportIdFilter, selectedTypeFilter, showResolved, searchQuery]);

  // Handle Form Submit
  const handleCreateAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      setFormError(isHi ? 'कृपया नोट का विवरण दर्ज करें।' : 'Please enter the note text.');
      return;
    }

    // Determine target report title
    let reportTitle = 'Current Workstation Run';
    if (targetReportId !== 'current') {
      const found = history.find((h) => h.id === targetReportId);
      if (found) {
        reportTitle = found.presetName || `Run #${found.id.slice(-6)}`;
      }
    }

    onAddAnnotation({
      reportId: targetReportId,
      reportTitle,
      author: newAuthor.trim() || 'Anonymous Researcher',
      text: newText.trim(),
      markerType: newMarkerType,
      pinnedDimension: newPinnedDim !== 'General' ? newPinnedDim : undefined,
      resolved: false,
    });

    setNewText('');
    setFormError(null);
    setIsAddingNew(false);
  };

  // Copy single annotation
  const handleCopyAnnotation = (ann: ReportAnnotation) => {
    const text = `[${ann.markerType}] ${ann.reportTitle || ann.reportId} (${ann.author}):\n${ann.text}\nTimestamp: ${new Date(ann.timestamp).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export all annotations as Markdown Knowledge Brief
  const handleExportMarkdown = () => {
    let md = `# R-WAVE UNIVERSAL INTELLIGENCE LAB
## Team Knowledge Sharing & Annotation Brief
- **Generated:** ${new Date().toLocaleString()}
- **Total Annotations:** ${annotations.length}
- **Active Filter:** ${activeReportIdFilter ? `Report #${activeReportIdFilter}` : 'All Reports'}

---

`;

    const markerTypes: AnnotationMarkerType[] = ['CRITICAL_REVIEW', 'ANOMALY', 'HYPOTHESIS', 'VERIFIED', 'FLAG'];

    markerTypes.forEach((type) => {
      const matched = annotations.filter((a) => a.markerType === type);
      if (matched.length > 0) {
        md += `### ${MARKER_CONFIGS[type].label.toUpperCase()} (${matched.length})\n\n`;
        matched.forEach((ann, idx) => {
          md += `#### ${idx + 1}. ${ann.reportTitle || ann.reportId} ${ann.pinnedDimension ? `[${ann.pinnedDimension}]` : ''}\n`;
          md += `- **Author:** ${ann.author}\n`;
          md += `- **Date:** ${new Date(ann.timestamp).toLocaleString()}\n`;
          md += `- **Status:** ${ann.resolved ? 'RESOLVED / VERIFIED' : 'ACTIVE'}\n`;
          md += `- **Note:**\n> ${ann.text.replace(/\n/g, '\n> ')}\n\n`;
        });
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-team-annotations-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy all annotations to clipboard
  const handleCopyAll = () => {
    const text = annotations
      .map(
        (a) =>
          `[${a.markerType}] ${a.reportTitle || a.reportId} (${a.author}): ${a.text} ${a.pinnedDimension ? `[Dim: ${a.pinnedDimension}]` : ''}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4 text-gray-200">
      {/* Header & Top Action Bar */}
      <div className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1a2234] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {isHi ? 'टीम ज्ञान साझाकरण एवं एनोटेशन' : 'Team Knowledge Sharing & Historical Annotations'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/30">
                {annotations.length} {isHi ? 'नोट्स दर्ज' : 'Notes Logged'}
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {isHi
              ? 'विशिष्ट ऐतिहासिक वैज्ञानिक रिपोर्टों पर अस्थायी नोट्स, विसंगति मार्कर और अनुसंधान परिकल्पनाएँ जोड़ें'
              : 'Add persistent team markers, anomaly flags, and hypotheses across historical lattice runs for seamless collaborative review'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Add New Annotation Button */}
          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 rounded bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHi ? 'नया नोट / मार्कर जोड़ें' : 'Add Note / Marker'}</span>
          </button>

          {/* Export Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 hover:text-white border border-[#2a3854] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Download team annotations summary as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>{isHi ? 'एक्सपोर्ट (.md)' : 'Export Brief'}</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="p-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 hover:text-white border border-[#2a3854] text-xs font-mono transition cursor-pointer"
            title="Copy all notes to clipboard"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Active Filter Pill if filtered by specific report */}
      {activeReportIdFilter && (
        <div className="bg-[#1a2234]/60 px-3.5 py-2 rounded-lg border border-[#00f2ff]/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="text-gray-300">
              {isHi ? 'फ़िल्टर सक्रिय:' : 'Filtering annotations for:'}
            </span>
            <span className="text-[#00f2ff] font-bold">
              {history.find((h) => h.id === activeReportIdFilter)?.presetName || `Report #${activeReportIdFilter}`}
            </span>
          </div>
          {onClearReportFilter && (
            <button
              type="button"
              onClick={onClearReportFilter}
              className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
            >
              {isHi ? 'सभी नोट्स दिखाएँ' : 'Show All Reports'}
            </button>
          )}
        </div>
      )}

      {/* Add New Annotation Drawer Form */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateAnnotation}
          className="bg-[#050810] p-4 rounded-xl border border-[#a855f7]/50 shadow-2xl space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1a2234]">
            <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#a855f7]" />
              {isHi ? 'ऐतिहासिक रिपोर्ट पर नोट या मार्कर जोड़ें' : 'Attach Note / Marker to Historical Report'}
            </h4>
            <span className="text-[10px] font-mono text-gray-400">
              {isHi ? 'सहयोगी टीम समीक्षा' : 'Peer Knowledge Exchange'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Report Selector */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                {isHi ? 'लक्षित रिपोर्ट चुनें' : 'Target Historical Report'}
              </label>
              <select
                value={targetReportId}
                onChange={(e) => setTargetReportId(e.target.value)}
                className="w-full bg-[#0a0f1d] text-gray-200 text-xs font-mono p-2 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7] cursor-pointer"
              >
                <option value="current">Current Workstation Run (Active)</option>
                {history.map((h, i) => (
                  <option key={h.id} value={h.id}>
                    #{i + 1} {h.presetName || `Run ${h.id.slice(-6)}`} ({new Date(h.timestamp).toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Marker Type Selector */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                {isHi ? 'मार्कर का प्रकार' : 'Marker Classification'}
              </label>
              <select
                value={newMarkerType}
                onChange={(e) => setNewMarkerType(e.target.value as AnnotationMarkerType)}
                className="w-full bg-[#0a0f1d] text-gray-200 text-xs font-mono p-2 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7] cursor-pointer"
              >
                {Object.entries(MARKER_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {isHi ? config.hindiLabel : config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pinned Dimension Selector */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                {isHi ? 'संबंधित आयाम (वैकल्पिक)' : 'Anchor Dimension (Optional)'}
              </label>
              <select
                value={newPinnedDim}
                onChange={(e) => setNewPinnedDim(e.target.value)}
                className="w-full bg-[#0a0f1d] text-gray-200 text-xs font-mono p-2 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7] cursor-pointer"
              >
                <option value="General">General / Global Lattice</option>
                {DIMENSION_METADATA.map((d) => (
                  <option key={d.id} value={`D${d.id}`}>
                    D{d.id} ({d.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Author Name with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                {isHi ? 'लेखक / टीम सदस्य' : 'Author / Team Specialist'}
              </label>
              <div className="flex items-center space-x-1.5">
                {AUTHOR_PRESETS.slice(0, 3).map((authorPreset) => (
                  <button
                    key={authorPreset}
                    type="button"
                    onClick={() => setNewAuthor(authorPreset)}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 hover:text-white cursor-pointer"
                  >
                    {authorPreset.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="e.g. Dr. Sen, Climate Analyst"
              className="w-full bg-[#0a0f1d] text-gray-200 text-xs font-mono p-2 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          {/* Note Content Textarea */}
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              {isHi ? 'टिप्पणी / अवलोकन / ज्ञान बिंदु' : 'Observation / Note / Knowledge Point'}
            </label>
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={
                isHi
                  ? 'उदा. D4 मृदा कार्बन में अप्रत्याशित विचलन देखा गया। क्या यह परिदृश्य 2 के समान ताप वृद्धि से जुड़ा है?'
                  : 'e.g. D4 Soil Carbon indicates anomalous amplitude surge (+12%). Correlates with thermal deficit seen in previous simulation.'
              }
              className="w-full bg-[#0a0f1d] text-gray-200 text-xs font-mono p-2.5 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7] resize-y"
            />
          </div>

          {formError && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit / Cancel buttons */}
          <div className="flex justify-end gap-2 text-xs font-mono pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-300 cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              {isHi ? 'टिप्पणी सहेजें' : 'Save Annotation'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0a0f1d] p-3 rounded-xl border border-[#1a2234]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? 'नोट्स, लेखक या आयाम खोजें...' : 'Search notes, authors, or dimensions...'}
            className="w-full bg-[#050810] text-gray-200 text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        {/* Marker Type Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-[#050810] text-gray-300 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[#1a2234] focus:outline-none focus:border-[#a855f7] cursor-pointer"
          >
            <option value="ALL">All Marker Types</option>
            {Object.entries(MARKER_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Show Resolved Checkbox */}
          <label className="flex items-center space-x-1.5 text-xs font-mono text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded bg-[#050810] border-[#1a2234] text-[#a855f7] focus:ring-0"
            />
            <span>{isHi ? 'हल किए गए दिखाएँ' : 'Show Resolved'}</span>
          </label>
        </div>
      </div>

      {/* Annotations List */}
      {filteredAnnotations.length === 0 ? (
        <div className="bg-[#0a0f1d] p-8 rounded-xl border border-dashed border-[#1a2234] text-center space-y-2">
          <Bookmark className="w-8 h-8 text-gray-600 mx-auto" />
          <div className="text-xs font-mono text-gray-400 font-bold">
            {isHi ? 'कोई टिप्पणी या मार्कर नहीं मिला' : 'No Annotations Found Matching Criteria'}
          </div>
          <p className="text-[11px] font-mono text-gray-500 max-w-sm mx-auto">
            {isHi
              ? 'ऐतिहासिक रिपोर्टों पर मार्कर जोड़ने हेतु ऊपर "नया नोट / मार्कर जोड़ें" बटन दबाएँ।'
              : 'Add your first observation or team hypothesis using the button above to begin collaborative knowledge sharing.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="mt-2 px-3 py-1.5 rounded bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#c084fc] border border-[#a855f7]/40 text-xs font-mono font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHi ? 'पहला नोट बनाएँ' : 'Create First Annotation'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnotations.map((ann) => {
            const config = MARKER_CONFIGS[ann.markerType] || MARKER_CONFIGS.FLAG;
            const Icon = config.icon;

            return (
              <div
                key={ann.id}
                className={`bg-[#0a0f1d] p-4 rounded-xl border transition group ${
                  ann.resolved
                    ? 'border-gray-800 opacity-60'
                    : 'border-[#1a2234] hover:border-[#a855f7]/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1a2234]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Marker Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1.5 ${config.bgClass} ${config.textClass} ${config.borderClass}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{isHi ? config.hindiLabel : config.label}</span>
                    </span>

                    {/* Anchor Dimension Badge if present */}
                    {ann.pinnedDimension && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#050810] text-[#00f2ff] border border-[#00f2ff]/30">
                        {ann.pinnedDimension}
                      </span>
                    )}

                    {/* Target Report Title / Link */}
                    <div className="text-xs font-mono font-semibold text-white flex items-center gap-1">
                      <span>{ann.reportTitle || `Report #${ann.reportId}`}</span>
                      {onSelectHistoricalReport && ann.reportId !== 'current' && (
                        <button
                          type="button"
                          onClick={() => onSelectHistoricalReport(ann.reportId)}
                          className="text-[#00f2ff] hover:text-white p-0.5 transition cursor-pointer"
                          title="Open and inspect this historical report"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Author & Timestamp */}
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                    <span className="flex items-center gap-1 text-gray-300">
                      <User className="w-3 h-3 text-[#a855f7]" />
                      {ann.author}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Note Body */}
                <div className="py-2.5 text-xs font-mono text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {ann.text}
                </div>

                {/* Annotation Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1a2234]/70 text-[10px] font-mono">
                  {/* Resolve / Unresolve Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleResolveAnnotation(ann.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition cursor-pointer ${
                      ann.resolved
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-[#1a2234] hover:bg-[#25324d] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {ann.resolved
                        ? isHi
                          ? 'सत्यापित / हल किया गया'
                          : 'Resolved & Verified'
                        : isHi
                        ? 'सत्यापित चिह्नित करें'
                        : 'Mark as Verified'}
                    </span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {/* Copy Note */}
                    <button
                      type="button"
                      onClick={() => handleCopyAnnotation(ann)}
                      className="p-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-400 hover:text-white transition cursor-pointer"
                      title="Copy note"
                    >
                      {copiedId === ann.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Delete Note */}
                    <button
                      type="button"
                      onClick={() => onDeleteAnnotation(ann.id)}
                      className="p-1.5 rounded bg-[#1a2234] hover:bg-rose-950 text-gray-400 hover:text-rose-300 hover:border-rose-800 transition cursor-pointer"
                      title="Delete annotation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
