// ===========================
// Audio System (Lazy-loaded)
// ===========================
let audioInitialized = false;
let winSynth, loseSynth, moveSynth;
let toneReadyPromise = null;
const TONE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js";

const ensureToneLoaded = async () => {
  if (typeof Tone !== "undefined") return true;
  if (typeof document === "undefined") return false;

  if (!toneReadyPromise) {
    toneReadyPromise = new Promise((resolve) => {
      const existingScript = Array.from(document.querySelectorAll('script[src]')).find(
        (scriptEl) => scriptEl.src === TONE_CDN_URL
      );

      if (existingScript) {
        if (typeof Tone !== "undefined") {
          resolve(true);
          return;
        }
        existingScript.addEventListener("load", () => resolve(typeof Tone !== "undefined"), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const toneScript = document.createElement("script");
      toneScript.src = TONE_CDN_URL;
      toneScript.defer = true;
      toneScript.async = true;
      toneScript.crossOrigin = "anonymous";
      toneScript.addEventListener("load", () => resolve(typeof Tone !== "undefined"), { once: true });
      toneScript.addEventListener("error", () => resolve(false), { once: true });
      document.head.appendChild(toneScript);
    });
  }

  const loaded = await toneReadyPromise;
  if (!loaded) toneReadyPromise = null;
  return loaded;
};

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
  if (!audioInitialized) {
    const toneLoaded = await ensureToneLoaded();
    if (!toneLoaded) return;
    initializeAudio();
  }
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
