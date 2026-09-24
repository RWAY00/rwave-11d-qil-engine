import { QILComputationResult, LatticeToastNotification } from '../types';
import { DIMENSION_METADATA } from './quantumEngine';

export type AlertSensitivity = 'high' | 'standard' | 'strict';

interface AlertThresholds {
  criticalStability: number; // Stability index threshold below which Critical alert fires
  maxDeltaShift: number;     // Dimensional delta threshold for extreme volatility
  maxSingleDimAmp: number;   // Single dimension concentration threshold
  extremeRatio: number;      // Peak to trough amplitude polarization ratio
}

const SENSITIVITY_THRESHOLDS: Record<AlertSensitivity, AlertThresholds> = {
  high: {
    criticalStability: 50.0,
    maxDeltaShift: 0.055,
    maxSingleDimAmp: 0.22,
    extremeRatio: 8.0,
  },
  standard: {
    criticalStability: 44.0,
    maxDeltaShift: 0.075,
    maxSingleDimAmp: 0.26,
    extremeRatio: 11.0,
  },
  strict: {
    criticalStability: 38.0,
    maxDeltaShift: 0.105,
    maxSingleDimAmp: 0.32,
    extremeRatio: 15.0,
  },
};

/**
 * Evaluates real-time 11D lattice computation output and returns a toast alert
 * if a critical risk level or extreme dimensional volatility is detected.
 */
export function evaluateLatticeAlerts(
  curr: QILComputationResult,
  prev: QILComputationResult | null,
  sensitivity: AlertSensitivity = 'standard'
): LatticeToastNotification | null {
  if (!curr || !curr.normalizedOutput || curr.normalizedOutput.length < 11) {
    return null;
  }

  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity] || SENSITIVITY_THRESHOLDS.standard;
  const maxPossibleEntropy = 3.45943; // log2(11)
  const stabilityIndex = Math.min(100, Math.max(0, (curr.entropy / maxPossibleEntropy) * 100));

  // 1. Analyze dimension distributions
  let maxVal = -1;
  let maxIdx = 0;
  let minVal = 999;
  let minIdx = 0;

  for (let i = 0; i < curr.normalizedOutput.length; i++) {
    const val = curr.normalizedOutput[i];
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
    if (val < minVal) {
      minVal = val;
      minIdx = i;
    }
  }

  const peakToTroughRatio = minVal > 1e-6 ? maxVal / minVal : 999;
  const focalDim = DIMENSION_METADATA[maxIdx] || {
    key: `D${maxIdx + 1}`,
    name: `Dimension ${maxIdx + 1}`,
    hindiName: `आयाम ${maxIdx + 1}`,
  };

  // 2. Check for Sudden Delta Shock (Extreme Volatility between consecutive frames)
  if (prev && prev.normalizedOutput && prev.normalizedOutput.length === curr.normalizedOutput.length) {
    let maxDelta = 0;
    let maxDeltaIdx = 0;
    let deltaSign = 1;

    for (let i = 0; i < curr.normalizedOutput.length; i++) {
      const delta = curr.normalizedOutput[i] - prev.normalizedOutput[i];
      const absDelta = Math.abs(delta);
      if (absDelta > maxDelta) {
        maxDelta = absDelta;
        maxDeltaIdx = i;
        deltaSign = delta >= 0 ? 1 : -1;
      }
    }

    if (maxDelta >= thresholds.maxDeltaShift) {
      const shockDim = DIMENSION_METADATA[maxDeltaIdx];
      const signStr = deltaSign > 0 ? '+' : '-';
      const pctShift = (maxDelta * 100).toFixed(1);

      return {
        id: `vol-${Date.now()}-${shockDim.key}`,
        timestamp: new Date().toISOString(),
        category: 'EXTREME_VOLATILITY',
        severity: maxDelta >= thresholds.maxDeltaShift * 1.4 ? 'critical' : 'warning',
        title: `Extreme Dimensional Volatility: ${shockDim.key}`,
        hindiTitle: `अत्यधिक आयामीय अस्थिरता: ${shockDim.key} (${shockDim.hindiName.split(' ')[0]})`,
        message: `${shockDim.name} experienced an abrupt ${signStr}${pctShift}% amplitude flux shift (|Δ| = ${maxDelta.toFixed(4)}).`,
        hindiMessage: `${shockDim.hindiName} में अचानक ${signStr}${pctShift}% का आयामीय विस्थापन दर्ज किया गया (|Δ| = ${maxDelta.toFixed(4)})।`,
        stabilityIndex: Number(stabilityIndex.toFixed(1)),
        entropy: Number(curr.entropy.toFixed(4)),
        focalDimensionKey: shockDim.key,
        focalDimensionName: shockDim.name,
        focalDimensionHindiName: shockDim.hindiName,
        focalValue: curr.normalizedOutput[maxDeltaIdx],
        deltaValue: maxDelta * deltaSign,
        dimensionIndex: maxDeltaIdx,
        suggestedAction: 'INSPECT_DIM',
      };
    }
  }

  // 3. Check for Dimension Specific Critical Breaches (Planetary Emergency Thresholds)
  const d1_hydrosphere = curr.normalizedOutput[0] ?? 0;
  const d11_extraction = curr.normalizedOutput[10] ?? 0;
  const d5_urbanStress = curr.normalizedOutput[4] ?? 0;
  const d9_aerosols = curr.normalizedOutput[8] ?? 0;

  // Severe aquifer collapse under high extraction velocity
  if (d1_hydrosphere < 0.035 && (d11_extraction > 0.14 || d5_urbanStress > 0.14)) {
    const d1Info = DIMENSION_METADATA[0];
    return {
      id: `breach-d1-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'DIMENSION_BREACH',
      severity: 'critical',
      title: 'Critical Aquifer Depletion & Hydrological Strain',
      hindiTitle: 'गंभीर भूजल संकट: जल स्तर सीमा उल्लंघन (Critical Aquifer Breach)',
      message: `Hydrosphere capacity collapsed to ${d1_hydrosphere.toFixed(5)} Ψ while Extraction Velocity is at ${d11_extraction.toFixed(5)} Ψ.`,
      hindiMessage: `भूजल क्षमता घटकर ${d1_hydrosphere.toFixed(5)} Ψ रह गई है, जबकि दोहन गति ${d11_extraction.toFixed(5)} Ψ के उच्च स्तर पर है।`,
      stabilityIndex: Number(stabilityIndex.toFixed(1)),
      entropy: Number(curr.entropy.toFixed(4)),
      focalDimensionKey: d1Info.key,
      focalDimensionName: d1Info.name,
      focalDimensionHindiName: d1Info.hindiName,
      focalValue: d1_hydrosphere,
      dimensionIndex: 0,
      suggestedAction: 'STABILIZE',
    };
  }

  // Extreme Anthropogenic Extraction Velocity Spike
  if (d11_extraction > thresholds.maxSingleDimAmp) {
    const d11Info = DIMENSION_METADATA[10];
    return {
      id: `breach-d11-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'DIMENSION_BREACH',
      severity: 'critical',
      title: 'Hyper-Anthropogenic Extraction Surge',
      hindiTitle: 'अत्यधिक मानवीय संसाधन दोहन गति (Hyper-Extraction Surge)',
      message: `Extraction velocity breached critical threshold at ${d11_extraction.toFixed(5)} Ψ (${(d11_extraction * 100).toFixed(1)}% of total planetary budget).`,
      hindiMessage: `मानव संसाधन दोहन गति क्रांतिक सीमा पार कर ${d11_extraction.toFixed(5)} Ψ पर पहुँच चुकी है।`,
      stabilityIndex: Number(stabilityIndex.toFixed(1)),
      entropy: Number(curr.entropy.toFixed(4)),
      focalDimensionKey: d11Info.key,
      focalDimensionName: d11Info.name,
      focalDimensionHindiName: d11Info.hindiName,
      focalValue: d11_extraction,
      dimensionIndex: 10,
      suggestedAction: 'GENERATE_INSIGHT',
    };
  }

  // 4. Critical Stability Index Collapse (Entropy Depletion)
  if (stabilityIndex <= thresholds.criticalStability) {
    return {
      id: `crit-stab-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'CRITICAL_RISK',
      severity: 'critical',
      title: 'Critical Systemic Risk: Lattice Instability',
      hindiTitle: 'गंभीर प्रणालीगत जोखिम: लैटिस अस्थिरता (Critical Risk)',
      message: `Overall stability index collapsed to ${stabilityIndex.toFixed(1)}% (Shannon entropy ${curr.entropy.toFixed(3)} bits). Non-linear resonance divergence probable.`,
      hindiMessage: `समग्र प्रणाली स्थिरता सूचकांक घटकर ${stabilityIndex.toFixed(1)}% पर आ गया है। अरेखीय विचलन का गंभीर जोखिम।`,
      stabilityIndex: Number(stabilityIndex.toFixed(1)),
      entropy: Number(curr.entropy.toFixed(4)),
      focalDimensionKey: focalDim.key,
      focalDimensionName: focalDim.name,
      focalDimensionHindiName: focalDim.hindiName,
      focalValue: maxVal,
      dimensionIndex: maxIdx,
      suggestedAction: 'GENERATE_INSIGHT',
    };
  }

  // 5. Extreme Dimensional Polarization / Peak-to-Trough Ratio
  if (peakToTroughRatio >= thresholds.extremeRatio && maxVal >= thresholds.maxSingleDimAmp) {
    return {
      id: `polar-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'EXTREME_VOLATILITY',
      severity: 'warning',
      title: `High Dimensional Polarization: ${focalDim.key}`,
      hindiTitle: `उच्च आयामीय ध्रुवीकरण: ${focalDim.key} (${focalDim.hindiName.split(' ')[0]})`,
      message: `Extreme variance detected across lattice. ${focalDim.key} holds ${peakToTroughRatio.toFixed(1)}× higher energy density than baseline minimum.`,
      hindiMessage: `लैटिस में अत्यधिक ध्रुवीकरण दर्ज किया गया। ${focalDim.key} न्यूनतम आयाम से ${peakToTroughRatio.toFixed(1)} गुना अधिक ऊर्जा केंद्रित कर रहा है।`,
      stabilityIndex: Number(stabilityIndex.toFixed(1)),
      entropy: Number(curr.entropy.toFixed(4)),
      focalDimensionKey: focalDim.key,
      focalDimensionName: focalDim.name,
      focalDimensionHindiName: focalDim.hindiName,
      focalValue: maxVal,
      dimensionIndex: maxIdx,
      suggestedAction: 'INSPECT_DIM',
    };
  }

  return null;
}
