import { SARGAM_BASE } from './constants.js';
import { nearestNote } from './music-math.js';
import { settings } from './settings.js';

const PROFILE_KEY = 'pitchVisualizerMusicianDNA';
const STABILITY_WINDOW_MS = 1500;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

class PerformanceInsights {
  constructor() {
    this.centsHistory = [];
    this.biasProfile = this.loadBiasProfile();
    this.freqBins = null;
    this.lastPersistAt = 0;
  }

  loadBiasProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch (_) {
      return {};
    }
  }

  saveBiasProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.biasProfile));
    } catch (_) {}
  }

  resetLiveState() {
    this.centsHistory = [];
  }

  ensureFreqBuffer(analyser) {
    const len = analyser?.frequencyBinCount || 0;
    if (!len) return null;
    if (!this.freqBins || this.freqBins.length !== len) {
      this.freqBins = new Float32Array(len);
    }
    return this.freqBins;
  }

  dbToEnergy(db) {
    if (!Number.isFinite(db) || db <= -150) return 0;
    const amp = Math.pow(10, db / 20);
    return amp * amp;
  }

  energyInRange(freqBins, fromBin, toBin) {
    let sum = 0;
    const start = Math.max(0, fromBin);
    const end = Math.min(freqBins.length - 1, toBin);
    for (let i = start; i <= end; i++) {
      sum += this.dbToEnergy(freqBins[i]);
    }
    return sum;
  }

  energyAround(freqBins, centerBin, radius = 1) {
    if (!Number.isFinite(centerBin)) return 0;
    return this.energyInRange(freqBins, centerBin - radius, centerBin + radius);
  }

  computeSpectrumFeatures({ analyser, sampleRate, freq }) {
    const freqBins = this.ensureFreqBuffer(analyser);
    if (!freqBins || !sampleRate || !freq) return null;

    analyser.getFloatFrequencyData(freqBins);
    const binHz = sampleRate / analyser.fftSize;

    const totalFrom = Math.round(80 / binHz);
    const totalTo = Math.round(5000 / binHz);
    const totalEnergy = this.energyInRange(freqBins, totalFrom, totalTo) + 1e-9;

    let harmonicEnergy = 0;
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      const harmonicHz = freq * harmonic;
      if (harmonicHz > 5000) break;
      const bin = Math.round(harmonicHz / binHz);
      harmonicEnergy += this.energyAround(freqBins, bin, 1);
    }

    const upperBand = this.energyInRange(
      freqBins,
      Math.round(1800 / binHz),
      Math.round(5000 / binHz)
    );

    return {
      harmonicRatio: clamp(harmonicEnergy / totalEnergy, 0, 1),
      highRatio: clamp(upperBand / totalEnergy, 0, 1)
    };
  }

  computeToneQuality({ features, clarity, rms, rmsGate }) {
    const clarityNorm = clamp((safeNumber(clarity) - 0.25) / 0.75, 0, 1);
    const rmsNorm = clamp((safeNumber(rms) - safeNumber(rmsGate)) / 0.02, 0, 1);

    if (!features) {
      return Math.round(clamp((clarityNorm * 0.7 + rmsNorm * 0.3) * 100, 0, 100));
    }

    const harmonicRatio = clamp(safeNumber(features.harmonicRatio), 0, 1);
    const upperBandRatio = clamp(safeNumber(features.highRatio), 0, 1);
    const breathPenalty = clamp((upperBandRatio - 0.22) / 0.45, 0, 1);

    const score = (harmonicRatio * 0.62 + clarityNorm * 0.23 + rmsNorm * 0.2 - breathPenalty * 0.15) * 100;
    return Math.round(clamp(score, 0, 100));
  }

  pushCents(cents, timestamp) {
    if (!Number.isFinite(cents)) return;
    this.centsHistory.push({ cents, timestamp });
    const cutoff = timestamp - STABILITY_WINDOW_MS;
    while (this.centsHistory.length && this.centsHistory[0].timestamp < cutoff) {
      this.centsHistory.shift();
    }
  }

  computeStability(timestamp) {
    const cutoff = timestamp - STABILITY_WINDOW_MS;
    while (this.centsHistory.length && this.centsHistory[0].timestamp < cutoff) {
      this.centsHistory.shift();
    }
    if (this.centsHistory.length < 5) return 0;

    const values = this.centsHistory.map(item => item.cents);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const absMean = values.reduce((a, b) => a + Math.abs(b), 0) / values.length;
    const variance = values.reduce((acc, value) => {
      const diff = value - mean;
      return acc + diff * diff;
    }, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const score = 100 - stdDev * 2.8 - absMean * 0.75;
    return Math.round(clamp(score, 0, 100));
  }

  updateBiasProfile(swaraIndex, cents, timestamp) {
    if (!Number.isFinite(swaraIndex) || swaraIndex < 0 || swaraIndex > 11) return;
    if (!Number.isFinite(cents)) return;

    const key = String(swaraIndex);
    const entry = this.biasProfile[key] || { sum: 0, count: 0 };
    entry.sum += cents;
    entry.count += 1;

    if (entry.count > 1200) {
      entry.sum *= 0.5;
      entry.count = Math.floor(entry.count * 0.5);
    }

    this.biasProfile[key] = entry;

    if (timestamp - this.lastPersistAt > 2500) {
      this.lastPersistAt = timestamp;
      this.saveBiasProfile();
    }
  }

  getBiasAverage(swaraIndex) {
    const entry = this.biasProfile[String(swaraIndex)];
    if (!entry || !Number.isFinite(entry.count) || entry.count < 5) return null;
    if (!Number.isFinite(entry.sum)) return null;
    return entry.sum / entry.count;
  }

  formatBiasText(name, cents) {
    if (!Number.isFinite(cents)) return `${name}: learning`;
    const mag = Math.abs(cents);
    if (mag < 2) return `${name}: centered`;
    const sign = cents > 0 ? '+' : '-';
    const direction = cents > 0 ? 'sharp' : 'flat';
    return `${name}: ${sign}${mag.toFixed(1)}¢ ${direction}`;
  }

  strongestBias() {
    let best = null;
    Object.keys(this.biasProfile).forEach((key) => {
      const index = parseInt(key, 10);
      const avg = this.getBiasAverage(index);
      if (!Number.isFinite(avg)) return;
      const strength = Math.abs(avg);
      if (strength < 2) return;
      if (!best || strength > best.strength) {
        const swara = SARGAM_BASE.find(item => item.semis === index);
        best = {
          strength,
          text: this.formatBiasText(swara?.name || '--', avg)
        };
      }
    });
    return best;
  }

  update({ analyser, sampleRate, freq, clarity, rms, hasSignal, timestamp }) {
    const now = Number.isFinite(timestamp) ? timestamp : performance.now();
    const rmsGate = (settings.get('rmsGate') || 5) / 1000;

    if (!hasSignal || !freq || !Number.isFinite(freq)) {
      this.computeStability(now);
      const strongest = this.strongestBias();
      return {
        toneQuality: 0,
        stability: 0,
        biasText: strongest ? strongest.text : 'Learning your intonation...',
        biasHint: strongest ? 'Profile memory active' : 'Hold notes steadily'
      };
    }

    const note = nearestNote(freq);
    const features = this.computeSpectrumFeatures({ analyser, sampleRate, freq });
    const toneQuality = this.computeToneQuality({
      features,
      clarity,
      rms,
      rmsGate
    });

    this.pushCents(note.cents, now);
    const stability = this.computeStability(now);

    const saSemi = settings.get('sa') || 0;
    const swaraIndex = ((note.midi - saSemi) % 12 + 12) % 12;
    const swara = SARGAM_BASE.find(item => item.semis === swaraIndex);

    const isBiasSample =
      Number.isFinite(clarity) && clarity >= 0.58 &&
      Number.isFinite(rms) && rms > rmsGate * 1.12 &&
      Math.abs(note.cents) <= 32;

    if (isBiasSample) {
      this.updateBiasProfile(swaraIndex, note.cents, now);
    }

    const currentBias = this.getBiasAverage(swaraIndex);
    const strongest = this.strongestBias();

    return {
      toneQuality,
      stability,
      biasText: this.formatBiasText(swara?.name || '--', currentBias),
      biasHint: strongest ? strongest.text : 'Building your profile'
    };
  }
}

export const performanceInsights = new PerformanceInsights();
window.performanceInsights = performanceInsights;
