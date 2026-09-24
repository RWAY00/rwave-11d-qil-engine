import { ComplexNumber, DimensionInfo, QILComputationResult, LabPreset } from '../types';

export const DIMENSIONS_COUNT = 11;

export const DIMENSION_METADATA: DimensionInfo[] = [
  {
    id: 1,
    key: 'D1',
    name: 'Hydrological Reservoir & Water Table (जल स्तर)',
    hindiName: 'जल स्तर एवं जलाशय संतुलन (D1)',
    description: 'Freshwater aquifer reserves, river basin runoff index, and hydrological distribution variance.',
    unit: 'Index [0-1]',
    defaultValue: 0.85,
    category: 'hydrosphere',
  },
  {
    id: 2,
    key: 'D2',
    name: 'Atmospheric Carbon Density & Flux (कार्बन घनत्व)',
    hindiName: 'कार्बन घनत्व एवं वायुमंडलीय प्रवाह (D2)',
    description: 'CO2e parts per million gradient, methane plumes, and greenhouse radiative forcing factor.',
    unit: 'Index [0-1]',
    defaultValue: 0.42,
    category: 'atmosphere',
  },
  {
    id: 3,
    key: 'D3',
    name: 'Macro-Grid Energy Demand (ऊर्जा मांग)',
    hindiName: 'ऊर्जा मांग एवं ग्रिड भार (D3)',
    description: 'Megawatt baseline load, thermodynamic generation peak, and grid infrastructure strain.',
    unit: 'Index [0-1]',
    defaultValue: 0.63,
    category: 'energy',
  },
  {
    id: 4,
    key: 'D4',
    name: 'Ecological Biome Strain (पारिस्थितिकी दबाव)',
    hindiName: 'पारिस्थितिक दबाव एवं जैव विविधता (D4)',
    description: 'Trophic collapse warning metric, habitat fragmentation rate, and extinction pressure.',
    unit: 'Index [0-1]',
    defaultValue: 0.91,
    category: 'biosphere',
  },
  {
    id: 5,
    key: 'D5',
    name: 'Planetary Albedo & Thermal Equilibrium (तापीय संतुलन)',
    hindiName: 'ग्रहीय परावर्तन एवं तापीय संतुलन (D5)',
    description: 'Surface reflectivity index, urban heat island intensity, and thermal infrared flux.',
    unit: 'Index [0-1]',
    defaultValue: 0.52,
    category: 'atmosphere',
  },
  {
    id: 6,
    key: 'D6',
    name: 'Cryosphere Mass & Sea-Level Momentum (हिममंडल स्थिरता)',
    hindiName: 'हिममंडल स्थिरता एवं समुद्री स्तर (D6)',
    description: 'Glacial volume loss coefficient and oceanic thermal expansion dynamics.',
    unit: 'Index [0-1]',
    defaultValue: 0.38,
    category: 'cryosphere',
  },
  {
    id: 7,
    key: 'D7',
    name: 'Agricultural Biomass & Soil Microbiome (कृषि उपज क्षमता)',
    hindiName: 'मृदा स्वास्थ्य एवं कृषि उपज (D7)',
    description: 'Topsoil organic carbon density, crop drought stress factor, and nitrogen runoff.',
    unit: 'Index [0-1]',
    defaultValue: 0.71,
    category: 'biosphere',
  },
  {
    id: 8,
    key: 'D8',
    name: 'Oceanic Acidification & Salinity (महासागरीय लवणीयता)',
    hindiName: 'महासागरीय लवणीयता व अम्लीयता (D8)',
    description: 'Surface ocean pH balance, thermohaline conveyor stability, and coral calcification.',
    unit: 'Index [0-1]',
    defaultValue: 0.49,
    category: 'hydrosphere',
  },
  {
    id: 9,
    key: 'D9',
    name: 'Aerosol Optical Depth & Dispersion (वायुमंडलीय कण)',
    hindiName: 'एरोसोल एवं कण फैलाव (D9)',
    description: 'PM2.5 tropospheric loading, industrial sulfur aerosol veil, and sunlight scattering.',
    unit: 'Index [0-1]',
    defaultValue: 0.60,
    category: 'atmosphere',
  },
  {
    id: 10,
    key: 'D10',
    name: 'Lithospheric Strain & Crustal Flux (भूतापीय दबाव)',
    hindiName: 'भूगर्भीय तनाव एवं ऊर्जा प्रवाह (D10)',
    description: 'Subsurface thermal gradient, tectonic friction accumulation, and mineral strain.',
    unit: 'Index [0-1]',
    defaultValue: 0.28,
    category: 'lithosphere',
  },
  {
    id: 11,
    key: 'D11',
    name: 'Anthropogenic Extraction Velocity (मानव संसाधन उपभोग)',
    hindiName: 'मानव उपभोग गति एवं संसाधन दोहन (D11)',
    description: 'Rare earth / fossil reserve depletion speed vs circular regenerative throughput.',
    unit: 'Index [0-1]',
    defaultValue: 0.77,
    category: 'anthroposphere',
  },
];

export const LAB_PRESETS: LabPreset[] = [
  {
    id: 'sample_lab',
    title: 'Simulated Lab Field Telemetry (जल स्तर, कार्बन, ऊर्जा मांग)',
    hindiTitle: 'सिम्युलेटेड लैब डेटा (मानक परीक्षण)',
    description: 'The exact sample field telemetry from R-WAVE Universal Intelligence Lab: [0.85, 0.42, 0.63, 0.91]',
    vector: [0.85, 0.42, 0.63, 0.91],
    seed: 42,
  },
  {
    id: 'hydro_crisis',
    title: 'Severe Hydrological Drought & Critical Aquifer Strain',
    hindiTitle: 'गंभीर जल संकट एवं भूजल तनाव',
    description: 'Low water table (0.15), elevated atmospheric heat (0.88), heavy agricultural stress (0.95), and massive extraction velocity (0.90).',
    vector: [0.15, 0.78, 0.82, 0.89, 0.88, 0.25, 0.95, 0.45, 0.65, 0.30, 0.90],
    seed: 101,
  },
  {
    id: 'urban_carbon_spike',
    title: 'Industrial Megacity Carbon & Aerosol Peak',
    hindiTitle: 'औद्योगिक कार्बन एवं एरोसोल शिखर',
    description: 'High carbon density (0.94), extreme grid demand (0.92), intense aerosol loading (0.89), with moderate water levels (0.50).',
    vector: [0.50, 0.94, 0.92, 0.70, 0.81, 0.40, 0.55, 0.62, 0.89, 0.35, 0.84],
    seed: 202,
  },
  {
    id: 'renewable_grid_instability',
    title: 'Renewable Macro-Grid Volatility & Storage Deficit',
    hindiTitle: 'नवीकरणीय ग्रिड अस्थिरता एवं बैकअप कमी',
    description: 'Grid demand volatility (0.96) coupled with high industrial extraction (0.85) and thermal shifts (0.72).',
    vector: [0.65, 0.48, 0.96, 0.58, 0.72, 0.45, 0.60, 0.50, 0.42, 0.31, 0.85],
    seed: 303,
  },
  {
    id: 'regenerative_equilibrium',
    title: 'Balanced Planetary Coherence State',
    hindiTitle: 'संतुलित ग्रहीय साम्यावस्था',
    description: 'Harmonized parameters across hydrosphere, low carbon flux, sustainable grid demand, and preserved biodiversity.',
    vector: [0.55, 0.28, 0.40, 0.22, 0.45, 0.60, 0.50, 0.35, 0.25, 0.20, 0.30],
    seed: 404,
  },
];

// Linear Congruential Generator for reproducible pseudo-random numbers
export function createPRNG(seed: number) {
  let s = Math.abs(seed) || 42;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export class RWave11D_QILEngine {
  public dimensions: number = DIMENSIONS_COUNT;
  public quantumLattice: ComplexNumber[][];
  public seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
    this.quantumLattice = this.generateHermitianLattice(seed);
  }

  /**
   * Generates an 11x11 Hermitian Matrix: H = (M + M^H) / 2
   * where M is a complex matrix. A Hermitian matrix satisfies H = H^H (conjugate transpose),
   * guaranteeing real eigenvalues and strictly deterministic, unitary-preserving quantum operators.
   */
  public generateHermitianLattice(seed: number): ComplexNumber[][] {
    const prng = createPRNG(seed);
    const rawMatrix: ComplexNumber[][] = Array.from({ length: this.dimensions }, () =>
      Array.from({ length: this.dimensions }, () => ({
        re: prng() * 2 - 1,
        im: prng() * 2 - 1,
      }))
    );

    // Compute H = (M + M.conj().T) / 2
    const hermitianLattice: ComplexNumber[][] = Array.from({ length: this.dimensions }, () =>
      Array.from({ length: this.dimensions }, () => ({ re: 0, im: 0 }))
    );

    for (let i = 0; i < this.dimensions; i++) {
      for (let j = 0; j < this.dimensions; j++) {
        const m_ij = rawMatrix[i][j];
        // Conjugate transpose element M_ji*
        const m_ji_conj = {
          re: rawMatrix[j][i].re,
          im: -rawMatrix[j][i].im,
        };

        hermitianLattice[i][j] = {
          re: (m_ij.re + m_ji_conj.re) / 2,
          im: (m_ij.im + m_ji_conj.im) / 2,
        };
      }
    }

    // Strictly enforce diagonal realness: H_ii must have 0 imaginary part
    for (let i = 0; i < this.dimensions; i++) {
      hermitianLattice[i][i].im = 0;
    }

    return hermitianLattice;
  }

  /**
   * Checks Hermitian invariance error: max |H_ij - H_ji*| across all entries.
   * In a perfect Hermitian matrix, this is strictly 0.
   */
  public getHermitianError(): number {
    let maxDiff = 0;
    for (let i = 0; i < this.dimensions; i++) {
      for (let j = 0; j < this.dimensions; j++) {
        const h_ij = this.quantumLattice[i][j];
        const h_ji_conj_re = this.quantumLattice[j][i].re;
        const h_ji_conj_im = -this.quantumLattice[j][i].im;

        const diffRe = Math.abs(h_ij.re - h_ji_conj_re);
        const diffIm = Math.abs(h_ij.im - h_ji_conj_im);
        if (diffRe > maxDiff) maxDiff = diffRe;
        if (diffIm > maxDiff) maxDiff = diffIm;
      }
    }
    return maxDiff;
  }

  /**
   * Computes the deterministic 11D quantum state according to the user's master equation:
   * 1. Pad input vector to length 11 with 0
   * 2. Quantum operator evolution: evolved_state = H . state_vector
   * 3. Probability density: |evolved_state|^2
   * 4. Normalized output: density / sum(density)
   */
  public computeDeterministicState(inputEnvironmentalData: number[]): QILComputationResult {
    // 1. Pad or truncate to 11 dimensions
    const paddedStateVector: number[] = Array.from({ length: this.dimensions }, (_, idx) => {
      return idx < inputEnvironmentalData.length ? (inputEnvironmentalData[idx] ?? 0) : 0;
    });

    // 2. Matrix-vector dot product: evolved_state = H . state_vector
    const evolvedState: ComplexNumber[] = [];
    for (let i = 0; i < this.dimensions; i++) {
      let sumRe = 0;
      let sumIm = 0;
      for (let j = 0; j < this.dimensions; j++) {
        const weight = this.quantumLattice[i][j];
        const val = paddedStateVector[j];
        sumRe += weight.re * val;
        sumIm += weight.im * val;
      }
      evolvedState.push({ re: sumRe, im: sumIm });
    }

    // 3. Probability density and phase angles
    const probabilityDensity: number[] = evolvedState.map((c) => c.re * c.re + c.im * c.im);
    const phaseAngles: number[] = evolvedState.map((c) => Math.atan2(c.im, c.re));

    // 4. Normalization
    const sumDensity = probabilityDensity.reduce((acc, curr) => acc + curr, 0);
    const safeSum = sumDensity > 1e-12 ? sumDensity : 1;
    const normalizedOutput = probabilityDensity.map((p) => p / safeSum);

    // 5. Verification metrics
    const sumProbability = normalizedOutput.reduce((acc, curr) => acc + curr, 0);

    // 6. Shannon Entropy calculation: - sum (p * ln(p))
    let entropy = 0;
    for (const p of normalizedOutput) {
      if (p > 1e-12) {
        entropy -= p * Math.log2(p);
      }
    }

    return {
      rawInput: [...inputEnvironmentalData],
      paddedStateVector,
      evolvedState,
      probabilityDensity,
      normalizedOutput,
      phaseAngles,
      entropy,
      hermitianError: this.getHermitianError(),
      sumProbability,
      timestamp: new Date().toISOString(),
      seed: this.seed,
    };
  }

  /**
   * Formats coordinates into the exact user-specified string:
   * "D1: 0.12345, D2: 0.67890, ... D11: 0.54321"
   */
  public formatMetricsString(normalizedOutput: number[]): string {
    return normalizedOutput.map((val, idx) => `D${idx + 1}: ${val.toFixed(5)}`).join(', ');
  }
}
