import { CONFIG, getOptimalFFTSize } from './constants.js';
import { settings } from './settings.js';

class AudioSystem {
  constructor() {
    this.audioCtx = null;
    this.source = null;
    this.analyser = null;
    this.biquadHP = null;
    this.biquadLP = null;
    this.stream = null;
    this.running = false;
    this.permissionGranted = false;
  }

  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: CONFIG.SAMPLE_RATE_TARGET
        }
      });
      
      // Test that we got the stream, then close it
      stream.getTracks().forEach(track => track.stop());
      this.permissionGranted = true;
      
      // Hide permission overlay
      const overlay = document.getElementById('permissionOverlay');
      if (overlay) overlay.style.display = 'none';
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      alert('Microphone access is required for this app to work. Please grant permission and try again.');
      return false;
    }
  }

  async start() {
    if (this.running) return;

    // Check permission first
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      // Show loading
      const loading = document.getElementById('loadingIndicator');
      if (loading) loading.style.display = 'flex';

      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: CONFIG.SAMPLE_RATE_TARGET
        }
      });

      // Create audio context
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.source = this.audioCtx.createMediaStreamSource(this.stream);

      // High-pass filter (remove low frequency noise)
      this.biquadHP = this.audioCtx.createBiquadFilter();
      this.biquadHP.type = 'highpass';
      this.biquadHP.frequency.value = settings.get('lowCut');

      // Low-pass filter (remove high frequency noise)
      this.biquadLP = this.audioCtx.createBiquadFilter();
      this.biquadLP.type = 'lowpass';
      this.biquadLP.frequency.value = 2000;

      // Analyser node
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = getOptimalFFTSize();
      this.analyser.smoothingTimeConstant = CONFIG.SMOOTHING_TIME_CONSTANT;

      // Connect audio graph
      this.source.connect(this.biquadHP);
      this.biquadHP.connect(this.biquadLP);
      this.biquadLP.connect(this.analyser);

      this.running = true;

      // Update UI
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      const recordBtn = document.getElementById('recordBtn');
      const practiceBtn = document.getElementById('practiceBtn');
      
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (recordBtn) {
        recordBtn.style.display = 'inline-flex';
        recordBtn.disabled = false;
      }
      if (practiceBtn) practiceBtn.style.display = 'inline-flex';

      // Hide loading
      if (loading) loading.style.display = 'none';

      // Dispatch event
      window.dispatchEvent(new CustomEvent('audioStarted'));

    } catch (error) {
      console.error('Error starting audio:', error);
      alert('Failed to start microphone: ' + error.message);
      
      const loading = document.getElementById('loadingIndicator');
      if (loading) loading.style.display = 'none';
    }
  }

  stop() {
    if (!this.running) return;

    this.running = false;

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Close audio context
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    // Clear references
    this.source = null;
    this.analyser = null;
    this.biquadHP = null;
    this.biquadLP = null;

    // Update UI
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const recordBtn = document.getElementById('recordBtn');
    const practiceBtn = document.getElementById('practiceBtn');
    
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (recordBtn) {
      recordBtn.style.display = 'none';
      recordBtn.disabled = true;
    }
    if (practiceBtn) practiceBtn.style.display = 'none';

    // Dispatch event
    window.dispatchEvent(new CustomEvent('audioStopped'));
  }

  updateLowCutFilter(frequency) {
    if (this.biquadHP) {
      this.biquadHP.frequency.value = frequency;
    }
  }

  calibrateNoise() {
    if (!this.running || !this.analyser) {
      alert('Please start the microphone first');
      return;
    }

    alert('Stay silent for 2 seconds...');
    
    const samples = [];
    const sampleCount = 60; // 2 seconds at ~30fps
    let count = 0;

    const sample = () => {
      const buffer = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buffer);
      
      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);
      samples.push(rms);
      
      count++;
      if (count < sampleCount) {
        setTimeout(sample, 33);
      } else {
        // Calculate average noise floor
        const avgNoise = samples.reduce((a, b) => a + b, 0) / samples.length;
        const recommendedGate = Math.max(0.001, avgNoise * 2);
        
        // Update RMS gate
        const rmsGateInput = document.getElementById('rmsGate');
        if (rmsGateInput) {
          rmsGateInput.value = Math.round(recommendedGate * 1000);
          rmsGateInput.dispatchEvent(new Event('input'));
        }
        
        alert(`Calibration complete! Noise floor: ${avgNoise.toFixed(4)}, Gate set to: ${recommendedGate.toFixed(4)}`);
      }
    };

    setTimeout(sample, 100);
  }

  getSampleRate() {
    return this.audioCtx ? this.audioCtx.sampleRate : 0;
  }

  isRunning() {
    return this.running;
  }

  getAnalyser() {
    return this.analyser;
  }

  getAudioContext() {
    return this.audioCtx;
  }
}

// Create singleton instance
export const audio = new AudioSystem();

// Make globally accessible
window.audio = audio;
