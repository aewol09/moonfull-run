export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmEnabled = true;
  private isSfxEnabled = true;

  private isBgmPlaying = false;
  private bgmIntervalId: number | null = null;
  private bgmStep = 0;

  constructor(bgmEnabled = true, sfxEnabled = true) {
    this.isBgmEnabled = bgmEnabled;
    this.isSfxEnabled = sfxEnabled;
  }

  private initContext(): void {
    if (this.ctx) return;
    try {
      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
      if (!AudioCtx || typeof AudioCtx !== 'function') return;
      this.ctx = new AudioCtx();

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.isBgmEnabled ? 0.25 : 0;
      this.bgmGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.isSfxEnabled ? 0.6 : 0;
      this.sfxGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Moonfall Run: Web Audio API not supported', e);
    }
  }

  public ensureContext(): void {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setBgmEnabled(enabled: boolean): void {
    this.isBgmEnabled = enabled;
    if (this.bgmGain) {
      this.bgmGain.gain.value = enabled ? 0.25 : 0;
    }
    if (enabled && !this.isBgmPlaying) {
      this.startBgm();
    } else if (!enabled && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.isSfxEnabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.value = enabled ? 0.6 : 0;
    }
  }

  // --- Procedural Sound Effects ---

  public playClick(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playJump(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlide(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  public playCoin(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [1318.5, 1760.0]; // E6, A6 bell harmonic

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.26);
    });
  }

  public playHit(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playShieldBreak(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.4, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.31);
    });
  }

  public playGameOver(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chords = [392.0, 329.63, 261.63, 196.0]; // G4 -> E4 -> C4 -> G3 minor descent

    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.4, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.36);
    });
  }

  // --- Hero Unique Active Skills SFX ---

  public playSkillSlash(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);

    // Crystalline shimmer overtone
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1760, now);
    shimmer.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    sGain.gain.setValueAtTime(0.3, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    shimmer.connect(sGain);
    sGain.connect(this.sfxGain);
    shimmer.start(now);
    shimmer.stop(now + 0.29);
  }

  public playSkillStarfall(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Cascading celestial chime arpeggio: C6, E6, G6, B6, C7
    const notes = [1046.5, 1318.5, 1567.98, 1975.5, 2093.0];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.35, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.36);
    });
  }

  public playSkillSolarDash(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.3);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playSkillShadow(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playChestFanfare(isJackpot = false): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = isJackpot
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98] // Grand Major Fanfare
      : [523.25, 659.25, 783.99, 1046.5];                 // Harmonious chime

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(isJackpot ? 0.45 : 0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.42);
    });
  }

  public playGachaPortal(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.56);
  }

  public playStageFanfare(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [440.0, 554.37, 659.25, 880.0]; // A Major Herald
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.35, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.36);
    });
  }

  public playReviveFanfare(): void {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chords = [329.63, 415.3, 493.88, 659.25, 987.77]; // E major ascension
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.4, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.46);
    });
  }

  // --- Procedural Celestial Arpeggio BGM ---

  public startBgm(): void {
    if (!this.isBgmEnabled || this.isBgmPlaying) return;
    this.ensureContext();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Mystic chord progression in A minor / D dorian:
    // A3, C4, E4, B4, C5, A4, E4, D4
    const scale = [220.0, 261.63, 329.63, 493.88, 523.25, 440.0, 329.63, 293.66];

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || !this.isBgmPlaying || !this.isBgmEnabled) return;
      const freq = scale[this.bgmStep % scale.length];
      this.bgmStep++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.36);
    }, 240); // 125 BPM eighth notes
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}
