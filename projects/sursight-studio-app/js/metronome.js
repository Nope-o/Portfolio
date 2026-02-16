// ===== Metronome System =====

class MetronomeSystem {
  constructor() {
    this.interval = null;
    this.currentBeat = 0;
    this.isRunning = false;
    this.bpm = 120;
    this.beats = 4;
  }

  start() {
    if (this.isRunning) return;

    const bpmInput = document.getElementById('metronomeBpm');
    const beatsInput = document.getElementById('metronomeBeats');
    const toggleBtn = document.getElementById('metronomeToggle');
    const visual = document.getElementById('metronomeVisual');

    const bpmFromInput = bpmInput ? parseInt(bpmInput.value, 10) : this.bpm;
    const beatsFromInput = beatsInput ? parseInt(beatsInput.value, 10) : this.beats;
    this.bpm = this.clampBpm(bpmFromInput);
    this.beats = this.clampBeats(beatsFromInput);
    this.updateBpmUI(this.bpm);
    this.updateBeatsUI(this.beats);
    const intervalMs = 60000 / this.bpm;

    this.currentBeat = 0;
    this.isRunning = true;

    if (toggleBtn) {
      toggleBtn.textContent = '⏸️ Stop';
    }

    const tick = () => {
      this.currentBeat = (this.currentBeat % this.beats) + 1;

      if (visual) {
        visual.textContent = this.currentBeat;
        visual.classList.add('beat');
        setTimeout(() => visual.classList.remove('beat'), 100);
      }

      // Audio feedback using Web Audio API
      const audioCtx = window.audio?.getAudioContext();
      if (audioCtx && audioCtx.state === 'running') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // First beat is higher pitch
        osc.frequency.value = this.currentBeat === 1 ? 1000 : 800;
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
      }
    };

    // First tick immediately
    tick();

    // Then regular interval
    this.interval = setInterval(tick, intervalMs);
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    const toggleBtn = document.getElementById('metronomeToggle');
    const visual = document.getElementById('metronomeVisual');

    if (toggleBtn) {
      toggleBtn.textContent = '▶️ Start';
    }

    if (visual) {
      visual.textContent = '--';
      visual.classList.remove('beat');
    }
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  clampBpm(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return this.bpm;
    return Math.max(40, Math.min(208, n));
  }

  clampBeats(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return this.beats;
    return Math.max(1, Math.min(12, n));
  }

  updateBpmUI(value) {
    const bpmInput = document.getElementById('metronomeBpm');
    const bpmValue = document.getElementById('metronomeBpmVal');
    if (bpmInput) bpmInput.value = String(value);
    if (bpmValue) bpmValue.textContent = String(value);
  }

  updateBeatsUI(value) {
    const beatsInput = document.getElementById('metronomeBeats');
    if (beatsInput) beatsInput.value = String(value);
  }

  restart() {
    if (!this.isRunning) return;
    this.stop();
    this.start();
  }

  setBPM(value, options = {}) {
    const { restartIfRunning = true } = options;
    this.bpm = this.clampBpm(value);
    this.updateBpmUI(this.bpm);
    if (restartIfRunning) {
      this.restart();
    }
  }

  adjustBpm(delta) {
    const step = parseInt(delta, 10) || 0;
    this.setBPM(this.bpm + step);
  }

  setBeats(value, options = {}) {
    const { restartIfRunning = true } = options;
    this.beats = this.clampBeats(value);
    this.updateBeatsUI(this.beats);
    if (restartIfRunning) {
      this.restart();
    }
  }

  getState() {
    return this.isRunning;
  }
}

// Create singleton
export const metronome = new MetronomeSystem();

// Make globally accessible
window.metronome = metronome;
