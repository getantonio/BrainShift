import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Download, Trash2 } from "lucide-react";

interface AudioItemProps {
  track: {
    name: string;
    url: string;
  };
}

export function AudioItem({ track }: AudioItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(track.url));

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

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
      <span className="text-sm font-medium">{track.name}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={isPlaying ? stopAudio : playAudio}
          className="h-8 w-8"
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
            // Remove track from playlist logic would go here
          }}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
