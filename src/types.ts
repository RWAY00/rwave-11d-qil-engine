export interface ComplexNumber {
  re: number;
  im: number;
}

export interface DimensionInfo {
  id: number;
  key: string;
  name: string;
  hindiName: string;
  description: string;
  unit: string;
  defaultValue: number;
  category: 'hydrosphere' | 'atmosphere' | 'energy' | 'biosphere' | 'cryosphere' | 'anthroposphere' | 'lithosphere';
}

export interface QILComputationResult {
  rawInput: number[];
  paddedStateVector: number[];
  evolvedState: ComplexNumber[];
  probabilityDensity: number[];
  normalizedOutput: number[];
  phaseAngles: number[];
  entropy: number;
  hermitianError: number;
  sumProbability: number;
  timestamp: string;
  seed: number;
}

export interface ScientificInsightResult {
  coordinatesFormatted: string;
  mathematicalCoordinates: { dim: string; label: string; value: number }[];
  insightText: string;
  deterministicPrediction?: string;
  actionableSolution?: string;
  riskAssessment?: {
    level: 'CRITICAL' | 'ELEVATED' | 'BALANCED' | 'OPTIMAL';
    focalDimension: string;
    stabilityIndex: number;
  };
  generatedAt: string;
}

export interface LabPreset {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  vector: number[];
  seed?: number;
}

export type AnnotationMarkerType = 'ANOMALY' | 'HYPOTHESIS' | 'VERIFIED' | 'CRITICAL_REVIEW' | 'FLAG';

export interface ReportAnnotation {
  id: string;
  reportId: string;
  reportTitle?: string;
  author: string;
  text: string;
  markerType: AnnotationMarkerType;
  pinnedDimension?: string;
  timestamp: string;
  resolved?: boolean;
}

export interface LabHistoryEntry {
  id: string;
  timestamp: string;
  presetName?: string;
  rawInput: number[];
  normalizedOutput: number[];
  insightText: string;
  probabilityDensity?: number[];
  entropy?: number;
  seed?: number;
  riskLevel?: 'CRITICAL' | 'ELEVATED' | 'BALANCED' | 'OPTIMAL';
  stabilityIndex?: number;
  annotations?: ReportAnnotation[];
}

export type OutputUnitSystem = 'LATTICE' | 'SI' | 'IMPERIAL';

export interface ConvertedDimensionValue {
  dimId: number;
  key: string;
  name: string;
  hindiName: string;
  category: string;
  latticeValue: number;
  convertedValue: number;
  formattedValue: string;
  unitSymbol: string;
  unitName: string;
  siValue: number;
  siFormatted: string;
  imperialValue: number;
  imperialFormatted: string;
  conversionFormula: string;
}

export interface BatchVectorInputItem {
  id: string;
  name: string;
  vector: number[];
}

export interface BatchItemResult {
  id: string;
  name: string;
  rawInput: number[];
  computation: QILComputationResult;
  stabilityIndex: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'BALANCED' | 'OPTIMAL';
  dominantDimIndex: number;
  deficitDimIndex: number;
}

export interface BatchAggregatedReport {
  timestamp: string;
  totalVectors: number;
  seed: number;
  avgStabilityIndex: number;
  minStabilityIndex: number;
  maxStabilityIndex: number;
  avgEntropy: number;
  riskCounts: {
    OPTIMAL: number;
    BALANCED: number;
    ELEVATED: number;
    CRITICAL: number;
  };
  dimensionAverages: number[];
  dimensionStdDev: number[];
  dimensionMin: number[];
  dimensionMax: number[];
  dominantFrequency: { [dimIndex: number]: number };
  items: BatchItemResult[];
  aiSynthesis?: string;
}

export type LatticeAlertCategory =
  | 'CRITICAL_RISK'
  | 'EXTREME_VOLATILITY'
  | 'ENTROPY_COLLAPSE'
  | 'DIMENSION_BREACH';

export interface LatticeToastNotification {
  id: string;
  timestamp: string;
  category: LatticeAlertCategory;
  severity: 'critical' | 'warning';
  title: string;
  hindiTitle: string;
  message: string;
  hindiMessage: string;
  stabilityIndex: number;
  entropy: number;
  focalDimensionKey?: string;
  focalDimensionName?: string;
  focalDimensionHindiName?: string;
  focalValue?: number;
  deltaValue?: number;
  dimensionIndex?: number;
  suggestedAction?: 'INSPECT_DIM' | 'STABILIZE' | 'GENERATE_INSIGHT';
  isRead?: boolean;
}

