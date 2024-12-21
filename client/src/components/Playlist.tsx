import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioItem } from "./AudioItem";
import { Edit2, Trash2, Play, Repeat, Square } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PlaylistProps {
  playlist: {
    id: number;
    name: string;
    tracks: Array<{ name: string; url: string; }>;
  };
  onDelete: () => void;
  onRename: (newName: string) => void;
}

export function Playlist({ playlist, onDelete, onRename }: PlaylistProps) {
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

  const playPlaylist = () => {
    stopPlaylist();
    if (playlist.tracks.length === 0) return;
    
    const audio = new Audio(playlist.tracks[0].url);
    setCurrentAudio(audio);
    setCurrentTrackIndex(0);
    
    audio.onended = () => {
      const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
      if (nextIndex === 0 && !isLooping) {
        stopPlaylist();
        return;
      }
      setCurrentTrackIndex(nextIndex);
      const nextAudio = new Audio(playlist.tracks[nextIndex].url);
      setCurrentAudio(nextAudio);
      nextAudio.play();
    };
    
    audio.play();
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
    <Card className="bg-gray-700/50 border-gray-600">
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
            <AudioItem key={index} track={track} />
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={playPlaylist}
            disabled={playlist.tracks.length === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            Play All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLoop}
            className={isLooping ? "bg-emerald-700" : ""}
          >
            <Repeat className="mr-2 h-4 w-4" />
            Loop
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopPlaylist}
            disabled={!currentAudio}
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
