// ===== Exercise System =====

import { EXERCISES, CONFIG } from './constants.js';
import { nearestNote, noteNameForMidi, midiToFreq } from './music-math.js';
import { settings } from './settings.js';

const EXERCISE_DIFFICULTY = {
  beginner: {
    label: 'Beginner',
    toleranceCents: 30,
    sequentialHoldMs: 2200,
    sustainedDurationMs: 8000
  },
  normal: {
    label: 'Normal',
    toleranceCents: CONFIG.EXERCISE_TOLERANCE_CENTS,
    sequentialHoldMs: 3000,
    sustainedDurationMs: CONFIG.SUSTAINED_EXERCISE_DURATION
  },
  strict: {
    label: 'Strict',
    toleranceCents: 12,
    sequentialHoldMs: 4000,
    sustainedDurationMs: 12000
  }
};
const REGISTER_BASE_MIDI = {
  low: 48,   // C3
  mid: 60,   // C4
  high: 72   // C5
};
const REGISTER_LABEL = {
  low: 'Octave 3 (C3)',
  mid: 'Octave 4 (C4)',
  high: 'Octave 5 (C5)'
};
const EXERCISE_BESTS_KEY = 'pitchVisualizerExerciseBests';

class ExerciseSystem {
  constructor() {
    this.currentExercise = null;
    this.exerciseState = {
      type: null,
      step: 0,
      baseMidi: null,
      targets: [],
      stepStart: 0,
      completed: false,
      stepHoldMs: 0,
      wrongMs: 0,
      lastUpdateMs: 0,
      accuracyHits: 0,
      accuracySamples: 0,
      difficultyKey: 'normal',
      sessionStartMs: 0,
      reportShown: false,
      totalHoldMs: 0,
      expectedMidi: null,
      currentMidi: null
    };
    this.sustainTargetMidi = null;
    this.sustainHoldMs = 0;
    this.sustainBreakMs = 0;
    this.sustainLastUpdateMs = 0;
    this.sustainAccuracyHits = 0;
    this.sustainAccuracySamples = 0;
    this.sustainCompleted = false;
    this.previewOscillator = null;
    this.previewGain = null;
    this.previewContext = null;
    this.previewTargetMidi = null;
    this.previewAutoStopTimer = null;
    this.suppressAutoPromptUntil = 0;
    this.exerciseBests = this.loadExerciseBests();
  }

  loadExerciseBests() {
    try {
      const raw = localStorage.getItem(EXERCISE_BESTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  saveExerciseBests() {
    try {
      localStorage.setItem(EXERCISE_BESTS_KEY, JSON.stringify(this.exerciseBests));
    } catch (_) {}
  }

  getCurrentContextKey(exerciseType) {
    const difficulty = settings.get('exerciseDifficulty') || 'normal';
    const octave = settings.get('exerciseRegister') || 'low';
    const sa = settings.get('sa') || 0;
    return `${exerciseType}|${difficulty}|${octave}|${sa}`;
  }

  formatBestEntry(entry) {
    if (!entry) return 'Best: --';
    const timeText = Number.isFinite(entry.bestTimeSec) ? `${entry.bestTimeSec.toFixed(1)}s` : '--';
    return `Best: ${entry.bestScore}% • Acc ${entry.bestAccuracy}% • ${timeText}`;
  }

  renderBestStatsBadges() {
    const exerciseIds = Object.keys(EXERCISES);
    exerciseIds.forEach((exerciseId) => {
      const el = document.getElementById(`exerciseBest-${exerciseId}`);
      if (!el) return;
      const key = this.getCurrentContextKey(exerciseId);
      el.textContent = this.formatBestEntry(this.exerciseBests[key]);
    });
  }

  updateBestStats(exerciseType, { scorePct, accuracyPct, elapsedSec }) {
    const key = this.getCurrentContextKey(exerciseType);
    const previous = this.exerciseBests[key];
    const next = {
      bestScore: Math.max(previous?.bestScore ?? 0, scorePct),
      bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracyPct),
      bestTimeSec: Number.isFinite(previous?.bestTimeSec)
        ? Math.min(previous.bestTimeSec, elapsedSec)
        : elapsedSec
    };
    this.exerciseBests[key] = next;
    this.saveExerciseBests();
    this.renderBestStatsBadges();
  }

  getDifficultyProfile() {
    const stateKey = this.exerciseState?.difficultyKey;
    if (stateKey && EXERCISE_DIFFICULTY[stateKey]) {
      return EXERCISE_DIFFICULTY[stateKey];
    }

    const key = settings.get('exerciseDifficulty') || 'normal';
    return EXERCISE_DIFFICULTY[key] || EXERCISE_DIFFICULTY.normal;
  }

  getToleranceCents() {
    return this.getDifficultyProfile().toleranceCents;
  }

  getSustainedDurationMs() {
    return this.getDifficultyProfile().sustainedDurationMs;
  }

  getSequentialHoldMs() {
    if (this.isSequentialExercise()) {
      return this.getDifficultyProfile().sequentialHoldMs;
    }
    return CONFIG.EXERCISE_HOLD_MS;
  }

  isSequentialExercise() {
    const exercise = EXERCISES[this.currentExercise];
    return Boolean(exercise && exercise.type !== 'sustain');
  }

  getBaseMidi() {
    const saOffset = settings.get('sa') || 0;
    const register = settings.get('exerciseRegister') || 'low';
    const registerBase = REGISTER_BASE_MIDI[register] ?? REGISTER_BASE_MIDI.low;
    return registerBase + saOffset;
  }

  getRegisterLabel() {
    const register = settings.get('exerciseRegister') || 'low';
    return REGISTER_LABEL[register] || REGISTER_LABEL.low;
  }

  clearPreviewAutoStopTimer() {
    if (this.previewAutoStopTimer) {
      window.clearTimeout(this.previewAutoStopTimer);
      this.previewAutoStopTimer = null;
    }
  }

  stopPreviewTone({ suppressAutoPromptMs = 0 } = {}) {
    this.clearPreviewAutoStopTimer();
    if (suppressAutoPromptMs > 0) {
      this.suppressAutoPromptUntil = performance.now() + suppressAutoPromptMs;
    }

    const osc = this.previewOscillator;
    const gain = this.previewGain;
    const ctx = this.previewContext;

    if (osc && gain && ctx) {
      try {
        const t = ctx.currentTime;
        // Fade out briefly before stopping to avoid click/crackle artifacts.
        const currentGain = Math.max(0.0001, gain.gain.value || 0.0001);
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(currentGain, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.stop(t + 0.1);
      } catch (err) {
        try {
          osc.stop();
        } catch (_) {}
      }
    } else if (osc) {
      try {
        osc.stop();
      } catch (err) {}
    }

    this.previewOscillator = null;
    this.previewGain = null;
    this.previewContext = null;
    this.previewTargetMidi = null;
    this.updatePreviewButtonState();
  }

  updatePreviewButtonState() {
    const btn = document.getElementById('playTargetedNoteBtn');
    if (!btn) return;
    if (this.previewOscillator) {
      btn.textContent = '■ Stop Targeted Note';
    } else {
      btn.textContent = '▶ Play Targeted Note';
    }
  }

  syncPreviewToneToTarget() {
    if (!this.previewOscillator || !this.previewContext) return;
    const midi = Number.isFinite(this.exerciseState.expectedMidi)
      ? this.exerciseState.expectedMidi
      : (Number.isFinite(this.sustainTargetMidi) ? this.sustainTargetMidi : null);
    if (!Number.isFinite(midi) || midi === this.previewTargetMidi) return;

    this.previewTargetMidi = midi;
    const frequency = midiToFreq(midi);
    this.previewOscillator.frequency.setTargetAtTime(
      frequency,
      this.previewContext.currentTime,
      0.04
    );
  }

  playTargetNotePreview({ toggle = true, source = 'user' } = {}) {
    if (this.previewOscillator && toggle) {
      this.stopPreviewTone({ suppressAutoPromptMs: source === 'user' ? 900 : 0 });
      return;
    }

    if (source !== 'user' && performance.now() < this.suppressAutoPromptUntil) {
      return;
    }

    const midi = Number.isFinite(this.exerciseState.expectedMidi)
      ? this.exerciseState.expectedMidi
      : (Number.isFinite(this.sustainTargetMidi) ? this.sustainTargetMidi : null);
    if (!Number.isFinite(midi)) return;

    const ctx = window.audio?.getAudioContext?.();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume?.().catch?.(() => {});
      if (ctx.state !== 'running') return;
    }

    this.stopPreviewTone();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const frequency = midiToFreq(midi);
    const t0 = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.onended = () => {
      // Ignore stale onended callbacks from previously replaced oscillators.
      if (this.previewOscillator !== osc) {
        try { osc.disconnect(); } catch (_) {}
        try { gain.disconnect(); } catch (_) {}
        return;
      }

      this.previewOscillator = null;
      this.previewGain = null;
      this.previewContext = null;
      this.previewTargetMidi = null;
      this.updatePreviewButtonState();
      try { osc.disconnect(); } catch (_) {}
      try { gain.disconnect(); } catch (_) {}
    };

    this.previewOscillator = osc;
    this.previewGain = gain;
    this.previewContext = ctx;
    this.previewTargetMidi = midi;
    this.updatePreviewButtonState();
  }

  playTargetPromptOnce(durationMs = 420) {
    if (!settings.get('playExerciseTargetPrompt')) return;
    if (!Number.isFinite(this.exerciseState.expectedMidi) && !Number.isFinite(this.sustainTargetMidi)) return;
    if (performance.now() < this.suppressAutoPromptUntil) return;

    this.stopPreviewTone();
    this.playTargetNotePreview({ toggle: false, source: 'auto' });
    this.clearPreviewAutoStopTimer();
    this.previewAutoStopTimer = window.setTimeout(() => {
      if (this.previewOscillator) {
        this.stopPreviewTone();
      }
    }, durationMs);
  }

  start(exerciseType) {
    if (!EXERCISES[exerciseType]) {
      console.error('Unknown exercise:', exerciseType);
      return;
    }

    this.currentExercise = exerciseType;
    this.renderBestStatsBadges();
    this.closeCompletionOverlay();
    const selectedDifficulty = settings.get('exerciseDifficulty') || 'normal';
    const difficultyKey = EXERCISE_DIFFICULTY[selectedDifficulty] ? selectedDifficulty : 'normal';
    this.exerciseState = {
      type: exerciseType,
      step: 0,
      baseMidi: null,
      targets: [],
      stepStart: 0,
      completed: false,
      stepHoldMs: 0,
      wrongMs: 0,
      lastUpdateMs: 0,
      accuracyHits: 0,
      accuracySamples: 0,
      difficultyKey,
      sessionStartMs: performance.now(),
      reportShown: false,
      totalHoldMs: 0,
      expectedMidi: null,
      currentMidi: null
    };
    this.sustainTargetMidi = null;
    this.sustainHoldMs = 0;
    this.sustainBreakMs = 0;
    this.sustainLastUpdateMs = 0;
    this.sustainAccuracyHits = 0;
    this.sustainAccuracySamples = 0;
    this.sustainCompleted = false;
    this.stopPreviewTone();

    const exercise = EXERCISES[exerciseType];
    const profile = EXERCISE_DIFFICULTY[difficultyKey];
    const registerLabel = this.getRegisterLabel();
    const sessionTitle = document.getElementById('exerciseSessionTitle');
    if (sessionTitle) {
      sessionTitle.textContent = `${exercise.icon} ${exercise.name}`;
    }
    if (window.app && typeof window.app.enterExerciseMode === 'function') {
      window.app.enterExerciseMode();
    }
    if (exercise.type !== 'sustain' && typeof exercise.getTargets === 'function') {
      const baseMidi = this.getBaseMidi();
      this.exerciseState.baseMidi = baseMidi;
      this.exerciseState.targets = exercise.getTargets(baseMidi);
      this.exerciseState.expectedMidi = this.exerciseState.targets[0];
    }
    const progressDiv = document.getElementById('exerciseProgress');
    
    if (progressDiv) {
      progressDiv.style.display = 'block';
      progressDiv.innerHTML = `
        <div class="exercise-header">
          <span id="exerciseName">${exercise.icon} ${exercise.name}</span>
          <span id="exerciseScore">Progress: 0%</span>
        </div>
        <div class="exercise-bar-container">
          <div id="exerciseBar" class="exercise-bar"></div>
        </div>
        <div id="exerciseInstruction" class="exercise-instruction">
          ${exercise.description}
        </div>
        <div class="exercise-meta">Difficulty: ${profile.label} • Octave: ${registerLabel}</div>
        <div id="exerciseReport" class="exercise-report" style="display:none;">
          <div class="exercise-report-title">Session Report</div>
          <div class="exercise-report-grid">
            <div class="exercise-report-item">
              <span class="label">Duration</span>
              <span class="value" id="reportDuration">--</span>
            </div>
            <div class="exercise-report-item">
              <span class="label">Accuracy</span>
              <span class="value" id="reportAccuracy">--</span>
            </div>
            <div class="exercise-report-item">
              <span class="label">Completed</span>
              <span class="value" id="reportCompleted">--</span>
            </div>
            <div class="exercise-report-item">
              <span class="label">Difficulty</span>
              <span class="value" id="reportDifficulty">${profile.label}</span>
            </div>
          </div>
          <div class="exercise-report-actions">
            <button class="btn btn-secondary btn-sm" onclick="exercises.retry()">Retry</button>
            <button class="btn btn-secondary btn-sm" onclick="exercises.stop()">Close</button>
          </div>
        </div>
      `;
    }
    console.log('Exercise started:', exerciseType);
    if (exercise.type !== 'sustain') {
      this.playTargetPromptOnce();
    }
  }

  updateProgress(displayFreq, clarity) {
    if (!this.currentExercise) return;

    const progressDiv = document.getElementById('exerciseProgress');
    if (!progressDiv || progressDiv.style.display === 'none') return;

    const bar = document.getElementById('exerciseBar');
    const score = document.getElementById('exerciseScore');
    const instruction = document.getElementById('exerciseInstruction');
    const now = performance.now();
    const toleranceCents = this.getToleranceCents();
    const sustainedDurationMs = this.getSustainedDurationMs();
    const saSemi = settings.get('sa') || 0;

    // Sustained exercise
    if (this.currentExercise === 'sustained') {
      const dt = this.sustainLastUpdateMs ? Math.min(120, now - this.sustainLastUpdateMs) : 0;
      this.sustainLastUpdateMs = now;

      if (this.sustainCompleted) {
        bar.style.width = '100%';
        score.textContent = 'Score: 100%';
        instruction.textContent = '✅ Success! Sustained pitch complete.';
        if (!this.exerciseState.reportShown) {
          this.showReport(now);
        }
        return;
      }

      if (!displayFreq) {
        this.exerciseState.expectedMidi = this.sustainTargetMidi;
        this.exerciseState.currentMidi = null;
        this.sustainBreakMs += dt;
        this.sustainHoldMs = Math.max(0, this.sustainHoldMs - dt * 0.75);
        const pct = Math.max(0, Math.min(100, (this.sustainHoldMs / sustainedDurationMs) * 100));
        const accPct = this.sustainAccuracySamples > 0
          ? Math.round((this.sustainAccuracyHits / this.sustainAccuracySamples) * 100)
          : 100;

        bar.style.width = `${pct.toFixed(0)}%`;
        score.textContent = `Score: ${pct.toFixed(0)}% • Acc: ${accPct}%`;
        instruction.textContent = this.sustainTargetMidi === null
          ? 'Sing and hold any stable note'
          : `Keep holding ${noteNameForMidi(this.sustainTargetMidi, saSemi)}...`;
        this.syncPreviewToneToTarget();
        return;
      }

      const { midi, cents, name, octave } = nearestNote(displayFreq);
      const withinTolerance = Math.abs(cents) <= toleranceCents;
      this.exerciseState.currentMidi = midi;

      this.sustainAccuracySamples++;
      if (withinTolerance) this.sustainAccuracyHits++;

      if (this.sustainTargetMidi === null) {
        this.sustainTargetMidi = midi;
        this.sustainHoldMs = 0;
        this.sustainBreakMs = 0;
        instruction.textContent = `Hold ${name}${octave} steady...`;
        this.playTargetPromptOnce();
      }

      if (midi === this.sustainTargetMidi && withinTolerance) {
        this.sustainBreakMs = 0;
        this.sustainHoldMs = Math.min(sustainedDurationMs, this.sustainHoldMs + dt);
      } else {
        this.sustainBreakMs += dt;
        this.sustainHoldMs = Math.max(0, this.sustainHoldMs - dt * 1.2);

        // If user clearly moved to another note for a short duration, retarget automatically.
        if (midi !== this.sustainTargetMidi && this.sustainBreakMs > 420) {
          this.sustainTargetMidi = midi;
          this.sustainHoldMs = 0;
          this.sustainBreakMs = 0;
          this.playTargetPromptOnce();
        }
      }

      const pct = Math.max(0, Math.min(100, (this.sustainHoldMs / sustainedDurationMs) * 100));
      const accPct = this.sustainAccuracySamples > 0
        ? Math.round((this.sustainAccuracyHits / this.sustainAccuracySamples) * 100)
        : 100;

      bar.style.width = `${pct.toFixed(0)}%`;
      score.textContent = `Score: ${pct.toFixed(0)}% • Acc: ${accPct}%`;
      this.exerciseState.expectedMidi = this.sustainTargetMidi;

      if (midi !== this.sustainTargetMidi) {
        const targetName = noteNameForMidi(this.sustainTargetMidi, saSemi);
        instruction.textContent = this.getDirectionalHint(midi, this.sustainTargetMidi, targetName);
      } else if (!withinTolerance) {
        instruction.textContent = cents < 0
          ? `Tune up slightly for ${name}${octave}`
          : `Tune down slightly for ${name}${octave}`;
      } else {
        instruction.textContent = `Holding ${name}${octave}... ${pct.toFixed(0)}%`;
      }

      if (this.sustainHoldMs >= sustainedDurationMs) {
        this.sustainCompleted = true;
        this.showReport(now);
      }
      this.syncPreviewToneToTarget();
      return;
    }

    const dt = this.exerciseState.lastUpdateMs ? Math.min(120, now - this.exerciseState.lastUpdateMs) : 0;
    this.exerciseState.lastUpdateMs = now;
    const holdMs = this.getSequentialHoldMs();

    // Sequential exercises
    if (!displayFreq) {
      if (this.exerciseState.baseMidi === null) {
        instruction.textContent = EXERCISES[this.currentExercise].description;
        return;
      }

      this.exerciseState.stepHoldMs = Math.max(0, this.exerciseState.stepHoldMs - dt * 0.6);
      this.exerciseState.wrongMs += dt;

      const expectedMidiSilent = this.exerciseState.targets[this.exerciseState.step];
      this.exerciseState.expectedMidi = expectedMidiSilent;
      this.exerciseState.currentMidi = null;
      const expectedSilentName = noteNameForMidi(expectedMidiSilent, saSemi);
      const holdPctSilent = Math.max(0, Math.min(1, this.exerciseState.stepHoldMs / holdMs));
      const overallPctSilent = Math.max(0, Math.min(100,
        ((this.exerciseState.step + holdPctSilent) / this.exerciseState.targets.length) * 100
      ));
      const accPctSilent = this.exerciseState.accuracySamples > 0
        ? Math.round((this.exerciseState.accuracyHits / this.exerciseState.accuracySamples) * 100)
        : 100;

      bar.style.width = `${overallPctSilent.toFixed(0)}%`;
      score.textContent = `Score: ${overallPctSilent.toFixed(0)}% • Acc: ${accPctSilent}%`;
      instruction.textContent = `Sing ${expectedSilentName} to continue`;
      this.syncPreviewToneToTarget();
      return;
    }

    const { midi, cents } = nearestNote(displayFreq);
    const withinTolerance = Math.abs(cents) <= toleranceCents;
    this.exerciseState.currentMidi = midi;

    // Set base MIDI on first detection
    if (this.exerciseState.baseMidi === null) {
      const exercise = EXERCISES[this.currentExercise];
      if (!exercise || exercise.type === 'sustain' || typeof exercise.getTargets !== 'function') {
        return;
      }
      this.exerciseState.baseMidi = this.getBaseMidi();
      this.exerciseState.targets = exercise.getTargets(this.exerciseState.baseMidi);

      this.exerciseState.step = 0;
      this.exerciseState.stepStart = 0;
      this.exerciseState.stepHoldMs = 0;
      this.exerciseState.wrongMs = 0;
    }

    const expectedMidi = this.exerciseState.targets[this.exerciseState.step];
    this.exerciseState.expectedMidi = expectedMidi;
    const expectedName = noteNameForMidi(expectedMidi, saSemi);

    this.exerciseState.accuracySamples++;

    if (midi === expectedMidi && withinTolerance) {
      this.exerciseState.accuracyHits++;
      this.exerciseState.wrongMs = 0;
      this.exerciseState.stepHoldMs = Math.min(holdMs, this.exerciseState.stepHoldMs + dt);
      this.exerciseState.totalHoldMs += dt;
    } else {
      this.exerciseState.wrongMs += dt;
      this.exerciseState.stepHoldMs = Math.max(0, this.exerciseState.stepHoldMs - dt * 0.45);
    }

    const stepPct = Math.max(0, Math.min(100, (this.exerciseState.stepHoldMs / holdMs) * 100));
    const overallPct = Math.max(0, Math.min(100,
      ((this.exerciseState.step + stepPct / 100) / this.exerciseState.targets.length) * 100
    ));
    const accPct = this.exerciseState.accuracySamples > 0
      ? Math.round((this.exerciseState.accuracyHits / this.exerciseState.accuracySamples) * 100)
      : 100;

    bar.style.width = `${overallPct.toFixed(0)}%`;
    score.textContent = `Score: ${overallPct.toFixed(0)}% • Acc: ${accPct}%`;

    if (midi === expectedMidi && withinTolerance) {
      const remainSec = Math.max(0, (holdMs - this.exerciseState.stepHoldMs) / 1000);
      instruction.textContent = `Hold ${expectedName} for ${remainSec.toFixed(1)}s (${this.exerciseState.step + 1}/${this.exerciseState.targets.length})`;
    } else if (midi !== expectedMidi) {
      instruction.textContent = this.getDirectionalHint(midi, expectedMidi, expectedName);
    } else {
      instruction.textContent = cents < 0
        ? `Tune up slightly for ${expectedName}`
        : `Tune down slightly for ${expectedName}`;
    }

    if (this.exerciseState.stepHoldMs >= holdMs) {
      this.exerciseState.step++;
      this.exerciseState.stepHoldMs = 0;
      this.exerciseState.wrongMs = 0;
      
      if (this.exerciseState.step >= this.exerciseState.targets.length) {
        this.exerciseState.completed = true;
        bar.style.width = '100%';
        score.textContent = 'Score: 100%';
        instruction.textContent = '✅ Success! Exercise complete.';
        this.showReport(now);
      } else {
        const nextName = noteNameForMidi(this.exerciseState.targets[this.exerciseState.step], saSemi);
        instruction.textContent = `Great! Next: ${nextName} (hold ${Math.round(holdMs / 1000)}s)`;
        this.playTargetPromptOnce();
      }
    }
    this.syncPreviewToneToTarget();
  }

  getDirectionalHint(currentMidi, expectedMidi, expectedName) {
    const semitoneGap = expectedMidi - currentMidi;
    if (Math.abs(semitoneGap) >= 10) {
      return semitoneGap > 0
        ? `Jump up an octave to ${expectedName}`
        : `Jump down an octave to ${expectedName}`;
    }
    return semitoneGap > 0
      ? `Go higher to ${expectedName}`
      : `Go lower to ${expectedName}`;
  }

  showReport(now = performance.now()) {
    if (this.exerciseState.reportShown) return;

    const report = document.getElementById('exerciseReport');
    const durationEl = document.getElementById('reportDuration');
    const accuracyEl = document.getElementById('reportAccuracy');
    const completedEl = document.getElementById('reportCompleted');
    const difficultyEl = document.getElementById('reportDifficulty');

    if (!report) return;

    const profile = this.getDifficultyProfile();
    const elapsedSec = Math.max(0, (now - this.exerciseState.sessionStartMs) / 1000);

    let accuracyPct = 0;
    let completedText = '--';
    let scorePct = 0;

    if (this.currentExercise === 'sustained') {
      accuracyPct = this.sustainAccuracySamples > 0
        ? Math.round((this.sustainAccuracyHits / this.sustainAccuracySamples) * 100)
        : 0;
      scorePct = Math.max(0, Math.min(100, Math.round((this.sustainHoldMs / this.getSustainedDurationMs()) * 100)));
      completedText = `${scorePct}% hold`;
    } else {
      accuracyPct = this.exerciseState.accuracySamples > 0
        ? Math.round((this.exerciseState.accuracyHits / this.exerciseState.accuracySamples) * 100)
        : 0;
      const completedNotes = this.exerciseState.completed
        ? this.exerciseState.targets.length
        : this.exerciseState.step;
      completedText = `${completedNotes}/${this.exerciseState.targets.length} notes`;
      scorePct = this.exerciseState.completed ? 100 : Math.round((completedNotes / this.exerciseState.targets.length) * 100);
    }

    if (durationEl) durationEl.textContent = `${elapsedSec.toFixed(1)}s`;
    if (accuracyEl) accuracyEl.textContent = `${accuracyPct}%`;
    if (completedEl) completedEl.textContent = completedText;
    if (difficultyEl) difficultyEl.textContent = profile.label;

    report.style.display = 'block';
    this.exerciseState.reportShown = true;
    this.updateBestStats(this.currentExercise, { scorePct, accuracyPct, elapsedSec });
    this.showCompletionOverlay({
      scorePct,
      accuracyPct,
      elapsedSec,
      difficulty: profile.label,
      completedText
    });
  }

  showCompletionOverlay({ scorePct, accuracyPct, elapsedSec, difficulty, completedText }) {
    this.closeCompletionOverlay();
    const exercise = EXERCISES[this.currentExercise];
    const title = exercise ? `${exercise.icon} ${exercise.name}` : 'Exercise';

    const overlay = document.createElement('div');
    overlay.id = 'exerciseCompleteOverlay';
    overlay.className = 'exercise-complete-overlay';
    overlay.innerHTML = `
      <div class="exercise-complete-card" role="dialog" aria-modal="true" aria-label="Exercise completed">
        <h3 class="exercise-complete-title">🎉 Great Work!</h3>
        <p class="exercise-complete-subtitle">${title} completed successfully.</p>
        <div class="exercise-complete-grid">
          <div class="exercise-complete-item">
            <span class="label">Score</span>
            <span class="value">${scorePct}%</span>
          </div>
          <div class="exercise-complete-item">
            <span class="label">Accuracy</span>
            <span class="value">${accuracyPct}%</span>
          </div>
          <div class="exercise-complete-item">
            <span class="label">Duration</span>
            <span class="value">${elapsedSec.toFixed(1)}s</span>
          </div>
          <div class="exercise-complete-item">
            <span class="label">Difficulty</span>
            <span class="value">${difficulty}</span>
          </div>
        </div>
        <p class="exercise-complete-subtitle">Completed: ${completedText}</p>
        <div class="exercise-complete-actions">
          <button class="btn btn-secondary btn-sm" onclick="exercises.retryFromOverlay()">Retry</button>
          <button class="btn btn-primary btn-sm" onclick="exercises.stop()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  closeCompletionOverlay() {
    const overlay = document.getElementById('exerciseCompleteOverlay');
    if (overlay) overlay.remove();
  }

  retryFromOverlay() {
    this.closeCompletionOverlay();
    this.retry();
  }

  retry() {
    if (!this.currentExercise) return;
    this.closeCompletionOverlay();
    this.start(this.currentExercise);
  }

  stop() {
    this.closeCompletionOverlay();
    this.currentExercise = null;
    const progressDiv = document.getElementById('exerciseProgress');
    if (progressDiv) {
      progressDiv.style.display = 'none';
    }
    const sessionTitle = document.getElementById('exerciseSessionTitle');
    if (sessionTitle) {
      sessionTitle.textContent = 'Exercise Session';
    }
    this.stopPreviewTone();
    if (window.app && typeof window.app.exitExerciseMode === 'function') {
      window.app.exitExerciseMode();
    }
  }

  getCurrentExercise() {
    return this.currentExercise;
  }

  syncDifficultyToSettings() {
    if (!this.currentExercise) return;

    const selectedDifficulty = settings.get('exerciseDifficulty') || 'normal';
    const difficultyKey = EXERCISE_DIFFICULTY[selectedDifficulty] ? selectedDifficulty : 'normal';
    this.exerciseState.difficultyKey = difficultyKey;

    const profile = this.getDifficultyProfile();
    const registerLabel = this.getRegisterLabel();
    const meta = document.querySelector('#exerciseProgress .exercise-meta');
    if (meta) {
      meta.textContent = `Difficulty: ${profile.label} • Octave: ${registerLabel}`;
    }

    const reportDifficulty = document.getElementById('reportDifficulty');
    if (reportDifficulty) {
      reportDifficulty.textContent = profile.label;
    }

    const instruction = document.getElementById('exerciseInstruction');
    if (instruction && !this.exerciseState.completed) {
      instruction.textContent = `${EXERCISES[this.currentExercise]?.description || 'Exercise updated'} (Difficulty: ${profile.label})`;
    }
    this.renderBestStatsBadges();
  }

  syncTargetsToSettings() {
    if (!this.currentExercise) return;

    const exercise = EXERCISES[this.currentExercise];
    if (!exercise || exercise.type === 'sustain' || typeof exercise.getTargets !== 'function') {
      return;
    }
    if (this.exerciseState.completed) return;

    const baseMidi = this.getBaseMidi();
    const nextTargets = exercise.getTargets(baseMidi);
    if (!Array.isArray(nextTargets) || nextTargets.length === 0) return;

    const nextStep = Math.max(0, Math.min(this.exerciseState.step, nextTargets.length - 1));
    this.exerciseState.baseMidi = baseMidi;
    this.exerciseState.targets = nextTargets;
    this.exerciseState.step = nextStep;
    this.exerciseState.stepHoldMs = 0;
    this.exerciseState.wrongMs = 0;
    this.exerciseState.expectedMidi = nextTargets[nextStep];
    this.exerciseState.currentMidi = null;

    const instruction = document.getElementById('exerciseInstruction');
    const saSemi = settings.get('sa') || 0;
    if (instruction) {
      const expectedName = noteNameForMidi(this.exerciseState.expectedMidi, saSemi);
      instruction.textContent = `Retuned target: sing ${expectedName} (${nextStep + 1}/${nextTargets.length})`;
    }

    this.syncPreviewToneToTarget();
    this.playTargetPromptOnce();
    this.renderBestStatsBadges();
  }

  getExerciseVisualHint() {
    if (!this.currentExercise) return null;
    return {
      targetMidi: Number.isFinite(this.exerciseState.expectedMidi) ? this.exerciseState.expectedMidi : null,
      currentMidi: Number.isFinite(this.exerciseState.currentMidi) ? this.exerciseState.currentMidi : null
    };
  }
}

// Create singleton
export const exercises = new ExerciseSystem();

// Make globally accessible
window.exercises = exercises;
