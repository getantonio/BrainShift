import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, Upload, Download, FileAudio } from "lucide-react";
import { Playlist } from "@/components/Playlist";
import { useToast } from "@/hooks/use-toast";

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

  // Load playlists from localStorage on component mount
  useEffect(() => {
    const loadSavedPlaylists = async () => {
      const savedPlaylists = localStorage.getItem('audioPlaylists');
      if (!savedPlaylists) return;

      try {
        const parsed = JSON.parse(savedPlaylists);
        const reconstructedPlaylists = await Promise.all(
          parsed.map(async (playlist: PlaylistData) => {
            const reconstructedTracks = await Promise.all(
              playlist.tracks.map(async (track) => {
                if (track.url.startsWith('data:')) {
                  try {
                    // Create a new blob from the data URL
                    const base64Response = await fetch(track.url);
                    if (!base64Response.ok) throw new Error('Failed to fetch audio data');
                    const audioBlob = await base64Response.blob();
                    
                    // Verify the blob is valid audio
                    const validationAudio = new Audio();
                    validationAudio.src = URL.createObjectURL(audioBlob);
                    
                    await new Promise((resolve, reject) => {
                      validationAudio.onloadedmetadata = resolve;
                      validationAudio.onerror = () => reject(new Error('Invalid audio data'));
                      
                      // Set a timeout in case the audio never loads
                      setTimeout(() => reject(new Error('Audio load timeout')), 5000);
                    });
                    
                    // If we get here, the audio is valid
                    return {
                      ...track,
                      url: URL.createObjectURL(audioBlob)
                    };
                  } catch (error) {
                    console.error('Failed to reconstruct track:', error);
                    toast({
                      title: "Warning",
                      description: `Failed to load track: ${track.name}`,
                      variant: "destructive"
                    });
                    return null;
                  }
                }
                return track;
              })
            );

            const validTracks = reconstructedTracks.filter(Boolean);
            if (validTracks.length < reconstructedTracks.length) {
              toast({
                title: "Warning",
                description: `Some tracks in playlist "${playlist.name}" could not be loaded`,
                variant: "destructive"
              });
            }

            return {
              ...playlist,
              tracks: validTracks
            };
          })
        );

        setPlaylists(reconstructedPlaylists);
        
        if (reconstructedPlaylists.some(p => p.tracks.length > 0)) {
          toast({
            title: "Playlists loaded",
            description: "Your saved playlists have been restored"
          });
        }
      } catch (error) {
        console.error('Failed to load playlists:', error);
        toast({
          title: "Error",
          description: "Failed to load saved playlists",
          variant: "destructive"
        });
      }
    };

    loadSavedPlaylists();
  }, []);

  const savePlaylist = async (playlistId?: number) => {
    try {
      const playlistsToSave = playlistId 
        ? playlists.filter(p => p.id === playlistId)
        : playlists;

      // Convert all blob URLs to base64 before saving
      const processedPlaylists = await Promise.all(
        playlistsToSave.map(async (playlist) => {
          const processedTracks = [];
          let skippedTracks = 0;
          
          for (const track of playlist.tracks) {
            if (!track?.url || !track?.name) {
              console.error('Invalid track data:', track);
              skippedTracks++;
              continue;
            }

            try {
              // If the track URL is already a data URL, verify it and use it directly
              if (track.url.startsWith('data:audio/')) {
                processedTracks.push(track);
                continue;
              }

              // For blob URLs, try to convert them to data URLs
              if (track.url.startsWith('blob:')) {
                try {
                  // Add timeout to fetch operation
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);

                  const response = await fetch(track.url, { signal: controller.signal });
                  clearTimeout(timeoutId);

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  const blob = await response.blob();
                  
                  // Verify blob is audio
                  if (!blob.type.startsWith('audio/')) {
                    throw new Error('Invalid audio format');
                  }

                  // Create a temporary audio element to verify the blob
                  const audio = new Audio();
                  const objectUrl = URL.createObjectURL(blob);
                  
                  try {
                    await new Promise((resolve, reject) => {
                      audio.onloadedmetadata = resolve;
                      audio.onerror = () => reject(new Error('Invalid audio data'));
                      audio.src = objectUrl;
                      
                      // Set a timeout for audio validation
                      setTimeout(() => reject(new Error('Audio validation timeout')), 3000);
                    });

                    const base64Url = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          resolve(reader.result);
                        } else {
                          reject(new Error('Failed to read blob as DataURL'));
                        }
                      };
                      reader.onerror = () => reject(reader.error);
                      reader.readAsDataURL(blob);
                    });

                    processedTracks.push({
                      name: track.name,
                      url: base64Url
                    });
                  } finally {
                    URL.revokeObjectURL(objectUrl);
                  }
                } catch (error) {
                  console.error(`Failed to process blob URL for track: ${track.name}`, error);
                  skippedTracks++;
                  continue;
                }
              } else {
                // For other URL types (e.g., remote URLs), store as is
                processedTracks.push(track);
              }
            } catch (error) {
              console.error('Error processing track:', error);
              skippedTracks++;
              continue;
            }
          }

          if (skippedTracks > 0) {
            toast({
              title: "Warning",
              description: `${skippedTracks} track(s) could not be saved in playlist "${playlist.name}"`,
              variant: "destructive"
            });
          }

          return {
            ...playlist,
            tracks: processedTracks
          };
        })
      );

      if (playlistId) {
        // Save single playlist
        const existingPlaylists = JSON.parse(localStorage.getItem('audioPlaylists') || '[]');
        const updatedPlaylists = existingPlaylists.map((p: PlaylistData) =>
          p.id === playlistId ? processedPlaylists[0] : p
        );
        localStorage.setItem('audioPlaylists', JSON.stringify(updatedPlaylists));
        toast({
          title: "Playlist saved",
          description: `${processedPlaylists[0].name} has been saved successfully`
        });
      } else {
        // Save all playlists
        localStorage.setItem('audioPlaylists', JSON.stringify(processedPlaylists));
        toast({
          title: "All playlists saved",
          description: "Your playlists have been saved successfully"
        });
      }
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

  const deletePlaylist = (id: number) => {
    setPlaylists(currentPlaylists => {
      if (currentPlaylists.length <= 1) {
        toast({
          title: "Cannot delete",
          description: "At least one playlist must remain",
          variant: "destructive"
        });
        return currentPlaylists;
      }

      // Create a shallow copy for immutability
      return currentPlaylists.filter(playlist => playlist.id !== id);
    });
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