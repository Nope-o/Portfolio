import { nearestNote, makeSargamMapper } from './music-math.js';
import { CONFIG } from './constants.js';

class SessionManager {
  constructor() {
    this.sessions = [];
    this.playbackTimeouts = [];
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.loadSessions();
  }

  loadSessions() {
    try {
      const stored = localStorage.getItem('pitchSessions');
      this.sessions = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessions = [];
    }
  }

  saveSessions() {
    try {
      localStorage.setItem('pitchSessions', JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
      alert('Failed to save session. Storage may be full.');
    }
  }

  saveSession(recordedData) {
    if (!recordedData || recordedData.length === 0) return;

    const duration = recordedData[recordedData.length - 1].time / 1000;
    const freqs = recordedData.map(d => d.freq);
    const avgFreq = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
    const minFreq = Math.min(...freqs);
    const maxFreq = Math.max(...freqs);
    const range = maxFreq - minFreq;
    const avgClarity = recordedData.reduce((sum, d) => sum + d.clarity, 0) / recordedData.length;
    const avgRms = recordedData.reduce((sum, d) => sum + d.rms, 0) / recordedData.length;

    const avgNote = nearestNote(avgFreq);

    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: duration.toFixed(1),
      avgNote: `${avgNote.name}${avgNote.octave}`,
      avgFreq: avgFreq.toFixed(2),
      minFreq: minFreq.toFixed(2),
      maxFreq: maxFreq.toFixed(2),
      range: range.toFixed(2),
      avgClarity: avgClarity.toFixed(2),
      avgRms: avgRms.toFixed(4),
      dataPoints: recordedData.length,
      data: recordedData
    };

    this.sessions.unshift(session);

    // Keep only recent sessions
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

    const formatDuration = (seconds) => {
      const s = Math.max(0, Math.round(parseFloat(seconds)));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r.toString().padStart(2, '0')}`;
    };

    container.innerHTML = this.sessions.map(s => {
      const playingThis = this.isPlaying && this.currentPlaybackId === s.id;
      return `
        <div class="session-item">
          <div class="session-info">
            <div class="session-name">Session ${new Date(s.date).toLocaleString()}</div>
            <div class="session-meta">Duration ${formatDuration(s.duration)} • ${s.dataPoints} points</div>
            <div class="session-grid">
              <div class="session-metric">
                <span class="label">Avg Note</span>
                <span class="value">${s.avgNote}</span>
              </div>
              <div class="session-metric">
                <span class="label">Avg Freq</span>
                <span class="value">${s.avgFreq} Hz</span>
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
          </div>
          <div class="session-actions">
            <button class="icon-btn" onclick="sessions.togglePlayback(${s.id})" aria-label="${playingThis ? 'Stop' : 'Play'}">
              ${playingThis ? '⏹️' : '▶️'}
            </button>
            <button class="icon-btn" onclick="sessions.downloadSession(${s.id})" aria-label="Download">💾</button>
            <button class="icon-btn" onclick="sessions.deleteSession(${s.id})" aria-label="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  togglePlayback(id) {
    if (this.isPlaying && this.currentPlaybackId === id) {
      this.stopPlayback();
    } else {
      this.playSession(id);
    }
  }

  playSession(id) {
    const session = this.sessions.find(s => s.id === id);
    if (!session) return;

    this.stopPlayback();
    this.isPlaying = true;
    this.currentPlaybackId = id;

    // Clear current visualization
    if (window.visualization) {
      window.visualization.clearHistory();
    }

    // Schedule all data points
    session.data.forEach(d => {
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

    // Schedule end of playback
    const endTimeout = setTimeout(() => {
      if (this.currentPlaybackId === id) {
        this.stopPlayback();
      }
    }, parseFloat(session.duration) * 1000 + 100);

    this.playbackTimeouts.push(endTimeout);
    this.renderSessions();
  }

  stopPlayback() {
    this.playbackTimeouts.forEach(t => clearTimeout(t));
    this.playbackTimeouts = [];
    this.isPlaying = false;
    this.currentPlaybackId = null;
    this.renderSessions();
  }

  downloadSession(id) {
    const session = this.sessions.find(s => s.id === id);
    if (!session) return;

    const saSelect = document.getElementById('saSelect');
    const saSemi = saSelect ? parseInt(saSelect.value, 10) : 0;
    const sargamMapper = makeSargamMapper(saSemi);

    const formatTime = (ms) => (ms / 1000).toFixed(2);
    
    const sessionDate = new Date(session.date);
    const pad2 = (n) => String(n).padStart(2, '0');
    const fileStamp = `${pad2(sessionDate.getDate())}-${pad2(sessionDate.getMonth() + 1)}-${sessionDate.getFullYear()}_${pad2(sessionDate.getHours())}-${pad2(sessionDate.getMinutes())}-${pad2(sessionDate.getSeconds())}`;

    const csv = 'Time(s),Note,Cents,Frequency(Hz),Sargam,Clarity,RMS\n' +
      session.data.map(d => {
        const n = nearestNote(d.freq);
        const sg = sargamMapper(n.midi);
        return [
          formatTime(d.time),
          `${n.name}${n.octave}`,
          n.cents.toFixed(1),
          d.freq.toFixed(2),
          sg.name,
          d.clarity.toFixed(3),
          d.rms.toFixed(4)
        ].join(',');
      }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Session-${fileStamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  deleteSession(id) {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    this.sessions = this.sessions.filter(s => s.id !== id);
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

    const data = {
      exportDate: new Date().toISOString(),
      sessionCount: this.sessions.length,
      sessions: this.sessions
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-sessions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Create singleton
export const sessions = new SessionManager();

// Make globally accessible
window.sessions = sessions;
