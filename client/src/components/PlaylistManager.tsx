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
        <Button
          onClick={addPlaylist}
          variant="outline"
          className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Playlist
        </Button>
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
                  className="cursor-pointer"
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