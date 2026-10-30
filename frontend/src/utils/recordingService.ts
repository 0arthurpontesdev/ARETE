// Meeting Recording Service with Screen Capture, Audio Mixing, and Auto-Download

export interface RecordingResult {
  url: string;
  filename: string;
  blob: Blob;
  sizeBytes: number;
  durationSeconds: number;
  createdAt: string;
  mimeType: string;
  separateAudioUrl?: string;
  separateAudioFilename?: string;
  cloudUrl?: string;
}

export interface StartRecordingOptions {
  roomId: string;
  mode?: 'local' | 'cloud';
  saveSeparateAudio?: boolean;
  onTick?: (seconds: number) => void;
  onEndedByUser?: () => void;
}

export class MeetingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioChunks: Blob[] = [];
  private captureStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private timerId: any = null;
  private elapsedSeconds = 0;
  private isPaused = false;
  private startTime = 0;
  private options: StartRecordingOptions | null = null;

  public isRecordingActive(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state !== 'inactive';
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public async start(options: StartRecordingOptions): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('Gravação não suportada neste ambiente.');
    }

    this.options = options;
    this.recordedChunks = [];
    this.audioChunks = [];
    this.elapsedSeconds = 0;
    this.isPaused = false;

    // 1. Capture screen/window/tab stream
    let screenStream: MediaStream;
    try {
      if (navigator.mediaDevices?.getDisplayMedia) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            frameRate: { ideal: 30, max: 60 },
          } as any,
          audio: true,
        });
      } else {
        throw new Error('Navegador não suporta getDisplayMedia.');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Permissão de gravação de tela cancelada pelo usuário.');
      }
      throw err;
    }

    this.captureStream = screenStream;

    // 2. Obtain local microphone stream for full two-way audio mix
    let micStream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.micStream = micStream;
      }
    } catch (micErr) {
      console.warn('Microfone não disponível para mixagem de áudio na gravação:', micErr);
    }

    // 3. Audio Mixing using Web Audio API
    let mixedStream = screenStream;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const dest = this.audioContext.createMediaStreamDestination();
        let hasAudioTracks = false;

        // Mix screen/tab audio (system sound & remote peer voices)
        if (screenStream.getAudioTracks().length > 0) {
          const screenAudioSource = this.audioContext.createMediaStreamSource(screenStream);
          screenAudioSource.connect(dest);
          hasAudioTracks = true;
        }

        // Mix local user microphone
        if (micStream && micStream.getAudioTracks().length > 0) {
          const micSource = this.audioContext.createMediaStreamSource(micStream);
          micSource.connect(dest);
          hasAudioTracks = true;
        }

        // Combine video track from screen with mixed audio tracks
        const finalTracks: MediaStreamTrack[] = [
          ...screenStream.getVideoTracks(),
          ...(hasAudioTracks ? dest.stream.getAudioTracks() : screenStream.getAudioTracks()),
        ];
        mixedStream = new MediaStream(finalTracks);
      }
    } catch (mixErr) {
      console.warn('Falha na mixagem Web Audio, utilizando stream padrão:', mixErr);
      mixedStream = screenStream;
    }

    // Handle user clicking native browser "Stop sharing" bar
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        if (this.options?.onEndedByUser) {
          this.options.onEndedByUser();
        }
      };
    }

    // 4. Determine best supported recording MIME type
    const candidateTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMimeType = candidateTypes.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';

    // 5. Initialize main MediaRecorder
    const recorder = new MediaRecorder(mixedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps crisp HD
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    recorder.start(1000); // chunk every 1 second
    this.mediaRecorder = recorder;
    this.startTime = Date.now();

    // 6. Optional: Separate Audio Track Recording
    if (options.saveSeparateAudio && micStream && micStream.getAudioTracks().length > 0) {
      try {
        const audioMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const audioRec = new MediaRecorder(micStream, { mimeType: audioMimeType });
        audioRec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        audioRec.start(1000);
        this.audioRecorder = audioRec;
      } catch (e) {
        console.warn('Erro ao inicializar gravador de áudio separado:', e);
      }
    }

    // 7. Start Elapsed Seconds Timer
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.elapsedSeconds += 1;
        this.options?.onTick?.(this.elapsedSeconds);
      }
    }, 1000);
  }

  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      if (this.audioRecorder && this.audioRecorder.state === 'recording') {
        this.audioRecorder.pause();
      }
    }
  }

  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      if (this.audioRecorder && this.audioRecorder.state === 'paused') {
        this.audioRecorder.resume();
      }
    }
  }

  public stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Nenhuma gravação ativa no momento.'));
        return;
      }

      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      const recorder = this.mediaRecorder;
      const audioRec = this.audioRecorder;
      const finalDuration = this.elapsedSeconds;
      const roomId = this.options?.roomId || 'sala';
      const isCloud = this.options?.mode === 'cloud';

      recorder.onstop = async () => {
        try {
          // Cleanup capture and mic tracks
          this.captureStream?.getTracks().forEach((t) => t.stop());
          this.micStream?.getTracks().forEach((t) => t.stop());
          if (this.audioContext) {
            try {
              await this.audioContext.close();
            } catch (_) {}
            this.audioContext = null;
          }

          // Build finalized video Blob
          const mimeType = recorder.mimeType || 'video/webm';
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
          const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `Zoom_Gravacao_${roomId}_${dateStr}.${extension}`;
          const url = URL.createObjectURL(videoBlob);

          // Handle separate audio track if recorded
          let separateAudioUrl: string | undefined;
          let separateAudioFilename: string | undefined;
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            separateAudioFilename = `Zoom_Audio_Microfone_${roomId}_${dateStr}.webm`;
            separateAudioUrl = URL.createObjectURL(audioBlob);

            // Auto-download separate audio
            this.triggerBrowserDownload(separateAudioUrl, separateAudioFilename);
          }

          // Trigger automatic browser download for video
          this.triggerBrowserDownload(url, filename);

          // Handle Cloud Recording: Upload to backend
          let cloudUrl: string | undefined;
          if (isCloud) {
            try {
              cloudUrl = await this.uploadToCloud(videoBlob, filename, roomId);
            } catch (cloudErr) {
              console.warn('Erro ao fazer upload da gravação na nuvem:', cloudErr);
            }
          }

          const result: RecordingResult = {
            url,
            filename,
            blob: videoBlob,
            sizeBytes: videoBlob.size,
            durationSeconds: finalDuration,
            createdAt: new Date().toISOString(),
            mimeType,
            separateAudioUrl,
            separateAudioFilename,
            cloudUrl,
          };

          this.mediaRecorder = null;
          this.audioRecorder = null;
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      if (audioRec && audioRec.state !== 'inactive') {
        audioRec.stop();
      }

      if (recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        recorder.onstop?.(new Event('stop'));
      }
    });
  }

  private triggerBrowserDownload(url: string, filename: string): void {
    if (typeof document === 'undefined') return;
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 150);
    } catch (e) {
      console.warn('Falha no trigger de download do navegador:', e);
    }
  }

  private async uploadToCloud(blob: Blob, filename: string, roomId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('roomId', roomId);
    formData.append('senderName', 'Gravação Automática Zoom');

    const res = await fetch('http://localhost:4000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Falha no upload da gravação: ${res.statusText}`);
    }

    const json = await res.json();
    return json.file?.url ? `http://localhost:4000${json.file.url}` : '';
  }
}

// Global singleton instance for easy access across the application
export const meetingRecorder = new MeetingRecorder();
