// ===== Constants and Configuration =====

// Musical constants
export const A4_FREQUENCY = 440;

export const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export const SARGAM_BASE = [
  { name: "Sa", hindi: "सा", semis: 0 },
  { name: "Komal Re", hindi: "रे॒", semis: 1 },
  { name: "Re", hindi: "रे", semis: 2 },
  { name: "Komal Ga", hindi: "गा॒", semis: 3 },
  { name: "Ga", hindi: "गा", semis: 4 },
  { name: "Ma", hindi: "मा", semis: 5 },
  { name: "Teevra Ma", hindi: "म॒", semis: 6 },
  { name: "Pa", hindi: "पा", semis: 7 },
  { name: "Komal Dha", hindi: "धा॒", semis: 8 },
  { name: "Dha", hindi: "धा", semis: 9 },
  { name: "Komal Ni", hindi: "नी॒", semis: 10 },
  { name: "Ni", hindi: "नी", semis: 11 }
];

// Application configuration
export const CONFIG = {
  FFT_SIZE_DESKTOP: 4096,
  FFT_SIZE_MOBILE: 2048,
  SMOOTHING_TIME_CONSTANT: 0.0,
  SAMPLE_RATE_TARGET: 48000,
  MIN_FREQUENCY: 50,
  MAX_FREQUENCY: 1200,
  TIMELINE_DURATION_DEFAULT: 5000,
  MAX_SESSIONS: 50,
  EXERCISE_TOLERANCE_CENTS: 20,
  EXERCISE_HOLD_MS: 500,
  SUSTAINED_EXERCISE_DURATION: 10000,
  FPS_DEFAULT: 30,
  SOUND_HOLD_MS: 80,
  SILENCE_HOLD_MS: 200
};

// Exercise definitions
export const EXERCISES = {
  chromatic: {
    name: 'Chromatic Scale',
    description: 'Practice all 12 semitones in sequence',
    icon: '🎵',
    type: 'sequence',
    getTargets: (baseMidi) => Array.from({ length: 12 }, (_, i) => baseMidi + i)
  },
  sargam: {
    name: 'Sargam Practice',
    description: 'Aroha: Sa Re Ga Ma Pa Dha Ni Sa',
    icon: '🎶',
    type: 'sequence',
    getTargets: (baseMidi) => [0, 2, 4, 5, 7, 9, 11, 12].map(offset => baseMidi + offset)
  },
  sargamFull: {
    name: 'Sargam Aroha-Avaroha',
    description: 'Sa Re Ga Ma Pa Dha Ni Sa ↑ then Sa Ni Dha Pa Ma Ga Re Sa ↓',
    icon: '🪔',
    type: 'sequence',
    getTargets: (baseMidi) => [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0].map(offset => baseMidi + offset)
  },
  interval: {
    name: 'Interval Training',
    description: 'Root-centered jumps: P4, P5, and octave with returns',
    icon: '🎼',
    type: 'jumps',
    getTargets: (baseMidi) => [0, 5, 0, 7, 0, 12, 0].map(offset => baseMidi + offset)
  },
  octaveSwitch: {
    name: 'Octave Switches',
    description: 'Switch quickly between lower and upper octave notes',
    icon: '🧭',
    type: 'jumps',
    getTargets: (baseMidi) => [0, 12, 2, 14, 4, 16, 5, 17, 7, 19, 7, 19].map(offset => baseMidi + offset)
  },
  sustained: {
    name: 'Sustained Pitch',
    description: 'Hold one stable note (duration depends on difficulty)',
    icon: '⏱️',
    type: 'sustain',
    duration: CONFIG.SUSTAINED_EXERCISE_DURATION
  }
};

// Device detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

// Get optimal FFT size based on device
export const getOptimalFFTSize = () => {
  return isMobile() ? CONFIG.FFT_SIZE_MOBILE : CONFIG.FFT_SIZE_DESKTOP;
};
