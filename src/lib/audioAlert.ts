// Web Audio API Synthesizer for Prayer Times Alerts

class PrayerAudioAlert {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private stopTimeout: any = null;
  private activeNodes: (OscillatorNode | GainNode)[] = [];

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Nada Dering 1: 10 Menit Sebelum Sholat (Berbunyi selama 2 detik)
  public playReminder10Min(onStop?: () => void) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    const now = this.ctx.currentTime;

    // Harmonic soft chime (A4 + E5)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.exponentialRampToValueAtTime(880, now + 1);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now); // E5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2);
    osc2.stop(now + 2);

    this.activeNodes.push(osc1, osc2, gain);

    this.stopTimeout = setTimeout(() => {
      this.stop();
      onStop?.();
    }, 2000);
  }

  // Nada Dering 2: Waktu Sholat Tiba (Berbunyi selama 30 detik)
  public playAdhanAlarm(durationSeconds = 30, onStop?: () => void) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;

    // Play rhythmic peaceful prayer chime sequence
    const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63]; // C - E - G - C - A - G - E
    let noteIndex = 0;

    const intervalId = setInterval(() => {
      if (!this.isPlaying || !this.ctx) {
        clearInterval(intervalId);
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[noteIndex % notes.length], now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);

      this.activeNodes.push(osc, gain);
      noteIndex++;
    }, 2000);

    this.stopTimeout = setTimeout(() => {
      clearInterval(intervalId);
      this.stop();
      onStop?.();
    }, durationSeconds * 1000);
  }

  // Tombol Matikan Nada Dering
  public stop() {
    this.isPlaying = false;
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node) (node as OscillatorNode).stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const prayerAudio = typeof window !== 'undefined' ? new PrayerAudioAlert() : (null as any);
