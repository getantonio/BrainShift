import { detect } from '@/lib/utils';

interface AudioCompatibilityOptions {
  autoResume?: boolean;
  forceFormat?: string;
  enableVisualization?: boolean;
}

class AudioCompatibilityLayer {
  private static instance: AudioCompatibilityLayer;
  private audioContext: AudioContext | null = null;
  private audioSources: Map<string, MediaElementAudioSourceNode> = new Map();
  private analyzers: Map<string, AnalyserNode> = new Map();
  private blobUrls: Map<string, string> = new Map();
  private initialized = false;
  private autoResume: boolean;
  private preferredFormat: string;
  private enableVisualization: boolean;
  private isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  private constructor(options: AudioCompatibilityOptions = {}) {
    this.autoResume = options.autoResume ?? true;
    this.preferredFormat = options.forceFormat ?? 'audio/wav';
    this.enableVisualization = options.enableVisualization ?? true;
    
    // Setup iOS-specific handlers
    if (this.isiOS) {
      document.addEventListener('touchstart', () => this.ensureAudioContext(), { once: true });
      document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
  }

  static getInstance(options?: AudioCompatibilityOptions): AudioCompatibilityLayer {
    if (!AudioCompatibilityLayer.instance) {
      AudioCompatibilityLayer.instance = new AudioCompatibilityLayer(options);
    }
    return AudioCompatibilityLayer.instance;
  }

  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // iOS requires sound to be triggered from a user interaction
      if (this.isiOS) {
        const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(this.audioContext.destination);
        source.start();
      }
    }

    if (this.audioContext.state === 'suspended' && this.autoResume) {
      try {
        await this.audioContext.resume();
        
        // Additional iOS wake-up sequence
        if (this.isiOS) {
          const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
          const source = this.audioContext.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(this.audioContext.destination);
          source.start();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error resuming audio context:', error);
        // Try to recreate context if resume fails
        this.audioContext = null;
        return this.ensureAudioContext();
      }
    }

    return this.audioContext;
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.audioSources.forEach((source) => {
        try {
          (source.mediaElement as HTMLAudioElement).pause();
        } catch (error) {
          console.error('Error pausing audio:', error);
        }
      });
    }
  }

  async createAudioElement(url: string, id: string): Promise<HTMLAudioElement> {
    const audio = new Audio();
    
    try {
      // Clean up any existing blob URL for this ID
      if (this.blobUrls.has(id)) {
        URL.revokeObjectURL(this.blobUrls.get(id)!);
        this.blobUrls.delete(id);
      }

      // Set up audio element for iOS
      if (this.isiOS) {
        audio.preload = 'auto';
        audio.autoplay = false;
        audio.setAttribute('webkit-playsinline', 'true');
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('x-webkit-airplay', 'allow');
      }

      // Convert data URL to blob URL or use direct URL
      if (url.startsWith('data:')) {
        const [header, base64Data] = url.split(',');
        const contentType = header.match(/:(.*?);/)?.[1] || 'audio/wav';
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrls.set(id, blobUrl);
        audio.src = blobUrl;
      } else {
        audio.src = url;
      }

      // iOS requires user interaction to start audio context
      if (this.isiOS) {
        const unlockiOSAudio = async () => {
          try {
            const context = await this.ensureAudioContext();
            await context.resume();
            
            const emptyBuffer = context.createBuffer(1, 1, 22050);
            const source = context.createBufferSource();
            source.buffer = emptyBuffer;
            source.connect(context.destination);
            source.start(0);
            source.stop(0.001);

            // Try to play and immediately pause
            await audio.play();
            audio.pause();
            audio.currentTime = 0;
          } catch (error) {
            console.error('Error unlocking iOS audio:', error);
          }
        };

        document.addEventListener('touchstart', unlockiOSAudio, { once: true });
      }

      // Wait for audio to be loaded with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 10000);

        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve();
        };

        audio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load audio'));
        };

        audio.load();
      });

      if (this.enableVisualization) {
        const context = await this.ensureAudioContext();
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        
        source.connect(analyser);
        analyser.connect(context.destination);
        
        this.audioSources.set(id, source);
        this.analyzers.set(id, analyser);
      }

      return audio;
    } catch (error) {
      console.error('Error creating audio element:', error);
      throw error;
    }
  }

  getAnalyser(id: string): AnalyserNode | undefined {
    return this.analyzers.get(id);
  }

  async play(id: string): Promise<void> {
    const source = this.audioSources.get(id);
    if (source?.mediaElement) {
      await this.ensureAudioContext();
      await (source.mediaElement as HTMLAudioElement).play();
    }
  }

  pause(id: string): void {
    const source = this.audioSources.get(id);
    if (source?.mediaElement) {
      (source.mediaElement as HTMLAudioElement).pause();
    }
  }

  cleanup(id: string): void {
    const source = this.audioSources.get(id);
    if (source?.mediaElement) {
      const audio = source.mediaElement as HTMLAudioElement;
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audio.src = '';
      this.audioSources.delete(id);
      this.analyzers.delete(id);
    }
  }

  async convertAudioData(audioData: Blob): Promise<Blob> {
    // Ensure correct audio format for iOS
    if (this.isiOS && audioData.type !== this.preferredFormat) {
      const arrayBuffer = await audioData.arrayBuffer();
      return new Blob([arrayBuffer], { type: this.preferredFormat });
    }
    return audioData;
  }
}

export const audioCompatibility = AudioCompatibilityLayer.getInstance();