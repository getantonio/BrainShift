import { openDB, IDBPDatabase } from 'idb';

export interface AudioRecord {
  id?: number;
  name: string;
  audioData: Blob;
  category: string;
  timestamp: number;
}

interface AudioPlaylist {
  category: string;
  recordings: AudioRecord[];
}

const DB_NAME = 'brain-shift-audio-db';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

class AudioStorageService {
  private db: IDBPDatabase | null = null;

  async initialize() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('category', 'category');
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  async saveRecording(name: string, audioBlob: Blob, category: string): Promise<void> {
    if (!this.db) await this.initialize();

    const record: AudioRecord = {
      name,
      audioData: audioBlob,
      category,
      timestamp: Date.now(),
    };

    await this.db!.add(STORE_NAME, record);
  }

  async getRecordingsByCategory(category: string): Promise<AudioRecord[]> {
    if (!this.db) await this.initialize();

    const tx = this.db!.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('category');
    return await index.getAll(category);
  }

  async getAllCategories(): Promise<string[]> {
    if (!this.db) await this.initialize();

    const tx = this.db!.transaction(STORE_NAME, 'readonly');
    const recordings = await tx.store.getAll();
    const categories = new Set(recordings.map(r => r.category));
    return Array.from(categories);
  }

  async deleteRecording(id: number): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete(STORE_NAME, id);
    
    // After deletion, check if this was the last recording in its category
    const remainingRecordings = await this.db!.getAll(STORE_NAME);
    const categories = new Set(remainingRecordings.map(r => r.category));
    return Array.from(categories);
  }

  async deleteCategory(category: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('category');
    const recordingsToDelete = await index.getAll(category);
    
    for (const recording of recordingsToDelete) {
      await this.db!.delete(STORE_NAME, recording.id!);
    }
  }

  async getRecordingUrl(recording: AudioRecord): Promise<string> {
    // For iOS compatibility, convert Blob to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(recording.audioData);
    });
  }
}

export const audioStorage = new AudioStorageService();
