// ===========================
// Audio System (Lazy-loaded)
// ===========================
let audioInitialized = false;
let winSynth, loseSynth, moveSynth;

const initializeAudio = () => {
  if (audioInitialized || typeof Tone === 'undefined') return;
  
  winSynth = new Tone.PolySynth(Tone.Synth, {
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.5 }
  }).toDestination();

  loseSynth = new Tone.NoiseSynth({
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
  }).toDestination();

  moveSynth = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).toDestination();

  audioInitialized = true;
};

const playSound = async (type) => {
  if (!audioInitialized) initializeAudio();
  if (!audioInitialized || typeof Tone === 'undefined') return;

  try {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    switch (type) {
      case 'win':
        winSynth?.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n");
        break;
      case 'lose':
        loseSynth?.triggerAttackRelease("4n");
        break;
      case 'move':
        moveSynth?.triggerAttackRelease("C2", "16n");
        break;
    }
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};
