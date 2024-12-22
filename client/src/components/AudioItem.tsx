import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Download, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(track?.name || '');

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    
    if (track?.url) {
      const newAudio = new Audio();
      newAudio.preload = "auto";
      
      // For iOS, we need to set the source after user interaction
      const initAudio = async () => {
        try {
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            newAudio.src = track.url;
            const source = audioContext.createMediaElementSource(newAudio);
            source.connect(audioContext.destination);
          }
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        } catch (error) {
          console.error('Audio initialization error:', error);
        }
      };

      // Handle iOS touch events
      const touchStartHandler = async () => {
        await initAudio();
        document.removeEventListener('touchstart', touchStartHandler);
      };

      document.addEventListener('touchstart', touchStartHandler);
      newAudio.addEventListener('play', initAudio);
      
      setAudio(newAudio);
      
      return () => {
        newAudio.pause();
        newAudio.src = "";
        document.removeEventListener('touchstart', initAudio);
        newAudio.removeEventListener('play', initAudio);
        if (audioContext) {
          audioContext.close();
        }
      };
    }
  }, [track?.url]);

  const playAudio = async () => {
    if (!audio || !track?.url) return;
    try {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            audio.currentTime = 0;
          };
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        title: "Error",
        description: "Failed to play audio. Please try tapping the screen first.",
        variant: "destructive"
      });
    }
  };

  const stopAudio = () => {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } catch (error) {
      console.error('Stop audio error:', error);
    }
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
    <div 
      className="flex items-center justify-between p-2 rounded-lg bg-gray-800"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(track));
      }}
    >
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
        <span className="text-sm font-medium text-gray-300">{track.name}</span>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={isPlaying ? stopAudio : playAudio}
          className="h-8 w-8 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRename}
          className="h-8 w-8 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
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
            className="h-8 w-8 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
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
          className="h-8 w-8 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}