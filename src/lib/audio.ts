/**
 * Web Audio API synthesizer for playing high-quality alerts and sounds offline.
 * Highly robust, zero dependencies, and doesn't load external audio files.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCompletionSound(type: 'bowl' | 'digital' | 'bell' | 'none', volume: number) {
    if (type === 'none' || volume <= 0) return;

    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(this.ctx.destination);

      if (type === 'bowl') {
        // Synthesize a Zen Singing Bowl
        // Fundamental low pitch with high-frequency clean harmonics
        const frequencies = [150, 220, 440, 560, 680, 880];
        const decays = [4.0, 3.5, 2.5, 1.8, 1.2, 0.8];
        const gains = [0.8, 0.5, 0.3, 0.2, 0.15, 0.08];

        frequencies.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          // Zen bowls have some slight pitch modulation
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq + (idx % 2 === 0 ? 1 : -1) * 2, now + decays[idx]);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(gains[idx], now + 0.08); // soft attack
          gain.gain.exponentialRampToValueAtTime(0.001, now + decays[idx]); // long decay

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + decays[idx] + 0.1);
        });

      } else if (type === 'bell') {
        // Synthesize a crisp high-pitched desk bell strike
        const frequencies = [600, 1200, 2400, 3600];
        const gains = [0.6, 0.3, 0.15, 0.05];
        const decays = [1.5, 1.2, 0.8, 0.4];

        frequencies.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(gains[idx], now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + decays[idx]);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + decays[idx] + 0.1);
        });

        // Add a tiny bit of white noise burst at the start for the "strike" click
        const bufferSize = this.ctx.sampleRate * 0.02; // 20ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.05);

      } else if (type === 'digital') {
        // Digital Chirp (Double crisp beep)
        const playBeep = (time: number) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, time);
          osc.frequency.exponentialRampToValueAtTime(1800, time + 0.08);

          gain.gain.setValueAtTime(0.4, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(time);
          osc.stop(time + 0.15);
        };

        playBeep(now);
        playBeep(now + 0.15); // Second beep
      }
    } catch (error) {
      console.warn('Failed to play completion sound via Web Audio API:', error);
    }
  }

  playTickSound(volume: number) {
    if (volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(volume * 0.1, now); // super quiet click
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015); // 15ms duration

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // Ignore click failures
    }
  }
}

export const synth = new AudioSynth();
