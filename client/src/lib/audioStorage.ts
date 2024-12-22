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
const RECORDINGS_STORE = 'recordings';
const PLAYLISTS_STORE = 'playlists';
const DB_VERSION = 2;

export interface PlaylistMetadata {
  id: number;
  name: string;
  order: number;
}

class AudioStorageService {
  private db: IDBPDatabase | null = null;

  async initialize() {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB is not supported in this browser');
      }

      // Add a small delay for iOS Safari to properly initialize IndexedDB
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          // Create or update stores based on version
          if (oldVersion < 1) {
            try {
              const recordingsStore = db.createObjectStore(RECORDINGS_STORE, { 
                keyPath: 'id', 
                autoIncrement: true 
              });
              recordingsStore.createIndex('category', 'category');
              recordingsStore.createIndex('timestamp', 'timestamp');
            } catch (error) {
              console.error('Error creating recordings store:', error);
              // If store already exists, ignore the error
              if (!error.message.includes('already exists')) {
                throw error;
              }
            }
          }
          
          if (oldVersion < 2) {
            try {
              const playlistsStore = db.createObjectStore(PLAYLISTS_STORE, {
                keyPath: 'id',
                autoIncrement: true
              });
              playlistsStore.createIndex('order', 'order');
            } catch (error) {
              console.error('Error creating playlists store:', error);
              // If store already exists, ignore the error
              if (!error.message.includes('already exists')) {
                throw error;
              }
            }
          }
        },
        blocked() {
          console.warn('Database upgrade was blocked. Please close other tabs/windows.');
        },
        blocking() {
          console.warn('Database is being blocked by other version.');
        },
        terminated() {
          console.error('Database connection was terminated unexpectedly.');
        }
      });

      // Verify the stores exist
      const transaction = this.db.transaction([RECORDINGS_STORE, PLAYLISTS_STORE], 'readonly');
      await transaction.done;

      return this.db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async saveRecording(name: string, audioBlob: Blob, category: string): Promise<void> {
    if (!this.db) await this.initialize();

    const record: AudioRecord = {
      name,
      audioData: audioBlob,
      category,
      timestamp: Date.now(),
    };

    // Save the recording
    await this.db!.add(RECORDINGS_STORE, record);

    // Ensure the playlist exists
    const tx = this.db!.transaction(PLAYLISTS_STORE, 'readwrite');
    const playlists = await tx.store.getAll();
    
    if (!playlists.some(p => p.name === category)) {
      await tx.store.add({
        id: Date.now(),
        name: category,
        order: playlists.length
      });
    }
  }

  async getRecordingsByCategory(category: string): Promise<AudioRecord[]> {
    if (!this.db) await this.initialize();

    const tx = this.db!.transaction(RECORDINGS_STORE, 'readonly');
    const index = tx.store.index('category');
    return await index.getAll(category);
  }

  async getAllCategories(): Promise<string[]> {
    if (!this.db) await this.initialize();

    const tx = this.db!.transaction(RECORDINGS_STORE, 'readonly');
    const recordings = await tx.store.getAll();
    const categories = new Set(recordings.map(r => r.category));
    return Array.from(categories);
  }

  async deleteRecording(id: number): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete(RECORDINGS_STORE, id);
  }

  async deleteCategory(category: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(RECORDINGS_STORE, 'readwrite');
    const index = tx.store.index('category');
    const recordingsToDelete = await index.getAll(category);
    
    for (const recording of recordingsToDelete) {
      await this.db!.delete(RECORDINGS_STORE, recording.id!);
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

  // New playlist methods
  async savePlaylists(playlists: PlaylistMetadata[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(PLAYLISTS_STORE, 'readwrite');
    await tx.store.clear(); // Clear existing playlists
    
    for (const playlist of playlists) {
      await tx.store.add(playlist);
    }
  }

  async getPlaylists(): Promise<PlaylistMetadata[]> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(PLAYLISTS_STORE, 'readonly');
    const playlists = await tx.store.getAll();
    return playlists.sort((a, b) => a.order - b.order);
  }
}

export const audioStorage = new AudioStorageService();
