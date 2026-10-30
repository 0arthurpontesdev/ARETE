// Audio effects, sound testing, and microphone volume analysis

/**
 * Plays a pleasant 4-tone ascending chime (C5, E5, G5, C6)
 * to test speaker output without relying on external media files.
 */
export function playSpeakerTestChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const duration = 0.22;
      const startTime = ctx.currentTime + 0.05;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + index * duration);

        gain.gain.setValueAtTime(0, startTime + index * duration);
        gain.gain.linearRampToValueAtTime(0.2, startTime + index * duration + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + (index + 1) * duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + index * duration);
        osc.stop(startTime + (index + 1) * duration + 0.05);
      });

      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
        resolve();
      }, (notes.length * duration + 0.3) * 1000);
    } catch (e) {
      console.warn('AudioContext playback error:', e);
      resolve();
    }
  });
}

/**
 * Returns MediaTrackConstraints based on noise suppression level and original sound mode.
 */
export function getAudioConstraints(
  noiseSuppression: 'low' | 'medium' | 'high' = 'medium',
  originalSound = false,
  deviceId?: string
): MediaTrackConstraints {
  if (originalSound) {
    return {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: { ideal: 48000 },
      channelCount: { ideal: 2 },
    };
  }

  return {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    echoCancellation: true,
    noiseSuppression: noiseSuppression !== 'low',
    autoGainControl: true,
  };
}

/**
 * Real-time microphone audio level analyzer using Web Audio AnalyserNode.
 */
export class AudioMeter {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;
  private onLevelChange: (level: number) => void;
  private isRunning = false;

  constructor(onLevelChange: (level: number) => void) {
    this.onLevelChange = onLevelChange;
  }

  public start(stream: MediaStream) {
    if (this.isRunning) this.stop();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.source = this.ctx.createMediaStreamSource(stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source.connect(this.analyser);
      this.isRunning = true;

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const update = () => {
        if (!this.isRunning || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average / RMS energy
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize roughly between 0 and 100
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        this.onLevelChange(normalized);
        this.animationId = requestAnimationFrame(update);
      };

      this.animationId = requestAnimationFrame(update);
    } catch (e) {
      console.warn('AudioMeter start failed:', e);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (_) {}
      this.source = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
    this.onLevelChange(0);
  }
}
