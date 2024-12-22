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
            } catch (error: any) {
              console.error('Error creating recordings store:', error);
              // If store already exists, ignore the error
              if (!error.message?.includes('already exists')) {
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
            } catch (error: any) {
              console.error('Error creating playlists store:', error);
              // If store already exists, ignore the error
              if (!error.message?.includes('already exists')) {
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
    } catch (error: any) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async saveRecording(name: string, audioBlob: Blob, category: string): Promise<void> {
    try {
      if (!this.db) await this.initialize();

      // Convert to base64 for better persistence
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Store as base64 string
      const audioData = base64Data;

      const record: AudioRecord = {
        name,
        audioData,
        category,
        timestamp: Date.now(),
      };

      // Use a single transaction for both operations
      const tx = this.db!.transaction([RECORDINGS_STORE, PLAYLISTS_STORE], 'readwrite');
      
      try {
        // Save the recording
        await tx.objectStore(RECORDINGS_STORE).add(record);

        // Ensure the playlist exists
        const playlists = await tx.objectStore(PLAYLISTS_STORE).getAll();
        if (!playlists.some(p => p.name === category)) {
          await tx.objectStore(PLAYLISTS_STORE).add({
            id: Date.now(),
            name: category,
            order: playlists.length
          });
        }

        // Wait for the transaction to complete
        await tx.done;
      } catch (error) {
        console.error('Transaction failed:', error);
        throw new Error(`Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw new Error(`Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecordingsByCategory(category: string): Promise<AudioRecord[]> {
    try {
      if (!this.db) await this.initialize();

      const tx = this.db!.transaction(RECORDINGS_STORE, 'readonly');
      const index = tx.store.index('category');
      const recordings = await index.getAll(category);

      // Verify each recording's data integrity
      const validRecordings = recordings.filter(recording => {
        try {
          return recording && recording.audioData instanceof Blob;
        } catch (error) {
          console.error(`Invalid recording data for ${recording?.name}:`, error);
          return false;
        }
      });

      if (validRecordings.length < recordings.length) {
        console.warn(`Found ${recordings.length - validRecordings.length} invalid recordings in category ${category}`);
      }

      return validRecordings;
    } catch (error) {
      console.error(`Failed to get recordings for category ${category}:`, error);
      throw new Error(`Failed to load recordings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    return new Promise((resolve, reject) => {
      try {
        if (!recording.audioData) {
          throw new Error('No audio data found');
        }
        
        // If already base64, return directly
        if (typeof recording.audioData === 'string' && recording.audioData.startsWith('data:')) {
          resolve(recording.audioData);
          return;
        }

        const audioBlob = recording.audioData instanceof Blob ? 
          recording.audioData : 
          new Blob([recording.audioData], { type: 'audio/wav' });

        const reader = new FileReader();
        
        reader.onloadend = () => {
          if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
            resolve(reader.result);
          } else {
            // Convert to base64 for iOS compatibility
            const base64Reader = new FileReader();
            base64Reader.onloadend = () => {
              if (typeof base64Reader.result === 'string') {
                resolve(base64Reader.result);
              } else {
                reject(new Error('Failed to create base64 URL'));
              }
            };
            base64Reader.readAsDataURL(audioBlob);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read audio data'));
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error('Error in getRecordingUrl:', error);
        reject(error);
      }
    });
  }

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
