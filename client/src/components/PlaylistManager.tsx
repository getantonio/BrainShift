import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, Upload, Download, FileAudio } from "lucide-react";
import { Playlist } from "@/components/Playlist";
import { useToast } from "@/hooks/use-toast";
import { audioStorage } from "@/lib/audioStorage";
import type { AudioRecord } from "@/lib/audioStorage";

interface PlaylistData {
  id: number;
  name: string;
  tracks: Array<{ name: string; url: string; }>;
}

interface PlaylistManagerProps {
  allCollapsed?: boolean;
}

export function PlaylistManager({ allCollapsed = false }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([
    { id: Date.now(), name: "Playlist 1", tracks: [] }
  ]);
  const { toast } = useToast();

  // Load playlists from IndexedDB on component mount
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        // Initialize storage with retries for iOS
        let retryCount = 0;
        const maxRetries = 3;
        let lastError;

        while (retryCount < maxRetries) {
          try {
            await audioStorage.initialize();
            break;
          } catch (error) {
            lastError = error;
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retry ${retryCount} initializing IndexedDB...`);
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          }
        }

        if (retryCount === maxRetries) {
          throw new Error(`Failed to initialize after ${maxRetries} attempts: ${lastError?.message}`);
        }

        // Load saved playlist metadata
        let savedPlaylists = await audioStorage.getPlaylists();
        
        // If no playlists exist, create a default one
        if (!savedPlaylists || savedPlaylists.length === 0) {
          savedPlaylists = [{
            id: Date.now(),
            name: "My Playlist",
            order: 0
          }];
          await audioStorage.savePlaylists(savedPlaylists);
        }

        // Load recordings for each playlist with individual error handling
        const loadedPlaylists = await Promise.all(
          savedPlaylists.map(async (playlist) => {
            try {
              const recordings = await audioStorage.getRecordingsByCategory(playlist.name);
              const tracks = await Promise.all(
                recordings.map(async (recording) => {
                  try {
                    return {
                      name: recording.name,
                      url: await audioStorage.getRecordingUrl(recording)
                    };
                  } catch (error) {
                    console.error(`Failed to load recording ${recording.name}:`, error);
                    return null;
                  }
                })
              );

              return {
                id: playlist.id,
                name: playlist.name,
                tracks: tracks.filter(track => track !== null)
              };
            } catch (error) {
              console.error(`Failed to load playlist ${playlist.name}:`, error);
              return {
                id: playlist.id,
                name: playlist.name,
                tracks: []
              };
            }
          })
        );

        setPlaylists(loadedPlaylists);
        
        if (loadedPlaylists.some(p => p.tracks.length > 0)) {
          toast({
            title: "Playlists loaded",
            description: "Your playlists and recordings have been loaded"
          });
        }
      } catch (error) {
        console.error('Failed to load playlists:', error);
        toast({
          title: "Error",
          description: `Failed to load your playlists: ${error.message}`,
          variant: "destructive"
        });
      }
    };

    loadPlaylists();

    // Listen for updates to recordings
    const handleRecordingsUpdate = () => {
      loadPlaylists();
    };

    window.addEventListener('recordingsUpdated', handleRecordingsUpdate);
    return () => {
      window.removeEventListener('recordingsUpdated', handleRecordingsUpdate);
    };
  }, []);

  const savePlaylist = async (playlistId?: number) => {
    try {
      // Save playlist metadata
      const playlistMetadata = playlists.map((playlist, index) => ({
        id: playlist.id,
        name: playlist.name,
        order: index
      }));
      
      await audioStorage.savePlaylists(playlistMetadata);

      // Update playlist contents
      const updatedPlaylists = [...playlists];
      
      for (const playlist of updatedPlaylists) {
        try {
          const recordings = await audioStorage.getRecordingsByCategory(playlist.name);
          if (recordings && recordings.length > 0) {
            playlist.tracks = await Promise.all(
              recordings.map(async recording => ({
                name: recording.name,
                url: await audioStorage.getRecordingUrl(recording)
              }))
            );
          }
        } catch (error) {
          console.error(`Failed to load recordings for playlist ${playlist.name}:`, error);
          continue;
        }
      }

      setPlaylists(updatedPlaylists);

      toast({
        title: "Playlists saved",
        description: "Your playlists have been updated successfully"
      });
    } catch (error) {
      console.error('Failed to save playlists:', error);
      toast({
        title: "Error",
        description: "Failed to save playlists",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const handleTrackMove = (event: Event) => {
      const customEvent = event as CustomEvent<{ track: { name: string; url: string }, targetPlaylistId: number }>;
      const { track, targetPlaylistId } = customEvent.detail;
      
      setPlaylists(current => {
        const updated = [...current];
        
        // Find and remove from source playlist
        const sourcePlaylistIndex = updated.findIndex(p => 
          p.tracks.some(t => t.url === track.url && t.name === track.name)
        );
        
        if (sourcePlaylistIndex !== -1) {
          const trackIndex = updated[sourcePlaylistIndex].tracks.findIndex(
            t => t.url === track.url && t.name === track.name
          );
          if (trackIndex !== -1) {
            updated[sourcePlaylistIndex].tracks.splice(trackIndex, 1);
          }
        }
        
        // Add to target playlist
        const targetPlaylist = updated.find(p => p.id === targetPlaylistId);
        if (targetPlaylist) {
          targetPlaylist.tracks.push(track);
        }
        
        return updated;
      });
    };

    const handleNewRecording = (event: Event) => {
      const customEvent = event as CustomEvent<{ 
        name: string; 
        url: string; 
        category: string;
      }>;
      
      console.log('Received recording event:', customEvent.detail);
      
      setPlaylists(current => {
        const updated = [...current];
        let targetPlaylist = updated.find(p => p.name.toLowerCase() === customEvent.detail.category.toLowerCase());
        
        // If playlist doesn't exist, create it
        if (!targetPlaylist) {
          const newId = Math.max(...updated.map(p => p.id)) + 1;
          targetPlaylist = {
            id: newId,
            name: customEvent.detail.category,
            tracks: []
          };
          updated.push(targetPlaylist);
        }

        targetPlaylist.tracks.push({
          name: customEvent.detail.name,
          url: customEvent.detail.url
        });

        toast({
          title: "Recording added",
          description: `Added to ${targetPlaylist.name} playlist`
        });

        return updated;
      });
    };

    const handlePlaylistRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{
        callback: (playlists: Array<{ id: number; name: string }>) => void;
      }>;
      
      customEvent.detail.callback(
        playlists.map(p => ({ id: p.id, name: p.name }))
      );
    };

    window.addEventListener('trackMove', handleTrackMove as EventListener);
    window.addEventListener('newRecording', handleNewRecording as EventListener);
    window.addEventListener('requestPlaylists', handlePlaylistRequest as EventListener);
    
    return () => {
      window.removeEventListener('trackMove', handleTrackMove as EventListener);
      window.removeEventListener('newRecording', handleNewRecording as EventListener);
      window.removeEventListener('requestPlaylists', handlePlaylistRequest as EventListener);
    };
  }, []);

  const addPlaylist = () => {
    const newId = Math.max(...playlists.map(p => p.id)) + 1;
    // Find the first available number starting from 1
    let counter = 1;
    while (playlists.some(p => p.name === `Playlist ${counter}`)) {
      counter++;
    }
    const newName = `Playlist ${counter}`;
    setPlaylists([...playlists, { id: newId, name: newName, tracks: [] }]);
    toast({
      title: "Playlist created",
      description: `${newName} has been added`
    });
  };

  const deletePlaylist = async (id: number) => {
    try {
      const currentPlaylists = [...playlists];
      if (currentPlaylists.length <= 1) {
        toast({
          title: "Cannot delete",
          description: "At least one playlist must remain",
          variant: "destructive"
        });
        return;
      }

      const playlistToDelete = currentPlaylists.find(p => p.id === id);
      if (!playlistToDelete) return;

      // Delete all recordings in this category from storage
      await audioStorage.deleteCategory(playlistToDelete.name);
      
      // Update playlists in state and storage
      const updatedPlaylists = currentPlaylists.filter(playlist => playlist.id !== id);
      setPlaylists(updatedPlaylists);
      
      // Save updated playlist metadata
      await audioStorage.savePlaylists(
        updatedPlaylists.map((playlist, index) => ({
          id: playlist.id,
          name: playlist.name,
          order: index
        }))
      );

      toast({
        title: "Playlist deleted",
        description: `${playlistToDelete.name} has been removed`
      });
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive"
      });
    }
  };

  const renamePlaylist = (id: number, newName: string) => {
    setPlaylists(playlists.map(p => 
      p.id === id ? { ...p, name: newName } : p
    ));
  };

  const updateTrack = (
    playlistId: number,
    trackIndex: number,
    newName?: string,
    moveToPlaylistId?: number
  ): void => {
    setPlaylists(current => {
      const updated = [...current];
      const sourcePlaylist = updated.find(p => p.id === playlistId);
      
      if (!sourcePlaylist) return current;

      if (moveToPlaylistId !== undefined) {
        const targetPlaylist = updated.find(p => p.id === moveToPlaylistId);
        if (!targetPlaylist) return current;

        const [track] = sourcePlaylist.tracks.splice(trackIndex, 1);
        targetPlaylist.tracks.push(track);
      } else if (newName) {
        sourcePlaylist.tracks[trackIndex].name = newName;
      }

      return updated;
    });
  };

  const deleteTrack = (playlistId: number, trackIndex: number) => {
    setPlaylists(current => {
      const updated = [...current];
      const playlist = updated.find(p => p.id === playlistId);
      if (playlist) {
        playlist.tracks.splice(trackIndex, 1);
      }
      return updated;
    });
  };

  const handleFileUpload = (playlistId: number, files: FileList) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      playlist.tracks.push({
        name: file.name,
        url: url
      });
    });
    setPlaylists([...playlists]);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Playlists</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={() => savePlaylist()}
            variant="outline"
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
          >
            <Save className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.multiple = true;
                fileInput.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files?.length) return;

                  let importedCount = 0;
                  let errorCount = 0;

                  for (const file of Array.from(files)) {
                    try {
                      const text = await file.text();
                      const importedData = JSON.parse(text);
                      
                      // Handle both single playlist and multiple playlist files
                      if (Array.isArray(importedData)) {
                        // Multiple playlists
                        setPlaylists(current => [...current, ...importedData]);
                        importedCount += importedData.length;
                      } else if (importedData.name && Array.isArray(importedData.tracks)) {
                        // Single playlist
                        setPlaylists(current => [...current, importedData]);
                        importedCount += 1;
                      } else {
                        throw new Error('Invalid playlist format');
                      }
                    } catch (error) {
                      console.error(`Failed to import ${file.name}:`, error);
                      errorCount++;
                    }
                  }

                  if (importedCount > 0) {
                    toast({
                      title: "Playlists imported",
                      description: `Successfully imported ${importedCount} playlist${importedCount !== 1 ? 's' : ''}`
                    });
                  }
                  
                  if (errorCount > 0) {
                    toast({
                      title: "Import errors",
                      description: `Failed to import ${errorCount} file${errorCount !== 1 ? 's' : ''}`,
                      variant: "destructive"
                    });
                  }
                };
                fileInput.click();
              }}
              variant="outline"
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                const playlistsJson = JSON.stringify(playlists, null, 2);
                const blob = new Blob([playlistsJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'playlists.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              variant="outline"
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={addPlaylist}
              variant="outline"
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {playlists.map(playlist => (
          <div key={playlist.id} className="space-y-2">
            <Playlist
              playlist={playlist}
              playlists={playlists.map(p => ({ id: p.id, name: p.name }))}
              onDelete={() => deletePlaylist(playlist.id)}
              onRename={(newName) => renamePlaylist(playlist.id, newName)}
              onTrackUpdate={(trackIndex, newName, moveToPlaylistId) => 
                updateTrack(playlist.id, trackIndex, newName, moveToPlaylistId)}
              onTrackDelete={(trackIndex) => deleteTrack(playlist.id, trackIndex)}
              onSave={() => savePlaylist(playlist.id)}
              allCollapsed={allCollapsed}
            />
            <div className="flex justify-end">
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                id={`upload-${playlist.id}`}
                onChange={(e) => e.target.files && handleFileUpload(playlist.id, e.target.files)}
              />
              <label htmlFor={`upload-${playlist.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
                  asChild
                >
                  <span>
                    <FileAudio className="h-4 w-4 mr-2" />
                    Add Audio Files
                  </span>
                </Button>
              </label>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}