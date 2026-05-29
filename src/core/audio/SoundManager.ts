import { ColorState } from '../types/Chromatic';

export class SoundManager {
  private static ctx: AudioContext | null = null;

  /**
   * Safe getter retrieving cross-browser AudioContext safely in DOM contexts.
   */
  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    return this.ctx;
  }

  /**
   * Procedural synthesizer triggering short frequency sweeps dependent on active ColorState notes.
   * 
   * @param colorState The new player target colorstate
   */
  public static playPhaseShiftSound(colorState: ColorState) {
    const audioCtx = this.getContext();
    if (!audioCtx) return;

    // Browser gesture security sweep
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Map color states to distinct frequency pitches (Rose=160Hz, Emerald=320Hz, Blue=480Hz)
    let freq = 160;
    if (colorState === ColorState.GREEN) freq = 320;
    if (colorState === ColorState.BLUE) freq = 480;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    // Dynamic exponential ramp sweep for game-feel ("juice")
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.12);

    // Dynamic linear gain decay to prevent crackle clicks
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  }

  /**
   * Procedural alarm synthesizer triggering descending sawtooth waves on player dissolves.
   */
  public static playDeathSound() {
    const audioCtx = this.getContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    // Dramatic descending sweeping alarm pitch
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.32);

    gain.gain.setValueAtTime(0.20, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.32);
  }
}
