import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';

interface AudioContextState {
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  isPlaying: boolean;
  isRecording: boolean;
  startPlayback: (audioElement: HTMLAudioElement) => void;
  stopPlayback: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

const AudioContextState = createContext<AudioContextState | null>(null);

// Keep track of connected audio elements to prevent duplicate connections
const connectedElements = new WeakSet<HTMLAudioElement>();

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      // @ts-ignore - webkitAudioContext is not in the type definitions
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Ensure analyzer is connected to destination
    if (analyzerRef.current && !analyzerRef.current.context) {
      analyzerRef.current.connect(audioContextRef.current.destination);
    }
  };

  const startPlayback = (audioElement: HTMLAudioElement) => {
    setupAudioContext();
    if (!audioContextRef.current || !analyzerRef.current) return;

    try {
      // Clean up previous source if it exists
      if (currentSourceRef.current) {
        currentSourceRef.current.disconnect();
        currentSourceRef.current = null;
      }

      // Only create a new MediaElementSource if this element hasn't been connected before
      if (!connectedElements.has(audioElement)) {
        currentSourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        connectedElements.add(audioElement);
      }

      if (currentSourceRef.current) {
        currentSourceRef.current.connect(analyzerRef.current);
      }
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Error setting up audio playback:', error);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (currentSourceRef.current) {
      currentSourceRef.current.disconnect();
    }
  };

  const startRecording = () => {
    setupAudioContext();
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <AudioContextState.Provider
      value={{
        audioContext: audioContextRef.current,
        analyzerNode: analyzerRef.current,
        isPlaying,
        isRecording,
        startPlayback,
        stopPlayback,
        startRecording,
        stopRecording,
      }}
    >
      {children}
    </AudioContextState.Provider>
  );
}

export const useAudioContext = () => {
  const context = useContext(AudioContextState);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};
