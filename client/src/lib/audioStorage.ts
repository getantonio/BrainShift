import { openDB, IDBPDatabase } from 'idb';

export interface AudioRecord {
  id?: number;
  name: string;
  audioData: Blob | string;
  category: string;
  timestamp: number;
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
  private debug = true;

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[AudioStorage]', ...args);
    }
  }

  async initialize() {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB is not supported in this browser');
      }

      // Add a small delay for iOS Safari to properly initialize IndexedDB
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        this.log('iOS device detected, adding initialization delay');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          // Create or update stores based on version
          if (oldVersion < 1) {
            db.createObjectStore(RECORDINGS_STORE, { 
              keyPath: 'id', 
              autoIncrement: true 
            }).createIndex('category', 'category');
          }

          if (oldVersion < 2) {
            db.createObjectStore(PLAYLISTS_STORE, {
              keyPath: 'id',
              autoIncrement: true
            }).createIndex('order', 'order');
          }
        },
      });

      this.log('Database initialized successfully');
      return this.db;
    } catch (error) {
      this.log('Failed to initialize database:', error);
      throw error;
    }
  }

  async saveRecording(name: string, audioBlob: Blob, category: string): Promise<void> {
    try {
      if (!this.db) {
        this.log('Database not initialized, initializing now');
        await this.initialize();
      }

      // Ensure the blob has the correct MIME type
      const audioType = audioBlob.type || 'audio/wav';
      const processedBlob = audioBlob.type === audioType ? 
        audioBlob : 
        new Blob([await audioBlob.arrayBuffer()], { type: audioType });

      // Convert blob to base64 for better storage compatibility
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert audio to base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(processedBlob);
      });

      const record: AudioRecord = {
        name,
        audioData: base64Data,
        category,
        timestamp: Date.now(),
      };

      // Use a single transaction for both operations
      const tx = this.db!.transaction([RECORDINGS_STORE, PLAYLISTS_STORE], 'readwrite');

      await Promise.all([
        tx.objectStore(RECORDINGS_STORE).add(record),
        tx.objectStore(PLAYLISTS_STORE).getAll().then(async (playlists) => {
          if (!playlists.some(p => p.name === category)) {
            await tx.objectStore(PLAYLISTS_STORE).add({
              id: Date.now(),
              name: category,
              order: playlists.length
            });
          }
        })
      ]);

      await tx.done;
      this.log('Recording saved successfully:', name);
    } catch (error) {
      this.log('Failed to save recording:', error);
      throw error;
    }
  }

  async getRecordingsByCategory(category: string): Promise<AudioRecord[]> {
    try {
      if (!this.db) {
        this.log('Database not initialized, initializing now');
        await this.initialize();
      }

      const tx = this.db!.transaction(RECORDINGS_STORE, 'readonly');
      const index = tx.store.index('category');
      const recordings = await index.getAll(category);

      this.log(`Retrieved ${recordings.length} recordings for category:`, category);
      return recordings;
    } catch (error) {
      this.log('Failed to get recordings by category:', error);
      throw error;
    }
  }

  async getRecordingUrl(recording: AudioRecord): Promise<string> {
    try {
      if (typeof recording.audioData === 'string') {
        // If already a data URL, verify and return
        if (recording.audioData.startsWith('data:')) {
          return recording.audioData;
        }
        throw new Error('Invalid audio data format');
      }

      // If it's a Blob, convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert audio to URL'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(recording.audioData as Blob);
      });
    } catch (error) {
      this.log('Failed to get recording URL:', error);
      throw error;
    }
  }

  async savePlaylists(playlists: PlaylistMetadata[]): Promise<void> {
    try {
      if (!this.db) {
        this.log('Database not initialized, initializing now');
        await this.initialize();
      }

      const tx = this.db!.transaction(PLAYLISTS_STORE, 'readwrite');
      await tx.store.clear();
      await Promise.all(playlists.map(playlist => tx.store.add(playlist)));
      await tx.done;

      this.log('Playlists saved successfully');
    } catch (error) {
      this.log('Failed to save playlists:', error);
      throw error;
    }
  }

  async getPlaylists(): Promise<PlaylistMetadata[]> {
    try {
      if (!this.db) {
        this.log('Database not initialized, initializing now');
        await this.initialize();
      }

      const tx = this.db!.transaction(PLAYLISTS_STORE, 'readonly');
      const playlists = await tx.store.getAll();
      this.log(`Retrieved ${playlists.length} playlists`);
      return playlists.sort((a, b) => a.order - b.order);
    } catch (error) {
      this.log('Failed to get playlists:', error);
      throw error;
    }
  }

  async deleteCategory(category: string): Promise<void> {
    try {
      if (!this.db) {
        this.log('Database not initialized, initializing now');
        await this.initialize();
      }

      const tx = this.db!.transaction(RECORDINGS_STORE, 'readwrite');
      const index = tx.store.index('category');
      const keys = await index.getAllKeys(category);
      await Promise.all(keys.map(key => tx.store.delete(key)));
      await tx.done;

      this.log(`Category ${category} deleted successfully`);
    } catch (error) {
      this.log('Failed to delete category:', error);
      throw error;
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

  async renamePlaylistWithFiles(oldName: string, newName: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction([RECORDINGS_STORE, PLAYLISTS_STORE], 'readwrite');
    
    try {
      // Update recordings
      const recordingsStore = tx.objectStore(RECORDINGS_STORE);
      const index = recordingsStore.index('category');
      const recordings = await index.getAll(oldName);
      
      // Update each recording's category
      for (const recording of recordings) {
        const updatedRecording = { ...recording, category: newName };
        await recordingsStore.put(updatedRecording);
      }
      
      // Update playlist metadata
      const playlistsStore = tx.objectStore(PLAYLISTS_STORE);
      const playlists = await playlistsStore.getAll();
      const playlistToUpdate = playlists.find(p => p.name === oldName);
      
      if (playlistToUpdate) {
        playlistToUpdate.name = newName;
        await playlistsStore.put(playlistToUpdate);
      }
      
      await tx.done;
      this.log(`Successfully renamed playlist from ${oldName} to ${newName}`);
    } catch (error) {
      this.log('Failed to rename playlist:', error);
      throw error;
    }
  }
}

export const audioStorage = new AudioStorageService();
