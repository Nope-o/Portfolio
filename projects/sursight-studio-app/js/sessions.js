import { nearestNote, makeSargamMapper, midiToFreq } from './music-math.js';
import { CONFIG } from './constants.js';

const SESSION_STORAGE_KEY = 'pitchSessions';
const LEGACY_STORAGE_KEYS = ['surSightSessions', 'sursightSessions'];

class SessionManager {
  constructor() {
    this.sessions = [];
    this.playbackTimeouts = [];
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.loadSessions();
  }

  getSaSemitone() {
    const saSelect = document.getElementById('saSelect');
    const parsed = saSelect ? parseInt(saSelect.value, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatTimestampForFilename(inputDate) {
    const d = inputDate instanceof Date ? inputDate : new Date(inputDate || Date.now());
    const date = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad2 = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`;
  }

  formatDuration(seconds) {
    const s = Math.max(0, Math.round(parseFloat(seconds) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  escapeCsvValue(value) {
    const text = value == null ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadCsv(filename, headers, rows) {
    const csvText = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvText}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(filename, blob);
  }

  getFrequencyBounds(data) {
    const freqs = data.map((d) => Number(d.freq)).filter((f) => Number.isFinite(f) && f > 0);
    if (freqs.length === 0) return { min: 100, max: 400 };

    let min = Math.min(...freqs);
    let max = Math.max(...freqs);
    if (max - min < 1) {
      const center = (max + min) / 2;
      min = center - 0.5;
      max = center + 0.5;
    }
    const pad = (max - min) * 0.08;
    return { min: Math.max(0, min - pad), max: max + pad };
  }

  getTimeTicks(durationSec, target = 7) {
    if (!Number.isFinite(durationSec) || durationSec <= 0) return [0];
    const roughStep = durationSec / Math.max(2, target);
    const steps = [0.25, 0.5, 1, 2, 5, 10, 15, 20, 30, 60, 120, 180];
    const step = steps.find((s) => s >= roughStep) || Math.ceil(roughStep / 60) * 60;
    const ticks = [];
    for (let t = 0; t <= durationSec + 1e-9; t += step) {
      ticks.push(Number(t.toFixed(3)));
    }
    if (ticks[ticks.length - 1] < durationSec) {
      ticks.push(Number(durationSec.toFixed(3)));
    }
    return ticks;
  }

  formatTimeTick(seconds, step) {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    if (step < 1) return `${seconds.toFixed(1)}s`;
    return `${Math.round(seconds)}s`;
  }

  getYAxisNoteTicks(freqBounds, maxTickCount = 8) {
    const minMidi = nearestNote(freqBounds.min).midi;
    const maxMidi = nearestNote(freqBounds.max).midi;
    const allTicks = [];

    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
      allTicks.push({ midi, freq: midiToFreq(midi) });
    }

    if (allTicks.length === 0) {
      return [{ midi: minMidi, freq: midiToFreq(minMidi) }];
    }

    const step = Math.max(1, Math.ceil(allTicks.length / Math.max(1, maxTickCount)));
    const reduced = allTicks.filter((_, index) => index % step === 0);
    const last = allTicks[allTicks.length - 1];

    if (reduced[reduced.length - 1]?.midi !== last.midi) {
      reduced.push(last);
    }

    return reduced;
  }

  drawTimelineChart(canvas, data, options = {}) {
    const points = this.normalizeDataPoints(data);
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const compact = Boolean(options.compact);
    const width = options.width || canvas.width || 1200;
    const height = options.height || canvas.height || 640;
    const dpr = options.dpr || (compact ? 1 : Math.min(window.devicePixelRatio || 1, 2));

    canvas.width = Math.max(2, Math.floor(width * dpr));
    canvas.height = Math.max(2, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = compact
      ? {
          background: 'rgba(7, 11, 26, 0.75)',
          grid: 'rgba(148, 163, 184, 0.18)',
          axis: 'rgba(226, 232, 240, 0.85)',
          text: '#d1d9e6',
          line: '#6ee7ff'
        }
      : {
          background: '#ffffff',
          grid: '#e5e7eb',
          axis: '#111827',
          text: '#111827',
          line: '#0ea5e9'
        };

    const pad = compact
      ? { left: 34, right: 10, top: 10, bottom: 20 }
      : { left: 160, right: 24, top: 56, bottom: 70 };

    const plotW = Math.max(1, width - pad.left - pad.right);
    const plotH = Math.max(1, height - pad.top - pad.bottom);
    const maxTimeMs = points[points.length - 1].time;
    const durationSec = Math.max(0.1, maxTimeMs / 1000);
    const freqBounds = this.getFrequencyBounds(points);
    const freqRange = Math.max(1e-9, freqBounds.max - freqBounds.min);
    const x = (timeMs) => pad.left + (Math.max(0, timeMs) / (durationSec * 1000)) * plotW;
    const y = (freq) => pad.top + ((freqBounds.max - freq) / freqRange) * plotH;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);

    const timeTicks = this.getTimeTicks(durationSec, compact ? 4 : 8);
    const timeStep = timeTicks.length > 1 ? timeTicks[1] - timeTicks[0] : 1;

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    timeTicks.forEach((tick) => {
      const px = x(tick * 1000);
      ctx.beginPath();
      ctx.moveTo(px, pad.top);
      ctx.lineTo(px, pad.top + plotH);
      ctx.stroke();
      if (!compact) {
        ctx.fillStyle = palette.text;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.formatTimeTick(tick, timeStep), px, pad.top + plotH + 8);
      }
    });

    if (compact) {
      const yTickCount = 3;
      for (let i = 0; i <= yTickCount; i += 1) {
        const ratio = i / yTickCount;
        const tickFreq = freqBounds.min + ratio * freqRange;
        const py = y(tickFreq);
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(pad.left + plotW, py);
        ctx.stroke();
      }
    } else {
      const sargamMapper = makeSargamMapper(this.getSaSemitone());
      const noteTicks = this.getYAxisNoteTicks(freqBounds, 8);
      noteTicks.forEach(({ midi, freq }) => {
        const py = y(freq);
        const sg = sargamMapper(midi);
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(pad.left + plotW, py);
        ctx.stroke();

        ctx.fillStyle = palette.text;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${sg.hindi || '--'} ${sg.name || '--'}`, pad.left - 10, py);
      });
    }

    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = compact ? 1 : 1.2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    const avgGapMs = points.length > 1 ? maxTimeMs / (points.length - 1) : 0;
    const gapThreshold = Math.max(300, avgGapMs * 6);

    ctx.strokeStyle = palette.line;
    ctx.lineWidth = compact ? 1.6 : 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    let prevTime = null;
    points.forEach((point) => {
      const px = x(point.time);
      const py = y(point.freq);
      if (prevTime === null || point.time - prevTime > gapThreshold) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
      prevTime = point.time;
    });
    ctx.stroke();

    if (!compact) {
      ctx.fillStyle = palette.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '600 20px sans-serif';
      ctx.fillText(options.title || 'Pitch Timeline', pad.left, 30);
      ctx.font = '13px sans-serif';
      ctx.fillText(options.subtitle || `Duration ${durationSec.toFixed(2)}s • ${points.length} points`, pad.left, 48);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '13px sans-serif';
      ctx.fillText('Time (seconds)', pad.left + plotW / 2, height - 28);

      ctx.save();
      ctx.translate(24, pad.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Notes (Hindi • English)', 0, 0);
      ctx.restore();
    }
  }

  renderTimelinePreviews(container) {
    container.querySelectorAll('.session-timeline-mini[data-session-id]').forEach((canvas) => {
      const sessionId = Number(canvas.dataset.sessionId);
      const session = this.sessions.find((item) => item.id === sessionId);
      if (!session || !Array.isArray(session.data) || session.data.length === 0) return;
      this.drawTimelineChart(canvas, session.data, {
        compact: true,
        width: canvas.width || 420,
        height: canvas.height || 110
      });
    });
  }

  exportSessionTimelineImage(session, baseFilename) {
    const canvas = document.createElement('canvas');
    this.drawTimelineChart(canvas, session.data, {
      compact: false,
      width: 1600,
      height: 900,
      title: `Session Timeline • ${new Date(session.date).toLocaleString()}`,
      subtitle: `X-axis = Time (seconds) | Avg ${session.avgFreq} Hz | Range ${session.range} Hz`
    });

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) this.downloadBlob(`${baseFilename}_timeline.png`, blob);
      }, 'image/png');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${baseFilename}_timeline.png`;
    a.click();
  }

  normalizeDataPoints(rawData) {
    if (!Array.isArray(rawData)) return [];
    return rawData
      .map((point) => ({
        time: Number(point?.time),
        freq: Number(point?.freq),
        clarity: Number(point?.clarity) || 0,
        rms: Number(point?.rms) || 0
      }))
      .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.freq) && point.freq > 0)
      .sort((a, b) => a.time - b.time);
  }

  buildSessionFromData(raw) {
    const data = this.normalizeDataPoints(raw?.data || []);
    if (data.length === 0) return null;

    const freqs = data.map((d) => d.freq);
    const avgFreq = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
    const minFreq = Math.min(...freqs);
    const maxFreq = Math.max(...freqs);
    const range = maxFreq - minFreq;
    const avgClarity = data.reduce((sum, d) => sum + d.clarity, 0) / data.length;
    const avgRms = data.reduce((sum, d) => sum + d.rms, 0) / data.length;
    const avgNote = nearestNote(avgFreq);
    const duration = data[data.length - 1].time / 1000;

    return {
      id: Number.isFinite(Number(raw?.id)) ? Number(raw.id) : Date.now(),
      date: raw?.date || new Date().toISOString(),
      duration: duration.toFixed(2),
      avgNote: `${avgNote.name}${avgNote.octave}`,
      avgFreq: avgFreq.toFixed(2),
      minFreq: minFreq.toFixed(2),
      maxFreq: maxFreq.toFixed(2),
      range: range.toFixed(2),
      avgClarity: avgClarity.toFixed(3),
      avgRms: avgRms.toFixed(4),
      dataPoints: data.length,
      data
    };
  }

  loadSessions() {
    try {
      const keysToTry = [SESSION_STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
      let parsed = [];

      for (const key of keysToTry) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        const candidate = JSON.parse(stored);
        if (Array.isArray(candidate)) {
          parsed = candidate;
          if (key !== SESSION_STORAGE_KEY) {
            localStorage.setItem(SESSION_STORAGE_KEY, stored);
          }
          break;
        }
      }

      this.sessions = parsed
        .map((s) => this.buildSessionFromData(s))
        .filter(Boolean)
        .slice(0, CONFIG.MAX_SESSIONS);
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessions = [];
    }
  }

  saveSessions() {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
      alert('Failed to save session. Storage may be full.');
    }
  }

  saveSession(recordedData) {
    if (!recordedData || recordedData.length === 0) return;
    const session = this.buildSessionFromData({ data: recordedData, date: new Date().toISOString(), id: Date.now() });
    if (!session) return;

    this.sessions.unshift(session);
    if (this.sessions.length > CONFIG.MAX_SESSIONS) {
      this.sessions.length = CONFIG.MAX_SESSIONS;
    }

    this.saveSessions();
    this.renderSessions();
  }

  renderSessions() {
    const container = document.getElementById('sessionsList');
    if (!container) return;

    if (this.sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No recordings yet</h3>
          <p>Click "Record" while the microphone is active to capture your practice sessions</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.sessions.map((s) => {
      const playingThis = this.isPlaying && this.currentPlaybackId === s.id;
      const sessionDate = new Date(s.date);
      const sessionName = Number.isNaN(sessionDate.getTime())
        ? 'Session'
        : `Session ${sessionDate.toLocaleString()}`;

      return `
        <div class="session-item">
          <div class="session-info">
            <div class="session-name">${sessionName}</div>
            <div class="session-meta">Duration ${this.formatDuration(s.duration)} • ${s.dataPoints || 0} points</div>
            <div class="session-grid">
              <div class="session-metric">
                <span class="label">Avg Note</span>
                <span class="value">${s.avgNote || '--'}</span>
              </div>
              <div class="session-metric">
                <span class="label">Avg Freq</span>
                <span class="value">${s.avgFreq || '--'} Hz</span>
              </div>
              <div class="session-metric">
                <span class="label">Range</span>
                <span class="value">${s.range || '--'} Hz</span>
              </div>
              <div class="session-metric">
                <span class="label">Clarity</span>
                <span class="value">${s.avgClarity || '--'}</span>
              </div>
            </div>
            <canvas class="session-timeline-mini" data-session-id="${s.id}" width="420" height="110" aria-label="Timeline preview for this session"></canvas>
          </div>
          <div class="session-actions">
            <button class="icon-btn" onclick="sessions.togglePlayback(${s.id})" aria-label="${playingThis ? 'Stop playback' : 'Play session'}" title="${playingThis ? 'Stop playback' : 'Play session'}">
              ${playingThis ? '⏹️ Stop' : '▶️ Play'}
            </button>
            <button class="icon-btn" onclick="sessions.downloadSession(${s.id})" aria-label="Export this session" title="Export this session to Excel-compatible CSV">⬇️ Export</button>
            <button class="icon-btn" onclick="sessions.deleteSession(${s.id})" aria-label="Delete session" title="Delete session">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
    this.renderTimelinePreviews(container);
  }

  togglePlayback(id) {
    if (this.isPlaying && this.currentPlaybackId === id) {
      this.stopPlayback();
    } else {
      this.playSession(id);
    }
  }

  playSession(id) {
    const session = this.sessions.find((s) => s.id === id);
    if (!session || !Array.isArray(session.data) || session.data.length === 0) return;

    this.stopPlayback();
    this.isPlaying = true;
    this.currentPlaybackId = id;

    if (window.visualization) {
      window.visualization.clearHistory();
    }

    session.data.forEach((d) => {
      const timeout = setTimeout(() => {
        if (window.visualization) {
          window.visualization.addPitchPoint(d.freq);
          window.visualization.drawPitchTimeline();
        }

        if (window.ui) {
          window.ui.updateReadout(d.freq, d.clarity, d.rms);
        }
      }, d.time);

      this.playbackTimeouts.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      if (this.currentPlaybackId === id) {
        this.stopPlayback();
      }
    }, parseFloat(session.duration || 0) * 1000 + 120);

    this.playbackTimeouts.push(endTimeout);
    this.renderSessions();
  }

  stopPlayback() {
    this.playbackTimeouts.forEach((t) => clearTimeout(t));
    this.playbackTimeouts = [];
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.renderSessions();
  }

  buildSessionPointRows(session, sessionNumber, sargamMapper) {
    return session.data.map((d, index) => {
      const note = nearestNote(d.freq);
      const sargam = sargamMapper(note.midi);
      return [
        sessionNumber,
        session.id,
        session.date,
        this.formatDuration(session.duration),
        session.dataPoints,
        index + 1,
        (d.time / 1000).toFixed(3),
        `${note.name}${note.octave}`,
        note.cents.toFixed(1),
        d.freq.toFixed(2),
        sargam.name || '--',
        sargam.hindi || '--',
        Number(d.clarity || 0).toFixed(3),
        Number(d.rms || 0).toFixed(4),
        session.avgFreq,
        session.minFreq,
        session.maxFreq,
        session.range,
        session.avgClarity,
        session.avgRms
      ];
    });
  }

  downloadSession(id) {
    const session = this.sessions.find((s) => s.id === id);
    if (!session || !Array.isArray(session.data) || session.data.length === 0) return;

    const sargamMapper = makeSargamMapper(this.getSaSemitone());
    const headers = [
      'Point #',
      'Time (s)',
      'Western Note',
      'Cents',
      'Frequency (Hz)',
      'Sargam (English)',
      'Sargam (Hindi)',
      'Clarity',
      'RMS'
    ];
    const rows = session.data.map((d, index) => {
      const n = nearestNote(d.freq);
      const sg = sargamMapper(n.midi);
      return [
        index + 1,
        (d.time / 1000).toFixed(3),
        `${n.name}${n.octave}`,
        n.cents.toFixed(1),
        d.freq.toFixed(2),
        sg.name || '--',
        sg.hindi || '--',
        Number(d.clarity || 0).toFixed(3),
        Number(d.rms || 0).toFixed(4)
      ];
    });

    const fileStamp = this.formatTimestampForFilename(session.date);
    const fileBase = `SurSight-Session_${fileStamp}`;
    this.downloadCsv(`${fileBase}.csv`, headers, rows);
    this.exportSessionTimelineImage(session, fileBase);
  }

  deleteSession(id) {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.saveSessions();
    this.renderSessions();
  }

  clearAll() {
    if (!confirm('Clear all sessions? This cannot be undone.')) return;

    this.sessions = [];
    this.saveSessions();
    this.renderSessions();
  }

  exportAll() {
    if (this.sessions.length === 0) {
      alert('No sessions to export');
      return;
    }

    const sargamMapper = makeSargamMapper(this.getSaSemitone());
    const headers = [
      'Session #',
      'Session ID',
      'Session Date (ISO)',
      'Duration',
      'Data Points',
      'Point #',
      'Time (s)',
      'Western Note',
      'Cents',
      'Frequency (Hz)',
      'Sargam (English)',
      'Sargam (Hindi)',
      'Clarity',
      'RMS',
      'Session Avg Freq (Hz)',
      'Session Min Freq (Hz)',
      'Session Max Freq (Hz)',
      'Session Range (Hz)',
      'Session Avg Clarity',
      'Session Avg RMS'
    ];

    const rows = this.sessions.flatMap((session, sessionIndex) =>
      this.buildSessionPointRows(session, sessionIndex + 1, sargamMapper)
    );

    const fileStamp = this.formatTimestampForFilename(new Date());
    this.downloadCsv(`SurSight-All-Sessions_${fileStamp}.csv`, headers, rows);
  }
}

export const sessions = new SessionManager();
window.sessions = sessions;
