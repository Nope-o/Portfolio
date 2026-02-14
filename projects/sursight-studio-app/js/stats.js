// ===== Statistics System =====

import { nearestNote } from './music-math.js';

class StatsSystem {
  constructor() {
    this.lastCalcTime = 0;
    this.calcInterval = 500; // Update every 500ms
  }

  update(pitchHistory, historyDuration) {
    const now = Date.now();
    
    // Throttle updates
    if (now - this.lastCalcTime < this.calcInterval) {
      return;
    }
    this.lastCalcTime = now;

    const recentFreqs = pitchHistory
      .filter(p => p.freq > 0)
      .map(p => p.freq);

    if (recentFreqs.length === 0) {
      this.displayEmpty();
      return;
    }

    // Calculate statistics
    const stats = {
      avgPitch: this.calculateAverage(recentFreqs),
      range: this.calculateRange(recentFreqs),
      vibrato: this.calculateVibrato(recentFreqs, historyDuration),
      stability: this.calculateStability(recentFreqs)
    };

    this.display(stats);
  }

  calculateAverage(freqs) {
    const avg = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
    const note = nearestNote(avg);
    return `${note.name}${note.octave}`;
  }

  calculateRange(freqs) {
    const min = Math.min(...freqs);
    const max = Math.max(...freqs);
    return (max - min).toFixed(1);
  }

  calculateVibrato(freqs, historyDuration) {
    if (freqs.length < 10) return null;

    const avg = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
    let crossings = 0;

    for (let i = 1; i < freqs.length; i++) {
      if ((freqs[i] - avg) * (freqs[i - 1] - avg) < 0) {
        crossings++;
      }
    }

    const vibratoHz = crossings / (historyDuration / 1000) / 2;
    return vibratoHz > 0.5 ? vibratoHz.toFixed(1) : null;
  }

  calculateStability(freqs) {
    const avg = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
    const variance = freqs.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / freqs.length;
    const stdDev = Math.sqrt(variance);
    const stability = Math.max(0, Math.min(100, 100 - stdDev * 5));
    return stability.toFixed(0);
  }

  display(stats) {
    const elements = {
      avgPitch: document.getElementById('avgPitch'),
      pitchRange: document.getElementById('pitchRange'),
      vibratoRate: document.getElementById('vibratoRate'),
      stability: document.getElementById('stability')
    };

    if (elements.avgPitch) elements.avgPitch.textContent = stats.avgPitch;
    if (elements.pitchRange) elements.pitchRange.textContent = `${stats.range}Hz`;
    if (elements.vibratoRate) {
      elements.vibratoRate.textContent = stats.vibrato ? `${stats.vibrato}Hz` : '--';
    }
    if (elements.stability) elements.stability.textContent = `${stats.stability}%`;
  }

  displayEmpty() {
    const elements = {
      avgPitch: document.getElementById('avgPitch'),
      pitchRange: document.getElementById('pitchRange'),
      vibratoRate: document.getElementById('vibratoRate'),
      stability: document.getElementById('stability')
    };

    if (elements.avgPitch) elements.avgPitch.textContent = '--';
    if (elements.pitchRange) elements.pitchRange.textContent = '--';
    if (elements.vibratoRate) elements.vibratoRate.textContent = '--';
    if (elements.stability) elements.stability.textContent = '--';
  }
}

// Create singleton
export const stats = new StatsSystem();

// Make globally accessible
window.stats = stats;
