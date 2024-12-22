
class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;
  private musicNode: MediaElementAudioNode | null = null;
  private gainNode: GainNode | null = null;

  private constructor() {}

  static getInstance() {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  async playBackgroundMusic(url: string, volume = 0.3) {
    if (!this.audioContext) this.initialize();
    
    const audio = new Audio(url);
    audio.loop = true;
    
    this.musicNode = this.audioContext!.createMediaElementSource(audio);
    this.musicNode.connect(this.gainNode!);
    
    try {
      await audio.play();
    } catch (error) {
      console.error('Failed to play background music:', error);
    }
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  stop() {
    if (this.musicNode) {
      this.musicNode.disconnect();
      this.musicNode = null;
    }
  }
}

export const audioContextManager = AudioContextManager.getInstance();
