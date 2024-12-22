import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioItem } from "@/components/AudioItem";
import { Edit2, Trash2, Play, Repeat, Square, Shuffle, ChevronDown, Download, Upload, Music, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

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
  onSave: () => void;
  allCollapsed?: boolean;
}

export function Playlist({ 
  playlist, 
  playlists, 
  onDelete, 
  onRename, 
  onTrackUpdate, 
  onTrackDelete,
  onSave,
  allCollapsed
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
    setCurrentTrackIndex(0);
    
    const playTrack = async (index: number) => {
    try {
      if (!playlist.tracks.length) {
        throw new Error('Empty playlist');
      }

      const effectiveIndex = isShuffled ? playbackOrder[index] : index;
      if (effectiveIndex === undefined || !playlist.tracks[effectiveIndex]) {
        throw new Error('Invalid track index');
      }

      const track = playlist.tracks[effectiveIndex];
      if (!track.url) {
        throw new Error('Track URL is missing');
      }

      // Clean up existing audio before creating new one
      if (currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio.src = '';
          URL.revokeObjectURL(currentAudio.src);
          currentAudio.remove();
        } catch (cleanupError) {
          console.error('Error cleaning up previous audio:', cleanupError);
        }
      }

      const audio = new Audio();
      
      // Set up error handling before setting src
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        stopPlaylist();
      };
      
      audio.onended = () => {
        const nextIndex = (index + 1) % playlist.tracks.length;
        if (nextIndex === 0 && !isLooping) {
          stopPlaylist();
          return;
        }
        setCurrentTrackIndex(nextIndex);
        playTrack(nextIndex).catch(error => {
          console.error('Error playing next track:', error);
          stopPlaylist();
        });
      };

      // Load and play the audio
      audio.src = track.url;
      setCurrentAudio(audio);
      
      try {
        await audio.play();
      } catch (playError) {
        console.error('Error playing audio:', playError);
        stopPlaylist();
        throw playError;
      }
    } catch (error) {
      console.error('Error in playTrack:', error);
      stopPlaylist();
      throw error;
    }
  };
    
    playTrack(0);
  };

  const toggleShuffle = () => {
    const newIsShuffled = !isShuffled;
    setIsShuffled(newIsShuffled);
    
    // Always update the playback order when toggling shuffle
    const indices = Array.from({ length: playlist.tracks.length }, (_, i) => i);
    if (newIsShuffled) {
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    setPlaybackOrder(indices);
    
    // If currently playing, restart with new order
    if (currentAudio) {
      const wasPlaying = !currentAudio.paused;
      const currentTime = currentAudio.currentTime;
      stopPlaylist();
      
      if (wasPlaying) {
        // Start playing from current track in new order
        const currentTrack = playlist.tracks[currentTrackIndex];
        const newIndex = indices.findIndex(i => playlist.tracks[i] === currentTrack);
        setCurrentTrackIndex(newIndex >= 0 ? newIndex : 0);
        
        setTimeout(() => {
          playPlaylist();
          if (currentAudio) {
            currentAudio.currentTime = currentTime;
          }
        }, 100);
      }
    }
  };

  const stopPlaylist = () => {
    if (currentAudio) {
      try {
        // First pause the audio
        currentAudio.pause();
        
        // Remove all event listeners
        currentAudio.onended = null;
        currentAudio.onplay = null;
        currentAudio.onerror = null;
        
        // Reset the audio state
        currentAudio.currentTime = 0;
        
        // Clear the source and release memory
        const currentSrc = currentAudio.src;
        currentAudio.src = '';
        currentAudio.load(); // Force browser to release resources
        
        // Revoke the object URL if it exists
        if (currentSrc.startsWith('blob:')) {
          URL.revokeObjectURL(currentSrc);
        }
        
        // Remove the element and clear the reference
        currentAudio.remove();
        setCurrentAudio(null);
      } catch (error) {
        console.error('Error stopping playlist:', error);
      }
    }
    // Reset playback state
    setCurrentTrackIndex(0);
  };

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        stopPlaylist();
      }
    };
  }, []);

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const { toast } = useToast();

  const exportPlaylist = () => {
    const playlistData = JSON.stringify({ ...playlist }, null, 2);
    const blob = new Blob([playlistData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Playlist exported",
      description: `${playlist.name} has been exported successfully`
    });
  };

  const importPlaylist = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const importedPlaylist = JSON.parse(text);
          if (!importedPlaylist.tracks || !Array.isArray(importedPlaylist.tracks)) {
            throw new Error('Invalid playlist format');
          }
          // Update current playlist with imported data
          onRename(importedPlaylist.name);
          importedPlaylist.tracks.forEach((track: any) => {
            if (track.name && track.url) {
              playlist.tracks.push(track);
            }
          });
          toast({
            title: "Playlist imported",
            description: `Successfully imported tracks to ${playlist.name}`
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to import playlist",
            variant: "destructive"
          });
        }
      }
    };
    fileInput.click();
  };

  const [isOpen, setIsOpen] = useState(true);
  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(false);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.5); // Initial volume
  const audioContextManager = new AudioContextManager(); // Assuming this is defined elsewhere

  useEffect(() => {
    if (allCollapsed !== undefined) {
      setIsOpen(!allCollapsed);
    }
  }, [allCollapsed]);

  return (
    <Collapsible 
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-gray-700/50 border border-gray-600 rounded-lg"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'rgb(255, 255, 255, 0.5)';
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'transparent';
        try {
          const trackData = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (!trackData.name || !trackData.url) {
            throw new Error('Invalid track data');
          }
          const event = new CustomEvent('trackMove', {
            detail: { track: trackData, targetPlaylistId: playlist.id }
          });
          window.dispatchEvent(event);
        } catch (err) {
          console.error('Failed to parse dragged track data:', err);
          toast({
            title: "Error",
            description: "Failed to move track",
            variant: "destructive"
          });
        }
      }}
    >
      <div className="p-4 flex flex-row items-center justify-between">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            {isEditing ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="max-w-[200px]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <CardTitle className="text-xl text-white">{playlist.name}</CardTitle>
            )}
          </div>
        </CollapsibleTrigger>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              importPlaylist();
            }}
            className="h-8 w-8 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border-gray-600"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              exportPlaylist();
            }}
            className="h-8 w-8 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border-gray-600"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleRename();
            }}
            className="h-8 w-8 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border-gray-600"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="h-8 w-8 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border-gray-600"
          >
            💾
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border-gray-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CollapsibleContent>
        <div className="p-4 space-y-2">
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
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLoop}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 ${
              isLooping ? "ring-2 ring-gray-500" : ""
            }`}
          >
            <Repeat className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShuffle}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 ${
              isShuffled ? "ring-2 ring-gray-500" : ""
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopPlaylist}
            disabled={!currentAudio}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isBackgroundMusicPlaying) {
                audioContextManager.stop();
                setIsBackgroundMusicPlaying(false);
              } else if (playlist.tracks.length > 0) {
                audioContextManager.playBackgroundMusic(playlist.tracks[0].url, backgroundMusicVolume);
                setIsBackgroundMusicPlaying(true);
              }
            }}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 ${
              isBackgroundMusicPlaying ? "ring-2 ring-gray-500" : ""
            }`}
          >
            <Music className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={backgroundMusicVolume * 100}
              onChange={(e) => {
                const newVolume = Number(e.target.value) / 100;
                setBackgroundMusicVolume(newVolume);
                audioContextManager.setVolume(newVolume);
              }}
              className="w-20"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

class AudioContextManager {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private audioSource: MediaElementAudioSourceNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  playBackgroundMusic(url: string, volume: number) {
    fetch(url)
      .then(response => response.blob())
      .then(blob => URL.createObjectURL(blob))
      .then(url => {
        const audio = new Audio(url);
        audio.loop = true; // Set looping for background music
        this.audioSource = this.audioContext.createMediaElementSource(audio);
        this.audioSource.connect(this.gainNode);
        this.setVolume(volume);
        audio.play();
      })
      .catch(error => console.error("Error playing background music:", error));
  }

  stop() {
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
      const audio = this.audioSource?.mediaElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }

  setVolume(volume: number) {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}