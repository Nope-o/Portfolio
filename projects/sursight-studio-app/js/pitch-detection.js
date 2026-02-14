export function detectPitch(buffer, sampleRate, minFreq, rmsGate, clarityGate) {
  const N = buffer.length;
  
  // Step 1: Remove DC offset
  let mean = 0;
  for (let i = 0; i < N; i++) {
    mean += buffer[i];
  }
  mean /= N;
  
  // Step 2: Apply Hann window and calculate RMS
  const windowScale = Math.PI * 2 / (N - 1);
  let rms = 0;
  const windowed = new Float32Array(N);
  
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos(windowScale * i)); // Hann window
    const sample = (buffer[i] - mean) * w;
    windowed[i] = sample;
    rms += sample * sample;
  }
  
  rms = Math.sqrt(rms / N);
  
  // Check if signal is too quiet
  if (rms < rmsGate) {
    return { freq: 0, clarity: 0, rms };
  }
  
  // Step 3: Calculate autocorrelation lags range
  const minLag = Math.floor(sampleRate / 1200); // Max 1200 Hz
  const maxLag = Math.min(N - 3, Math.floor(sampleRate / Math.max(50, minFreq)));
  
  let bestLag = -1;
  let bestClarity = 0;
  
  // Step 4: Normalized autocorrelation
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let sum0 = 0;
    let sum1 = 0;
    
    for (let i = 0; i < N - lag; i++) {
      const a = windowed[i];
      const b = windowed[i + lag];
      sum += a * b;
      sum0 += a * a;
      sum1 += b * b;
    }
    
    // Normalized autocorrelation coefficient
    const acf = sum / Math.sqrt(sum0 * sum1 + 1e-12);
    
    if (acf > bestClarity) {
      bestClarity = acf;
      bestLag = lag;
    }
  }
  
  // Check if clarity is sufficient
  if (bestLag < 0 || bestClarity < clarityGate) {
    return { freq: 0, clarity: bestClarity, rms };
  }
  
  // Step 5: Parabolic interpolation for sub-sample accuracy
  const c1 = correlationAt(bestLag - 1, windowed);
  const c2 = correlationAt(bestLag, windowed);
  const c3 = correlationAt(bestLag + 1, windowed);
  
  const denominator = c1 - 2 * c2 + c3;
  const offset = Math.abs(denominator) > 1e-7 
    ? 0.5 * (c1 - c3) / denominator 
    : 0;
  
  const refinedLag = bestLag + offset;
  const freq = sampleRate / refinedLag;
  
  // Validate frequency is in expected range
  const isValid = isFinite(freq) && freq >= minFreq && freq <= 1200;
  
  return {
    freq: isValid ? freq : 0,
    clarity: bestClarity,
    rms
  };
}

// Helper: Calculate normalized correlation at specific lag
function correlationAt(lag, array) {
  lag = Math.max(1, Math.min(array.length - 2, Math.floor(lag)));
  
  let sum = 0;
  let sum0 = 0;
  let sum1 = 0;
  
  for (let i = 0; i < array.length - lag; i++) {
    const a = array[i];
    const b = array[i + lag];
    sum += a * b;
    sum0 += a * a;
    sum1 += b * b;
  }
  
  return sum / Math.sqrt(sum0 * sum1 + 1e-12);
}

// Exponential smoothing for pitch stability
export class PitchSmoother {
  constructor(smoothingFactor = 0.3) {
    this.smoothingFactor = smoothingFactor;
    this.lastValue = 0;
  }

  smooth(newValue) {
    if (newValue === 0) {
      this.lastValue = 0;
      return 0;
    }

    if (this.lastValue === 0) {
      this.lastValue = newValue;
      return newValue;
    }

    this.lastValue = this.smoothingFactor * newValue + 
                     (1 - this.smoothingFactor) * this.lastValue;
    
    return this.lastValue;
  }

  reset() {
    this.lastValue = 0;
  }

  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(0.9, factor));
  }
}

// Signal/silence state machine with hysteresis
export class SignalDetector {
  constructor(soundHoldMs = 80, silenceHoldMs = 200) {
    this.soundHoldMs = soundHoldMs;
    this.silenceHoldMs = silenceHoldMs;
    this.hasSignal = false;
    this.lastSoundTime = 0;
    this.lastSilenceTime = 0;
  }

  update(hasSound, timestamp) {
    if (hasSound) {
      this.lastSoundTime = timestamp;
      if (!this.hasSignal && (timestamp - this.lastSilenceTime) > this.soundHoldMs) {
        this.hasSignal = true;
      }
    } else {
      this.lastSilenceTime = timestamp;
      if (this.hasSignal && (timestamp - this.lastSoundTime) > this.silenceHoldMs) {
        this.hasSignal = false;
      }
    }

    return this.hasSignal;
  }

  reset() {
    this.hasSignal = false;
    this.lastSoundTime = 0;
    this.lastSilenceTime = 0;
  }

  getState() {
    return this.hasSignal;
  }
}
