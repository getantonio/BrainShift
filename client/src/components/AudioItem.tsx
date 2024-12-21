import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Download, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AudioItemProps {
  track: {
    name: string;
    url: string;
  };
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

export function AudioItem({ track, onRename, onDelete }: AudioItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(track.url));
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(track.name);

  const playAudio = () => {
    audio.play();
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  };

  const stopAudio = () => {
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  const handleRename = () => {
    if (isRenaming && newName.trim() && onRename) {
      onRename(newName.trim());
      setIsRenaming(false);
    } else {
      setIsRenaming(true);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
      {isRenaming ? (
        <Input
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          className="max-w-[200px]"
          autoFocus
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              handleRename();
            }
          }}
        />
      ) : (
        <span className="text-sm font-medium">{track.name}</span>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={isPlaying ? stopAudio : playAudio}
          className="h-8 w-8"
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRename}
          className="h-8 w-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <a
          href={track.url}
          download={`${track.name}.mp3`}
          className="inline-flex"
        >
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </a>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            stopAudio();
            if (onDelete) {
              onDelete();
            }
          }}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
