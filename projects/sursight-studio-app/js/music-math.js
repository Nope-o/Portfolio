
// ===== Music Mathematics =====

import { A4_FREQUENCY, NOTE_NAMES, SARGAM_BASE } from './constants.js';

// Convert frequency to MIDI note number
export function freqToMidi(freq) {
  return 69 + 12 * Math.log2(freq / A4_FREQUENCY);
}

// Convert MIDI note number to frequency
export function midiToFreq(midi) {
  return A4_FREQUENCY * Math.pow(2, (midi - 69) / 12);
}

// Get nearest note information from frequency
export function nearestNote(freq) {
  const midi = freqToMidi(freq);
  const roundedMidi = Math.round(midi);
  const cents = Math.min(50, Math.max(-50, (midi - roundedMidi) * 100));
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const name = NOTE_NAMES[noteIndex];
  const octave = Math.floor(roundedMidi / 12) - 1;
  const targetHz = midiToFreq(roundedMidi);
  
  return {
    midi: roundedMidi,
    name,
    octave,
    cents,
    targetHz
  };
}

// Create a Sargam mapper function for a given tonic
export function makeSargamMapper(tonicSemitone) {
  return (midi) => {
    const semitoneOffset = ((midi - tonicSemitone) % 12 + 12) % 12;
    const sargam = SARGAM_BASE.find(s => s.semis === semitoneOffset);
    return sargam || { name: "--", hindi: "--" };
  };
}

// Get transposed note parts for MIDI number, where tonicSemitone is treated as C.
export function notePartsForMidi(midi, tonicSemitone = 0) {
  const tonic = Number.isFinite(tonicSemitone) ? tonicSemitone : 0;
  const displayMidi = midi - tonic;
  const noteIndex = ((displayMidi % 12) + 12) % 12;
  const name = NOTE_NAMES[noteIndex];
  const octave = Math.floor(displayMidi / 12) - 1;
  return { name, octave, midi: displayMidi };
}

// Get note name for MIDI number (optionally transposed so tonic is C).
export function noteNameForMidi(midi, tonicSemitone = 0) {
  const note = notePartsForMidi(midi, tonicSemitone);
  return `${note.name}${note.octave}`;
}

// Calculate cents difference between two frequencies
export function centsBetween(freq1, freq2) {
  return 1200 * Math.log2(freq1 / freq2);
}

// Check if frequency is within tolerance of target
export function isInTolerance(freq, targetFreq, toleranceCents) {
  const cents = Math.abs(centsBetween(freq, targetFreq));
  return cents <= toleranceCents;
}
