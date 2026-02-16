
// ===== Visualization System =====

import { SARGAM_BASE } from './constants.js';
import { nearestNote, midiToFreq, makeSargamMapper, notePartsForMidi, noteNameForMidi } from './music-math.js';

class VisualizationSystem {
  constructor() {
    this.canvases = {
      pitch: null,
      exerciseTimeline: null,
      spectrum: null,
      waveform: null,
      harmonics: null,
      intonationHeatmap: null,
      pitchPractice: null
    };
    this.contexts = {};
    this.timelineDuration = 5000;
    this.currentMidiCenter = 60;
    this.lastValidMidiCenter = 60;
    this.pitchHistory = [];
    this.animationFrame = null;
    this.fpsLimit = 30;
    this.lastFrameTime = 0;
  }

  initialize() {
    // Get canvas elements
    this.canvases.pitch = document.getElementById('pitch');
    this.canvases.exerciseTimeline = document.getElementById('exerciseTimeline');
    this.canvases.spectrum = document.getElementById('spectrum');
    this.canvases.waveform = document.getElementById('waveform');
    this.canvases.harmonics = document.getElementById('harmonics');
    this.canvases.intonationHeatmap = document.getElementById('intonationHeatmap');
    this.canvases.pitchPractice = document.getElementById('pitchPractice');

    // Get contexts
    Object.keys(this.canvases).forEach(key => {
      if (this.canvases[key]) {
        this.contexts[key] = this.canvases[key].getContext('2d');
      }
    });

    // Set up resize handler
    this.setupResize();
    this.fitAllCanvases();
  }

  setupResize() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.fitAllCanvases(), 100);
    });
  }

  fitAllCanvases() {
    Object.keys(this.canvases).forEach(key => {
      if (this.canvases[key]) {
        this.fitCanvas(this.canvases[key]);
      }
    });
  }

  fitCanvas(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  addPitchPoint(freq) {
    const now = performance.now();
    this.pitchHistory.push({ time: now, freq });
    
    // Clean up old history
    this.pitchHistory = this.pitchHistory.filter(
      p => now - p.time < this.timelineDuration
    );
  }

  drawPitchTimeline(canvasKey = 'pitch', exerciseHint = null) {
    const canvas = this.canvases[canvasKey];
    const ctx = this.contexts[canvasKey];
    if (!canvas || !ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const now = performance.now();
    const isLightMode = document.body.classList.contains('light-mode');

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = isLightMode ? '#f8fbff' : '#070b1a';
    ctx.fillRect(0, 0, w, h);

    // Find last valid pitch for centering
    let lastPitch = 0;
    for (let i = this.pitchHistory.length - 1; i >= 0; i--) {
      if (this.pitchHistory[i].freq > 0) {
        lastPitch = this.pitchHistory[i].freq;
        break;
      }
    }

    if (lastPitch > 0) {
      this.lastValidMidiCenter = nearestNote(lastPitch).midi;
    }
    this.currentMidiCenter = this.lastValidMidiCenter;

    // Calculate range
    const minMidi = this.currentMidiCenter - 12;
    const maxMidi = this.currentMidiCenter + 12;
    const pitchRangeMin = midiToFreq(minMidi);
    const pitchRangeMax = midiToFreq(maxMidi);
    const pitchRange = pitchRangeMax - pitchRangeMin;

    // Get sargam mapper
    const saSelect = document.getElementById('saSelect');
    const saRootSemi = saSelect ? parseInt(saSelect.value, 10) : 0;
    const sargamMapper = makeSargamMapper(saRootSemi);

    // Draw grid lines
    ctx.strokeStyle = isLightMode ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let m = minMidi; m <= maxMidi; m++) {
      const freq = midiToFreq(m);
      const y = h - ((freq - pitchRangeMin) / pitchRange) * h;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const { name, octave } = notePartsForMidi(m, saRootSemi);
      const sargamData = sargamMapper(m);

      ctx.fillStyle = isLightMode ? 'rgba(30, 41, 59, 0.78)' : 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`${sargamData.hindi} ${name}${octave}`, 5, y - 2);
    }

    // Draw pitch line
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    if (isLightMode) {
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
      gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.95)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.95)');
    } else {
      gradient.addColorStop(0, 'rgba(110, 231, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(110, 231, 255, 1)');
      gradient.addColorStop(1, 'rgba(167, 139, 250, 1)');
    }

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let started = false;
    let previousTime = 0;
    const gapResetMs = 180;
    for (let i = 0; i < this.pitchHistory.length; i++) {
      const p = this.pitchHistory[i];
      if (p.freq === 0) {
        // Break the path on silence so the graph doesn't connect across gaps.
        started = false;
        previousTime = 0;
        continue;
      }

      const x = w - ((now - p.time) / this.timelineDuration) * w;
      const y = h - ((p.freq - pitchRangeMin) / pitchRange) * h;
      const hasTimeGap = previousTime > 0 && (p.time - previousTime) > gapResetMs;

      if (!started || hasTimeGap) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
      previousTime = p.time;
    }
    ctx.stroke();

    // Auto-tune visualization
    const autoTuneCheckbox = document.getElementById('autoTuneVisualization');
    if (autoTuneCheckbox && autoTuneCheckbox.checked && lastPitch > 0) {
      const targetFreq = nearestNote(lastPitch).targetHz;
      const targetY = h - ((targetFreq - pitchRangeMin) / pitchRange) * h;
      
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(w, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Exercise hint overlay: target note line + current note marker.
    if (exerciseHint && Number.isFinite(exerciseHint.targetMidi)) {
      const targetFreq = midiToFreq(exerciseHint.targetMidi);
      const targetY = h - ((targetFreq - pitchRangeMin) / pitchRange) * h;

      if (targetY >= 0 && targetY <= h) {
        ctx.save();
        ctx.strokeStyle = isLightMode ? 'rgba(245, 158, 11, 0.88)' : 'rgba(251, 191, 36, 0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(w, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        const targetLabel = noteNameForMidi(exerciseHint.targetMidi, saRootSemi);
        ctx.fillStyle = isLightMode ? 'rgba(180, 83, 9, 0.95)' : 'rgba(254, 240, 138, 0.95)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Target ${targetLabel}`, w - 8, Math.max(14, targetY - 4));
        ctx.restore();
      }
    }

    if (exerciseHint && Number.isFinite(exerciseHint.currentMidi)) {
      const currentFreq = midiToFreq(exerciseHint.currentMidi);
      const currentY = h - ((currentFreq - pitchRangeMin) / pitchRange) * h;
      if (currentY >= 0 && currentY <= h) {
        ctx.save();
        ctx.fillStyle = isLightMode ? '#7c3aed' : '#c4b5fd';
        ctx.beginPath();
        ctx.arc(w - 10, currentY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawSpectrum(analyser) {
    const canvas = this.canvases.spectrum;
    const ctx = this.contexts.spectrum;
    if (!canvas || !ctx || !analyser) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(bins);
    const sampleRate = analyser.context?.sampleRate || 48000;
    const nyquist = sampleRate / 2;
    // Focus on the musically useful low-mid band so the graph doesn't look left-compressed.
    const maxDisplayHz = Math.min(4000, nyquist);
    const maxBin = Math.max(32, Math.min(bins.length, Math.floor((maxDisplayHz / nyquist) * bins.length)));

    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, '#a78bfa');
    gradient.addColorStop(0.5, '#6ee7ff');
    gradient.addColorStop(1, '#22c55e');

    ctx.fillStyle = gradient;
    const barW = w / maxBin;

    for (let i = 0; i < maxBin; i++) {
      const v = bins[i] / 255;
      const barH = v * h;
      ctx.fillRect(i * barW, h - barH, barW, barH);
    }

    const showFormants = document.getElementById('showFormants');
    if (showFormants && showFormants.checked) {
      this.drawFormantOverlay(ctx, bins, w, h, sampleRate, maxBin);
    }
  }

  drawFormantOverlay(ctx, bins, w, h, sampleRate, maxBin = bins.length) {
    const nyquist = sampleRate / 2;
    const binHz = nyquist / bins.length;

    // Typical vocal formant region.
    const minHz = 250;
    const maxHz = 3500;
    const minBin = Math.max(2, Math.floor(minHz / binHz));
    const visibleMaxBin = Math.min(maxBin - 3, bins.length - 3, Math.floor(maxHz / binHz));

    const peaks = [];
    for (let i = minBin; i <= visibleMaxBin; i++) {
      const value = bins[i];
      if (value < 50) continue;
      if (value >= bins[i - 1] && value >= bins[i + 1]) {
        peaks.push({ bin: i, value, freq: i * binHz });
      }
    }

    if (peaks.length === 0) return;

    peaks.sort((a, b) => b.value - a.value);
    const selected = [];
    for (const peak of peaks) {
      // Keep candidates sufficiently separated in frequency.
      const isFarEnough = selected.every(p => Math.abs(p.freq - peak.freq) > 150);
      if (isFarEnough) selected.push(peak);
      if (selected.length >= 3) break;
    }

    if (selected.length === 0) return;

    selected.sort((a, b) => a.freq - b.freq);

    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    selected.forEach((peak, idx) => {
      const x = (peak.bin / Math.max(1, maxBin - 1)) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(`F${idx + 1} ${Math.round(peak.freq)}Hz`, x, 4 + idx * 14);
    });

    ctx.restore();
  }

  drawWaveform(analyser) {
    const canvas = this.canvases.waveform;
    const ctx = this.contexts.waveform;
    if (!canvas || !ctx || !analyser) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#6ee7ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceW = w / buf.length;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      const y = (v * 0.5 + 0.5) * h;

      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * sliceW, y);
      }
    }
    ctx.stroke();
  }

  drawPracticeWaveform(analyser) {
    const canvas = this.canvases.pitchPractice;
    const ctx = this.contexts.pitchPractice;
    if (!canvas || !ctx || !analyser) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    // Clear and draw a subtle background for better visibility.
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070b1a';
    ctx.fillRect(0, 0, w, h);

    // Center line helps singers see waveform symmetry while sustaining notes.
    ctx.strokeStyle = 'rgba(110, 231, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#6ee7ff');
    gradient.addColorStop(1, '#a78bfa');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const sliceW = w / buf.length;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      const y = (v * 0.5 + 0.5) * h;

      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * sliceW, y);
      }
    }
    ctx.stroke();
  }

  drawHarmonics(analyser) {
    const showHarmonics = document.getElementById('showHarmonics');
    if (!showHarmonics || !showHarmonics.checked) return;

    const canvas = this.canvases.harmonics;
    const ctx = this.contexts.harmonics;
    if (!canvas || !ctx || !analyser) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(bins);

    ctx.clearRect(0, 0, w, h);

    // Find peaks
    const peaks = [];
    const threshold = 100;
    
    for (let i = 2; i < bins.length - 2; i++) {
      if (bins[i] > threshold && bins[i] > bins[i - 1] && bins[i] > bins[i + 1]) {
        peaks.push({ index: i, value: bins[i] });
      }
    }

    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 8);

    const barW = w / 8;
    const sampleRate = analyser.context.sampleRate;

    topPeaks.forEach((peak, i) => {
      const normalizedH = (peak.value / 255) * h;
      const hue = (i / 8) * 270;
      
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fillRect(i * barW, h - normalizedH, barW - 4, normalizedH);

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      
      const freq = (peak.index / analyser.frequencyBinCount) * (sampleRate / 2);
      ctx.fillText(`${Math.round(freq)}Hz`, i * barW + barW / 2, h - normalizedH - 5);
    });
  }

  drawIntonationHeatmap() {
    const canvas = this.canvases.intonationHeatmap;
    const ctx = this.contexts.intonationHeatmap;
    if (!canvas || !ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const now = performance.now();
    const isLightMode = document.body.classList.contains('light-mode');

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = isLightMode ? '#f8fbff' : '#070b1a';
    ctx.fillRect(0, 0, w, h);

    const leftPad = 56;
    const rightPad = 10;
    const topPad = 10;
    const bottomPad = 30;
    const plotW = Math.max(40, w - leftPad - rightPad);
    const plotH = Math.max(40, h - topPad - bottomPad);

    const rowCount = 12;
    const colCount = Math.max(24, Math.min(72, Math.round(plotW / 12)));
    const rowH = plotH / rowCount;
    const colW = plotW / colCount;

    const centsSums = Array.from({ length: rowCount }, () => Array(colCount).fill(0));
    const counts = Array.from({ length: rowCount }, () => Array(colCount).fill(0));

    const saSelect = document.getElementById('saSelect');
    const saSemi = saSelect ? parseInt(saSelect.value, 10) || 0 : 0;

    for (let i = 0; i < this.pitchHistory.length; i++) {
      const point = this.pitchHistory[i];
      if (!point || point.freq <= 0) continue;

      const age = now - point.time;
      if (age < 0 || age > this.timelineDuration) continue;

      const xNorm = 1 - (age / this.timelineDuration);
      const col = Math.max(0, Math.min(colCount - 1, Math.floor(xNorm * (colCount - 1))));

      const { midi, cents } = nearestNote(point.freq);
      const row = ((midi - saSemi) % 12 + 12) % 12;

      centsSums[row][col] += cents;
      counts[row][col] += 1;
    }

    // Background grid
    ctx.strokeStyle = isLightMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= rowCount; r++) {
      const y = topPad + r * rowH;
      ctx.beginPath();
      ctx.moveTo(leftPad, y);
      ctx.lineTo(leftPad + plotW, y);
      ctx.stroke();
    }
    for (let c = 0; c <= colCount; c += 6) {
      const x = leftPad + c * colW;
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, topPad + plotH);
      ctx.stroke();
    }

    // Draw heat cells
    for (let row = 0; row < rowCount; row++) {
      const drawRow = (rowCount - 1) - row;
      const y = topPad + drawRow * rowH;
      for (let col = 0; col < colCount; col++) {
        const count = counts[row][col];
        if (!count) continue;

        const avgCents = Math.max(-50, Math.min(50, centsSums[row][col] / count));
        const mag = Math.min(1, Math.abs(avgCents) / 50);
        const strength = Math.min(1, 0.35 + mag * 0.65);
        const alpha = Math.min(0.9, 0.22 + Math.min(1, count / 4) * 0.55);

        let hue = 175; // centered/accurate
        if (avgCents < -2) hue = 208;   // flat => blue
        if (avgCents > 2) hue = 22;     // sharp => orange

        ctx.fillStyle = `hsla(${hue}, ${Math.round(75 * strength)}%, ${isLightMode ? 58 : 52}%, ${alpha})`;
        ctx.fillRect(leftPad + col * colW + 0.6, y + 0.6, Math.max(1, colW - 1.2), Math.max(1, rowH - 1.2));
      }
    }

    // Y labels (Sargam relative to Sa)
    const labels = Array.from({ length: 12 }, (_, semis) => {
      const sw = SARGAM_BASE.find(item => item.semis === semis);
      return sw ? sw.hindi : '--';
    });
    ctx.fillStyle = isLightMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(226, 232, 240, 0.85)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let row = 0; row < rowCount; row++) {
      const drawRow = (rowCount - 1) - row;
      const y = topPad + drawRow * rowH + rowH * 0.5;
      ctx.fillText(labels[row], leftPad - 8, y);
    }

    // Bottom axis + legend
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isLightMode ? 'rgba(51, 65, 85, 0.88)' : 'rgba(148, 163, 184, 0.9)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Past', leftPad, topPad + plotH + 8);
    ctx.textAlign = 'right';
    ctx.fillText('Now', leftPad + plotW, topPad + plotH + 8);

    const legendX = leftPad + plotW * 0.33;
    const legendY = topPad + plotH + 8;
    const legendW = Math.min(190, plotW * 0.34);
    const legendH = 8;
    const legend = ctx.createLinearGradient(legendX, legendY, legendX + legendW, legendY);
    legend.addColorStop(0, 'rgba(59, 130, 246, 0.95)');
    legend.addColorStop(0.5, 'rgba(34, 197, 94, 0.9)');
    legend.addColorStop(1, 'rgba(249, 115, 22, 0.95)');
    ctx.fillStyle = legend;
    ctx.fillRect(legendX, legendY, legendW, legendH);
    ctx.strokeStyle = isLightMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(148, 163, 184, 0.35)';
    ctx.strokeRect(legendX, legendY, legendW, legendH);

    ctx.fillStyle = isLightMode ? 'rgba(51, 65, 85, 0.88)' : 'rgba(148, 163, 184, 0.9)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Flat', legendX - 18, legendY - 1);
    ctx.fillText('In tune', legendX + legendW * 0.5, legendY - 1);
    ctx.fillText('Sharp', legendX + legendW + 18, legendY - 1);
  }

  setTimelineDuration(ms) {
    const clamped = Math.max(3000, Math.min(15000, Number(ms) || 5000));
    this.timelineDuration = clamped;
    this.updateZoomDisplay();
  }

  zoomIn() {
    this.setTimelineDuration(this.timelineDuration + 1000);
  }

  zoomOut() {
    this.setTimelineDuration(this.timelineDuration - 1000);
  }

  updateZoomDisplay() {
    const seconds = Math.round(this.timelineDuration / 1000);
    const display = document.getElementById('timelineZoom');
    if (display) {
      display.textContent = `${seconds}s`;
    }

    const historyDuration = document.getElementById('historyDuration');
    if (historyDuration) {
      historyDuration.value = String(seconds);
    }

    const historyDurationVal = document.getElementById('historyDurationVal');
    if (historyDurationVal) {
      historyDurationVal.textContent = `${seconds}s`;
    }

    if (window.settings?.set) {
      window.settings.set('historyDuration', seconds);
    }
  }

  setFPSLimit(fps) {
    this.fpsLimit = fps;
  }

  shouldRenderFrame() {
    const now = performance.now();
    const frameDuration = 1000 / this.fpsLimit;
    
    if (now - this.lastFrameTime >= frameDuration) {
      this.lastFrameTime = now;
      return true;
    }
    return false;
  }

  clearHistory() {
    this.pitchHistory = [];
  }
}

// Create singleton
export const visualization = new VisualizationSystem();

// Make globally accessible
window.visualization = visualization;
