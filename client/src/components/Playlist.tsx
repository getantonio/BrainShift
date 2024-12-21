import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioItem } from "./AudioItem";
import { Edit2, Trash2, Play, Repeat, Square, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PlaylistProps {
  playlist: {
    id: number;
    name: string;
    tracks: Array<{ name: string; url: string; }>;
  };
  playlists: Array<{ id: number; name: string; }>;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onTrackUpdate: (trackIndex: number, newName?: string, moveToPlaylistId?: number) => void;
  onTrackDelete: (trackIndex: number) => void;
}

export function Playlist({ 
  playlist, 
  playlists, 
  onDelete, 
  onRename, 
  onTrackUpdate, 
  onTrackDelete 
}: PlaylistProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(playlist.name);
  const [isLooping, setIsLooping] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const handleRename = () => {
    if (isEditing && newName.trim()) {
      onRename(newName.trim());
    }
    setIsEditing(!isEditing);
  };

  const [isShuffled, setIsShuffled] = useState(false);
  const [playbackOrder, setPlaybackOrder] = useState<number[]>([]);

  const updatePlaybackOrder = () => {
    const indices = Array.from({ length: playlist.tracks.length }, (_, i) => i);
    if (isShuffled) {
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    setPlaybackOrder(indices);
  };

  const playPlaylist = () => {
    stopPlaylist();
    if (playlist.tracks.length === 0) return;
    
    updatePlaybackOrder();
    const audio = new Audio(playlist.tracks[playbackOrder[0]].url);
    setCurrentAudio(audio);
    setCurrentTrackIndex(0);
    
    audio.onended = () => {
      const nextIndex = (currentTrackIndex + 1) % playbackOrder.length;
      if (nextIndex === 0 && !isLooping) {
        stopPlaylist();
        return;
      }
      setCurrentTrackIndex(nextIndex);
      const nextTrackIndex = playbackOrder[nextIndex];
      const nextAudio = new Audio(playlist.tracks[nextTrackIndex].url);
      setCurrentAudio(nextAudio);
      nextAudio.play();
    };
    
    audio.play();
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    updatePlaybackOrder();
  };

  const stopPlaylist = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  return (
    <Card 
      className="bg-gray-700/50 border-gray-600"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgb(75, 85, 99, 0.5)';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'rgb(75, 85, 99, 0.5)';
        try {
          const trackData = JSON.parse(e.dataTransfer.getData('text/plain'));
          const event = new CustomEvent('trackMove', {
            detail: { track: trackData, targetPlaylistId: playlist.id }
          });
          window.dispatchEvent(event);
        } catch (err) {
          console.error('Failed to parse dragged track data:', err);
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        {isEditing ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="max-w-[200px]"
            autoFocus
          />
        ) : (
          <CardTitle className="text-xl">{playlist.name}</CardTitle>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRename}
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {playlist.tracks.map((track, index) => (
            <div key={index} className="relative group">
              <AudioItem
                track={track}
                onRename={(newName) => onTrackUpdate(index, newName)}
                onDelete={() => onTrackDelete(index)}
              />
              {playlists.length > 1 && (
                <div className="absolute right-0 top-0 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    className="text-xs bg-gray-700 border border-gray-600 rounded p-1"
                    onChange={(e) => {
                      const targetPlaylistId = parseInt(e.target.value);
                      if (!isNaN(targetPlaylistId)) {
                        onTrackUpdate(index, undefined, targetPlaylistId);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Move to...</option>
                    {playlists
                      .filter((p) => p.id !== playlist.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={playPlaylist}
            disabled={playlist.tracks.length === 0}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
          >
            <Play className="mr-2 h-4 w-4" />
            Play All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLoop}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 ${
              isLooping ? "ring-2 ring-gray-500" : ""
            }`}
          >
            <Repeat className="mr-2 h-4 w-4" />
            Loop
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShuffle}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 ${
              isShuffled ? "ring-2 ring-gray-500" : ""
            }`}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopPlaylist}
            disabled={!currentAudio}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
