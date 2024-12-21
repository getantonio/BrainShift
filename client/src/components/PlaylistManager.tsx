import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Playlist } from "./Playlist";
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
    const handleNewRecording = (event: CustomEvent<{ name: string; url: string }>) => {
      setPlaylists(current => {
        const updated = [...current];
        const firstPlaylist = updated[0];
        firstPlaylist.tracks.push({
          name: event.detail.name,
          url: event.detail.url
        });
        return updated;
      });
    };

    window.addEventListener('newRecording' as any, handleNewRecording as any);
    return () => window.removeEventListener('newRecording' as any, handleNewRecording as any);
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
          <Playlist
            key={playlist.id}
            playlist={playlist}
            onDelete={() => deletePlaylist(playlist.id)}
            onRename={(newName) => renamePlaylist(playlist.id, newName)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
