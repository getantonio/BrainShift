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

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      analyzerRef.current.connect(audioContextRef.current.destination);
    }
  };

  const startPlayback = (audioElement: HTMLAudioElement) => {
    setupAudioContext();
    if (!audioContextRef.current || !analyzerRef.current) return;

    // Disconnect any existing source
    if (currentSourceRef.current) {
      currentSourceRef.current.disconnect();
    }

    currentSourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
    currentSourceRef.current.connect(analyzerRef.current);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (currentSourceRef.current) {
      currentSourceRef.current.disconnect();
      currentSourceRef.current = null;
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
