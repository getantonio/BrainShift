import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Playlist } from "@/components/Playlist";
import { useToast } from "@/hooks/use-toast";

interface PlaylistData {
  id: number;
  name: string;
  tracks: Array<{ name: string; url: string; }>;
}

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([
    { id: 1, name: "Playlist 1", tracks: [] }
  ]);
  const { toast } = useToast();

  // Load playlists from localStorage on component mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('audioPlaylists');
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists);
        // Recreate blob URLs for each track
        const reconstructedPlaylists = parsed.map((playlist: PlaylistData) => ({
          ...playlist,
          tracks: playlist.tracks.map(track => {
            // Convert base64 to blob and create new URL
            if (track.url.startsWith('data:')) {
              const response = fetch(track.url)
                .then(res => res.blob())
                .then(blob => {
                  const newUrl = URL.createObjectURL(blob);
                  // Update the track's URL in the playlists state
                  setPlaylists(current =>
                    current.map(p =>
                      p.id === playlist.id
                        ? {
                            ...p,
                            tracks: p.tracks.map(t =>
                              t.name === track.name ? { ...t, url: newUrl } : t
                            ),
                          }
                        : p
                    )
                  );
                });
              return track;
            }
            return track;
          }),
        }));
        setPlaylists(reconstructedPlaylists);
        toast({
          title: "Playlists loaded",
          description: "Your saved playlists have been restored"
        });
      } catch (error) {
        console.error('Failed to load playlists:', error);
        toast({
          title: "Error",
          description: "Failed to load saved playlists",
          variant: "destructive"
        });
      }
    }
  }, []);

  const savePlaylist = async (playlistId?: number) => {
    try {
      const playlistsToSave = playlistId 
        ? playlists.filter(p => p.id === playlistId)
        : playlists;

      // Convert all blob URLs to base64 before saving
      const processedPlaylists = await Promise.all(
        playlistsToSave.map(async (playlist) => {
          const processedTracks = await Promise.all(
            playlist.tracks.map(async (track) => {
              if (track.url.startsWith('blob:')) {
                const response = await fetch(track.url);
                const blob = await response.blob();
                return new Promise<{ name: string; url: string }>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve({
                    name: track.name,
                    url: reader.result as string
                  });
                  reader.readAsDataURL(blob);
                });
              }
              return track;
            })
          );

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
    const customEvent = event as CustomEvent<{ name: string; url: string }>;
      setPlaylists(current => {
        const updated = [...current];
        const firstPlaylist = updated[0];
        firstPlaylist.tracks.push({
          name: customEvent.detail.name,
          url: customEvent.detail.url
        });
        return updated;
      });
    };

    window.addEventListener('trackMove', handleTrackMove as EventListener);
    window.addEventListener('newRecording' as any, handleNewRecording as any);
    return () => {
      window.removeEventListener('trackMove', handleTrackMove as EventListener);
      window.removeEventListener('newRecording', handleNewRecording as EventListener);
    };
  }, []);

  const addPlaylist = () => {
    const newId = Math.max(...playlists.map(p => p.id)) + 1;
    const newName = `Playlist ${newId}`;
    setPlaylists([...playlists, { id: newId, name: newName, tracks: [] }]);
    toast({
      title: "Playlist created",
      description: `${newName} has been added`
    });
  };

  const deletePlaylist = (id: number) => {
    setPlaylists(playlists.filter(p => p.id !== id));
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
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Playlists</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={() => savePlaylist()}
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
          >
            💾 Save All
          </Button>
          <Button
            onClick={addPlaylist}
            variant="outline"
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Playlist
          </Button>
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
                    <Plus className="mr-2 h-4 w-4" />
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