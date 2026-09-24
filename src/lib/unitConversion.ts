import { OutputUnitSystem, ConvertedDimensionValue } from '../types';
import { DIMENSION_METADATA } from './quantumEngine';

export interface UnitSystemMeta {
  id: OutputUnitSystem;
  name: string;
  hindiName: string;
  shortLabel: string;
  badge: string;
  description: string;
  hindiDescription: string;
  iconName: 'Atom' | 'Globe' | 'Ruler';
}

export const UNIT_SYSTEMS: Record<OutputUnitSystem, UnitSystemMeta> = {
  LATTICE: {
    id: 'LATTICE',
    name: 'R-WAVE Quantum Lattice Units',
    hindiName: 'आर-वेव क्वांटम लैटिस इकाइयाँ (Ψ / 𝔏)',
    shortLabel: 'Lattice (Ψ)',
    badge: 'Ψ Amplitude [0-1]',
    description: 'Dimensionless quantum invariant state vector amplitudes preserving strictly unitary conservation (∑P = 1.0000).',
    hindiDescription: 'आयामहीन क्वांटम इनवेरिएंट अवस्था आयाम जो एकात्मक संरक्षण (∑P = 1.0000) को बनाए रखते हैं।',
    iconName: 'Atom',
  },
  SI: {
    id: 'SI',
    name: 'International System of Units (SI Metric)',
    hindiName: 'अंतर्राष्ट्रीय मानक इकाइयाँ (SI मीट्रिक)',
    shortLabel: 'SI Metric',
    badge: 'Metric (km³, GW, W/m², MPa)',
    description: 'Planetary science metric representations calibrated to physical mass, energy, and atmospheric dynamics.',
    hindiDescription: 'भौतिक द्रव्यमान, ऊर्जा प्रवाह और ग्रहीय गतिशीलता हेतु मानक अंतर्राष्ट्रीय मीट्रिक इकाइयाँ।',
    iconName: 'Globe',
  },
  IMPERIAL: {
    id: 'IMPERIAL',
    name: 'Imperial & US Customary Units',
    hindiName: 'इंपीरियल एवं प्रथागत इकाइयाँ (Imperial)',
    shortLabel: 'Imperial',
    badge: 'Imperial (ac-ft, Mhp, BTU, ksi)',
    description: 'Engineering representations in customary volume, mechanical horsepower, and thermal imperial standards.',
    hindiDescription: 'पारंपरिक एकर-फीट, हॉर्सपावर, बीटीयू और प्रति वर्ग इंच दाब आधारित इंजीनियरिंग इकाइयाँ।',
    iconName: 'Ruler',
  },
};

interface DimensionUnitFormula {
  dimId: number;
  si: {
    calc: (val: number) => number;
    unit: string;
    format: (val: number) => string;
    formulaText: string;
  };
  imperial: {
    calc: (val: number) => number;
    unit: string;
    format: (val: number) => string;
    formulaText: string;
  };
}

const DIMENSION_CONVERSION_MAP: Record<number, DimensionUnitFormula> = {
  1: {
    // Hydrosphere: Water Table & Aquifer Reserves
    dimId: 1,
    si: {
      calc: (val) => val * 1500,
      unit: 'km³',
      format: (v) => `${v.toFixed(2)} km³`,
      formulaText: 'Ψ × 1,500 km³ (Aquifer Volume)',
    },
    imperial: {
      calc: (val) => val * 1216.07,
      unit: 'M ac-ft',
      format: (v) => `${v.toFixed(2)} M ac-ft`,
      formulaText: 'Ψ × 1,216.1 Million Acre-Feet',
    },
  },
  2: {
    // Atmosphere: Carbon Density
    dimId: 2,
    si: {
      calc: (val) => 280 + val * 320,
      unit: 'ppm CO₂e',
      format: (v) => `${v.toFixed(1)} ppm`,
      formulaText: '280 + (Ψ × 320) ppm CO₂e',
    },
    imperial: {
      calc: (val) => val * 55.12,
      unit: 'B tons/yr',
      format: (v) => `${v.toFixed(2)} B tons CO₂`,
      formulaText: 'Ψ × 55.12 Billion Short Tons/yr',
    },
  },
  3: {
    // Energy: Grid Demand
    dimId: 3,
    si: {
      calc: (val) => val * 3600,
      unit: 'GW',
      format: (v) => `${v.toFixed(1)} GW`,
      formulaText: 'Ψ × 3,600 Gigawatts',
    },
    imperial: {
      calc: (val) => val * 4827.7,
      unit: 'Mhp',
      format: (v) => `${v.toFixed(1)} Mhp`,
      formulaText: 'Ψ × 4,827.7 Million Horsepower',
    },
  },
  4: {
    // Biosphere: Biome Strain
    dimId: 4,
    si: {
      calc: (val) => val * 120,
      unit: 'E/MSY',
      format: (v) => `${v.toFixed(1)} E/MSY`,
      formulaText: 'Ψ × 120 Extinctions / MSY Stress',
    },
    imperial: {
      calc: (val) => val * 296.5,
      unit: 'M Acres',
      format: (v) => `${v.toFixed(1)} M Acres`,
      formulaText: 'Ψ × 296.5 Million Acres Strained',
    },
  },
  5: {
    // Atmosphere: Planetary Albedo & Thermal
    dimId: 5,
    si: {
      calc: (val) => val * 342.0,
      unit: 'W/m²',
      format: (v) => `${v.toFixed(1)} W/m²`,
      formulaText: 'Ψ × 342.0 W/m² Radiative Flux',
    },
    imperial: {
      calc: (val) => val * 108.41,
      unit: 'BTU/hr·ft²',
      format: (v) => `${v.toFixed(1)} BTU/hr·ft²`,
      formulaText: 'Ψ × 108.41 BTU/(hr·ft²)',
    },
  },
  6: {
    // Cryosphere: Ice Mass & Sea Level
    dimId: 6,
    si: {
      calc: (val) => val * 520.0,
      unit: 'Gt/yr',
      format: (v) => `${v.toFixed(1)} Gt Ice`,
      formulaText: 'Ψ × 520.0 Gigatonnes Ice Melt/yr',
    },
    imperial: {
      calc: (val) => val * 137.3,
      unit: 'cu mi/yr',
      format: (v) => `${v.toFixed(1)} cu mi`,
      formulaText: 'Ψ × 137.3 Cubic Miles Ice/yr',
    },
  },
  7: {
    // Biosphere: Soil Biomass
    dimId: 7,
    si: {
      calc: (val) => val * 160.0,
      unit: 't/ha',
      format: (v) => `${v.toFixed(1)} t/ha`,
      formulaText: 'Ψ × 160.0 Metric Tonnes Carbon/ha',
    },
    imperial: {
      calc: (val) => val * 71.38,
      unit: 'tons/acre',
      format: (v) => `${v.toFixed(1)} tons/ac`,
      formulaText: 'Ψ × 71.38 Short Tons/Acre',
    },
  },
  8: {
    // Hydrosphere: Ocean Salinity & pH
    dimId: 8,
    si: {
      calc: (val) => 32.0 + val * 6.5,
      unit: 'g/kg PSU',
      format: (v) => `${v.toFixed(2)} g/kg`,
      formulaText: '32.0 + (Ψ × 6.5) g/kg (PSU Salinity)',
    },
    imperial: {
      calc: (val) => 32.0 + val * 6.5,
      unit: 'ppt',
      format: (v) => `${v.toFixed(2)} ppt`,
      formulaText: '32.0 + (Ψ × 6.5) Parts per Thousand',
    },
  },
  9: {
    // Atmosphere: Aerosol Loading
    dimId: 9,
    si: {
      calc: (val) => val * 145.0,
      unit: 'µg/m³',
      format: (v) => `${v.toFixed(1)} µg/m³`,
      formulaText: 'Ψ × 145.0 µg/m³ PM2.5 Density',
    },
    imperial: {
      calc: (val) => val * 63.36,
      unit: 'gr/k yd³',
      format: (v) => `${v.toFixed(1)} gr/k yd³`,
      formulaText: 'Ψ × 63.36 Grains / 1,000 cu yd',
    },
  },
  10: {
    // Lithosphere: Crustal Stress
    dimId: 10,
    si: {
      calc: (val) => val * 150.0,
      unit: 'MPa',
      format: (v) => `${v.toFixed(1)} MPa`,
      formulaText: 'Ψ × 150.0 Megapascals Stress',
    },
    imperial: {
      calc: (val) => val * 21.76,
      unit: 'ksi',
      format: (v) => `${v.toFixed(2)} ksi`,
      formulaText: 'Ψ × 21.76 Kilopounds/sq inch (ksi)',
    },
  },
  11: {
    // Anthroposphere: Resource Extraction Velocity
    dimId: 11,
    si: {
      calc: (val) => val * 125.0,
      unit: 'Gt/yr',
      format: (v) => `${v.toFixed(1)} Gt/yr`,
      formulaText: 'Ψ × 125.0 Gt Minerals/Fossils/yr',
    },
    imperial: {
      calc: (val) => val * 137.79,
      unit: 'B tons/yr',
      format: (v) => `${v.toFixed(1)} B tons/yr`,
      formulaText: 'Ψ × 137.79 Billion Short Tons/yr',
    },
  },
};

/**
 * Converts a single dimension amplitude to the requested output unit system.
 */
export function convertDimension(
  dimId: number,
  latticeVal: number,
  system: OutputUnitSystem
): ConvertedDimensionValue {
  const meta = DIMENSION_METADATA.find((d) => d.id === dimId) || {
    id: dimId,
    key: `D${dimId}`,
    name: `Dimension ${dimId}`,
    hindiName: `आयाम ${dimId}`,
    category: 'atmosphere',
    unit: 'Index [0-1]',
  };

  const formula = DIMENSION_CONVERSION_MAP[dimId] || {
    dimId,
    si: {
      calc: (v: number) => v * 100,
      unit: '%',
      format: (v: number) => `${v.toFixed(2)} %`,
      formulaText: 'Ψ × 100 %',
    },
    imperial: {
      calc: (v: number) => v * 100,
      unit: '%',
      format: (v: number) => `${v.toFixed(2)} %`,
      formulaText: 'Ψ × 100 %',
    },
  };

  const siVal = formula.si.calc(latticeVal);
  const siFmt = formula.si.format(siVal);
  const impVal = formula.imperial.calc(latticeVal);
  const impFmt = formula.imperial.format(impVal);

  let convertedValue = latticeVal;
  let formattedValue = `${latticeVal.toFixed(5)} Ψ`;
  let unitSymbol = 'Ψ';
  let unitName = 'Lattice Quantum Invariant';
  let conversionFormula = 'Standard 11D Quantum Normalized Vector (∑P = 1.0000)';

  if (system === 'SI') {
    convertedValue = siVal;
    formattedValue = siFmt;
    unitSymbol = formula.si.unit;
    unitName = `SI Metric (${formula.si.unit})`;
    conversionFormula = formula.si.formulaText;
  } else if (system === 'IMPERIAL') {
    convertedValue = impVal;
    formattedValue = impFmt;
    unitSymbol = formula.imperial.unit;
    unitName = `Imperial (${formula.imperial.unit})`;
    conversionFormula = formula.imperial.formulaText;
  }

  return {
    dimId,
    key: meta.key,
    name: meta.name,
    hindiName: meta.hindiName,
    category: meta.category,
    latticeValue: latticeVal,
    convertedValue,
    formattedValue,
    unitSymbol,
    unitName,
    siValue: siVal,
    siFormatted: siFmt,
    imperialValue: impVal,
    imperialFormatted: impFmt,
    conversionFormula,
  };
}

/**
 * Converts all 11 dimensions in a normalized output vector into the requested unit system.
 */
export function convertAllDimensions(
  normalizedOutput: number[],
  system: OutputUnitSystem
): ConvertedDimensionValue[] {
  return normalizedOutput.map((val, idx) => convertDimension(idx + 1, val, system));
}

/**
 * Generates the clean, one-line verified coordinates string according to the selected unit system.
 */
export function formatCoordinatesString(
  normalizedOutput: number[],
  system: OutputUnitSystem
): string {
  const converted = convertAllDimensions(normalizedOutput, system);

  if (system === 'LATTICE') {
    return converted.map((item) => `${item.key}: ${item.latticeValue.toFixed(5)}`).join(', ');
  }

  return converted.map((item) => `${item.key}: ${item.formattedValue}`).join(', ');
}
