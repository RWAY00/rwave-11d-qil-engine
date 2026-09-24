import { QILComputationResult } from '../types';

export interface SoundscapeScale {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  frequencies: number[]; // 11 frequencies in Hz
  notes: string[]; // Note names for display
}

export const SOUNDSCAPE_SCALES: SoundscapeScale[] = [
  {
    id: 'lydian_ethereal',
    name: 'Cosmic Lydian Ethereal',
    hindiName: 'लौकिक लिडियन ईथर',
    description: 'Uplifting celestial modal tuning built on harmonic overtone resonance.',
    frequencies: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0],
    notes: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4'],
  },
  {
    id: 'sacred_solfeggio',
    name: 'Sacred Solfeggio Frequencies',
    hindiName: 'पवित्र सोल्फेगियो आवृत्तियां',
    description: 'Ancient harmonic resonances associated with natural biophysical equilibrium.',
    frequencies: [174.0, 285.0, 396.0, 417.0, 528.0, 639.0, 741.0, 852.0, 963.0, 1074.0, 1185.0],
    notes: ['174 Hz', '285 Hz', '396 Hz', '417 Hz', '528 Hz', '639 Hz', '741 Hz', '852 Hz', '963 Hz', '1074 Hz', '1185 Hz'],
  },
  {
    id: 'celestial_pentatonic',
    name: 'Celestial Pentatonic Meditation',
    hindiName: 'दिव्य पंचक ध्यान',
    description: 'Serene consonant intervals providing smooth, non-dissonant ambient diffusion.',
    frequencies: [110.0, 123.47, 146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0],
    notes: ['A2', 'B2', 'D3', 'E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4'],
  },
  {
    id: 'fibonacci_golden',
    name: 'Fibonacci Golden Ratio (φ)',
    hindiName: 'फाइबोनैचि स्वर्णिम अनुपात',
    description: 'Mathematical microtonal scale scaled by powers of the golden ratio (φ ≈ 1.618).',
    frequencies: [108.0, 121.3, 136.2, 153.0, 175.0, 216.0, 272.5, 349.8, 432.0, 544.9, 699.6],
    notes: ['φ₀ (108)', 'φ₁ (121)', 'φ₂ (136)', 'φ₃ (153)', 'φ₄ (175)', 'φ₅ (216)', 'φ₆ (272)', 'φ₇ (350)', 'φ₈ (432)', 'φ₉ (545)', 'φ₁₀ (700)'],
  },
];

export type SoundscapeTimbre = 'ethereal' | 'crystalline' | 'deep_drone';

interface DimensionVoice {
  osc: OscillatorNode;
  gain: GainNode;
  panner?: StereoPannerNode;
}

class QuantumSynthesizerEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private voices: DimensionVoice[] = [];
  
  // Drone and structural resonance nodes
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private subFilter: BiquadFilterNode | null = null;

  // Peak overtone chime voice
  private peakOsc: OscillatorNode | null = null;
  private peakGain: GainNode | null = null;
  private peakLfo: OscillatorNode | null = null;
  private peakLfoGain: GainNode | null = null;

  // Ambient reverb and delay network
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;

  // Settings
  private activeScaleId: string = 'lydian_ethereal';
  private activeTimbre: SoundscapeTimbre = 'ethereal';
  private masterVolume: number = 0.45;
  private reverbLevel: number = 0.5;
  private soloDimensionIndex: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext(): boolean {
    if (this.ctx) return true;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.buildAudioGraph();
      return true;
    } catch (e) {
      console.error('Web Audio API not supported in this browser', e);
      return false;
    }
  }

  private createSyntheticImpulse(durationSec: number = 3.5, decay: number = 2.8): AudioBuffer | null {
    if (!this.ctx) return null;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const factor = Math.exp(-decay * t);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  private buildAudioGraph() {
    if (!this.ctx) return;

    // Master Dynamics Limiter/Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Real-Time Analyser Node (for FFT and oscilloscope visualizers)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    // Convolver Reverb
    this.reverbNode = this.ctx.createConvolver();
    const impulse = this.createSyntheticImpulse(3.2, 2.5);
    if (impulse) {
      this.reverbNode.buffer = impulse;
    }
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);

    // Stereo Ping-Pong Echo Delay
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.38, this.ctx.currentTime);
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // Delay feedback loop
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.delayNode);
    this.delayGain.connect(this.reverbNode);

    // Reverb and delay wiring to master
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.compressor);
    this.delayGain.connect(this.compressor);

    // Master chain to speakers
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Build Sub-bass Lattice Drone
    this.buildSubBassDrone();

    // Build Peak Overtone Chime Voice
    this.buildPeakChimeVoice();

    // Build 11 Harmonic Voices
    this.buildHarmonicVoices();
  }

  private buildSubBassDrone() {
    if (!this.ctx) return;
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(55.0, this.ctx.currentTime); // A1 fundamental

    this.subFilter = this.ctx.createBiquadFilter();
    this.subFilter.type = 'lowpass';
    this.subFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.subFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.subGain = this.ctx.createGain();
    this.subGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.subOsc.connect(this.subFilter);
    this.subFilter.connect(this.subGain);
    if (this.compressor) {
      this.subGain.connect(this.compressor);
    }
    this.subOsc.start();
  }

  private buildPeakChimeVoice() {
    if (!this.ctx) return;
    this.peakOsc = this.ctx.createOscillator();
    this.peakOsc.type = 'triangle';
    this.peakOsc.frequency.setValueAtTime(880.0, this.ctx.currentTime); // High harmonic

    // LFO for subtle celestial vibrato
    this.peakLfo = this.ctx.createOscillator();
    this.peakLfo.frequency.setValueAtTime(4.5, this.ctx.currentTime); // 4.5 Hz vibrato
    this.peakLfoGain = this.ctx.createGain();
    this.peakLfoGain.gain.setValueAtTime(6.0, this.ctx.currentTime); // 6 Hz detune range

    this.peakLfo.connect(this.peakOsc.frequency);

    this.peakGain = this.ctx.createGain();
    this.peakGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.peakOsc.connect(this.peakGain);
    if (this.reverbNode) {
      this.peakGain.connect(this.reverbNode);
    }
    if (this.compressor) {
      this.peakGain.connect(this.compressor);
    }

    this.peakOsc.start();
    this.peakLfo.start();
  }

  private getOscillatorTypeForTimbre(): OscillatorType {
    switch (this.activeTimbre) {
      case 'crystalline':
        return 'triangle';
      case 'deep_drone':
        return 'sawtooth';
      case 'ethereal':
      default:
        return 'sine';
    }
  }

  private buildHarmonicVoices() {
    if (!this.ctx) return;
    this.voices.forEach((v) => {
      try {
        v.osc.stop();
        v.osc.disconnect();
        v.gain.disconnect();
        if (v.panner) v.panner.disconnect();
      } catch {
        // ignore cleanup
      }
    });
    this.voices = [];

    const scale = this.getCurrentScale();
    const oscType = this.getOscillatorTypeForTimbre();

    for (let i = 0; i < 11; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = oscType;
      const freq = scale.frequencies[i] || 220;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      let panner: StereoPannerNode | undefined;
      if (typeof this.ctx.createStereoPanner === 'function') {
        panner = this.ctx.createStereoPanner();
        // default pan from -0.8 to +0.8 spread across 11 dimensions
        const defaultPan = (i / 10) * 1.6 - 0.8;
        panner.pan.setValueAtTime(defaultPan, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);

        // Dry & Wet paths
        if (this.compressor) panner.connect(this.compressor);
        if (this.reverbNode) panner.connect(this.reverbNode);
        if (this.delayNode && i % 2 === 1) panner.connect(this.delayNode);
      } else {
        osc.connect(gain);
        if (this.compressor) gain.connect(this.compressor);
        if (this.reverbNode) gain.connect(this.reverbNode);
      }

      osc.start();
      this.voices.push({ osc, gain, panner });
    }
  }

  public getCurrentScale(): SoundscapeScale {
    return SOUNDSCAPE_SCALES.find((s) => s.id === this.activeScaleId) || SOUNDSCAPE_SCALES[0];
  }

  public async start(): Promise<boolean> {
    const initialized = this.initContext();
    if (!initialized || !this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isRunning = true;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.2);
    }
    return true;
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;
    this.isRunning = false;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1.0, val));
    if (this.ctx && this.masterGain && this.isRunning) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setScale(scaleId: string) {
    this.activeScaleId = scaleId;
    if (!this.ctx) return;
    const scale = this.getCurrentScale();
    const now = this.ctx.currentTime;
    this.voices.forEach((v, i) => {
      const targetFreq = scale.frequencies[i] || 220;
      v.osc.frequency.setTargetAtTime(targetFreq, now, 0.15);
    });
  }

  public setTimbre(timbre: SoundscapeTimbre) {
    this.activeTimbre = timbre;
    if (!this.ctx) return;
    const oscType = this.getOscillatorTypeForTimbre();
    this.voices.forEach((v) => {
      v.osc.type = oscType;
    });
    if (this.subFilter) {
      if (timbre === 'crystalline') {
        this.subFilter.frequency.setTargetAtTime(260, this.ctx.currentTime, 0.2);
      } else if (timbre === 'deep_drone') {
        this.subFilter.frequency.setTargetAtTime(90, this.ctx.currentTime, 0.2);
      } else {
        this.subFilter.frequency.setTargetAtTime(140, this.ctx.currentTime, 0.2);
      }
    }
  }

  public setReverbLevel(val: number) {
    this.reverbLevel = Math.max(0, Math.min(1.0, val));
    if (this.ctx && this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(this.reverbLevel, this.ctx.currentTime, 0.1);
    }
  }

  public setSoloDimension(dimIndex: number | null) {
    this.soloDimensionIndex = dimIndex;
  }

  public updateFromLattice(computation: QILComputationResult) {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;
    const { normalizedOutput, phaseAngles, entropy } = computation;

    // Find peak resonance dimension
    let maxIdx = 0;
    let maxVal = -1;
    normalizedOutput.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });

    // 1. Update 11 Dimension Voices
    const scale = this.getCurrentScale();
    for (let i = 0; i < 11; i++) {
      const voice = this.voices[i];
      if (!voice) continue;

      const normMag = normalizedOutput[i] || 0;
      let targetGain = Math.min(0.45, Math.pow(normMag * 3.2, 1.25));

      // Solo mode: mute other dimensions or amplify soloed one
      if (this.soloDimensionIndex !== null) {
        if (this.soloDimensionIndex === i) {
          targetGain = Math.min(0.6, targetGain * 1.8 + 0.15);
        } else {
          targetGain *= 0.05;
        }
      }

      voice.gain.gain.setTargetAtTime(Math.max(0.0001, targetGain), now, 0.12);

      // Phase Angle (-π to +π) maps to Stereo Pan (-0.9 to +0.9)
      if (voice.panner && phaseAngles[i] !== undefined) {
        const panVal = Math.sin(phaseAngles[i]) * 0.85;
        voice.panner.pan.setTargetAtTime(panVal, now, 0.18);
      }
    }

    // 2. Modulate Sub-bass Structural Resonance Drone via Entropy
    if (this.subGain && this.subFilter) {
      // Entropy in QIL typically ranges 1.8 - 3.4 bits
      // Higher entropy opens up the sub-bass cutoff and adds presence
      const baseCutoff = 80 + Math.max(0, (entropy - 1.5)) * 120;
      this.subFilter.frequency.setTargetAtTime(baseCutoff, now, 0.25);

      const subVolume = Math.min(0.32, 0.12 + (maxVal * 0.4));
      this.subGain.gain.setTargetAtTime(subVolume, now, 0.2);
    }

    // 3. Modulate Peak Overtone Chime
    if (this.peakOsc && this.peakGain) {
      const peakFreq = (scale.frequencies[maxIdx] || 220) * 2.0; // One octave above peak
      this.peakOsc.frequency.setTargetAtTime(peakFreq, now, 0.15);

      // Chime volume proportional to peak prominence
      const chimeGain = Math.min(0.25, Math.max(0.001, (maxVal - 0.1) * 0.6));
      this.peakGain.gain.setTargetAtTime(chimeGain, now, 0.2);
    }
  }

  public getAnalyserData(): { frequencies: Uint8Array; waveform: Uint8Array } | null {
    if (!this.analyser) return null;
    const frequencies = new Uint8Array(this.analyser.frequencyBinCount);
    const waveform = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(frequencies);
    this.analyser.getByteTimeDomainData(waveform);
    return { frequencies, waveform };
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      activeScale: this.getCurrentScale(),
      activeScaleId: this.activeScaleId,
      activeTimbre: this.activeTimbre,
      masterVolume: this.masterVolume,
      reverbLevel: this.reverbLevel,
      soloDimensionIndex: this.soloDimensionIndex,
    };
  }

  /**
   * Plays a discreet, high-tech synthesized sonic alert for critical risk or volatility events
   */
  public playAlertSound(severity: 'critical' | 'warning' = 'warning') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const alertCtx = this.ctx || new AudioCtx();
      if (alertCtx.state === 'suspended') {
        alertCtx.resume().catch(() => {});
      }

      const now = alertCtx.currentTime;

      if (severity === 'critical') {
        // Critical: Sub-bass resonance + dissonant interval pulse (diminished 5th alert)
        const osc1 = alertCtx.createOscillator();
        const osc2 = alertCtx.createOscillator();
        const alertGain = alertCtx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(164.81, now); // E3
        osc1.frequency.exponentialRampToValueAtTime(110.0, now + 0.5); // A2 descent

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(233.08, now); // Bb3 (Tritone warning)
        osc2.frequency.exponentialRampToValueAtTime(155.56, now + 0.5);

        alertGain.gain.setValueAtTime(0.0001, now);
        alertGain.gain.linearRampToValueAtTime(0.14, now + 0.04);
        alertGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        // Low-pass filter to keep it dark and non-piercing
        const filter = alertCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        osc1.connect(alertGain);
        osc2.connect(alertGain);
        alertGain.connect(filter);
        filter.connect(alertCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else {
        // Volatility: Dual futuristic frequency chirp (440Hz -> 659Hz harmonic rise)
        const osc = alertCtx.createOscillator();
        const alertGain = alertCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.setValueAtTime(587.33, now + 0.14); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.28); // A5

        alertGain.gain.setValueAtTime(0.0001, now);
        alertGain.gain.linearRampToValueAtTime(0.10, now + 0.02);
        alertGain.gain.exponentialRampToValueAtTime(0.02, now + 0.13);
        alertGain.gain.linearRampToValueAtTime(0.11, now + 0.15);
        alertGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc.connect(alertGain);
        alertGain.connect(alertCtx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Ignore audio policy restriction if user hasn't interacted yet
    }
  }
}

// Singleton Synthesizer Instance
export const quantumSynth = new QuantumSynthesizerEngine();
