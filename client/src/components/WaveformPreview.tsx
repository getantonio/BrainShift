import { useEffect, useRef, useState } from 'react';
import { audioCompatibility } from '@/lib/audioCompatibility';
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface WaveformPreviewProps {
  audioUrl: string;
  isPlaying?: boolean;
  onPlayPause?: (playing: boolean) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  allowEditing?: boolean;
}

export function WaveformPreview({ 
  audioUrl, 
  isPlaying = false, 
  onPlayPause,
  onSelectionChange,
  allowEditing = false 
}: WaveformPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number | null }>({ start: 0, end: null });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audioId = `waveform-${Date.now()}`;
    let isSetup = false;

    const setupAudio = async () => {
      try {
        if (isSetup || !audioUrl) return;
        
        const audio = await audioCompatibility.createAudioElement(audioUrl, audioId);
        audioRef.current = audio;
        setAnalyser(audioCompatibility.getAnalyser(audioId));
        
        isSetup = true;
      } catch (error) {
        console.error('Error in setupAudio:', error);
      }
    };
    
    setupAudio();
    
    return () => {
      audioCompatibility.cleanup(audioId);
    };
  }, [audioUrl]);
  useEffect(() => {
    if (!canvasRef.current || !allowEditing) return;
    
    const canvas = canvasRef.current;
    let startX = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      if (!allowEditing) return;
      const rect = canvas.getBoundingClientRect();
      startX = (e.clientX - rect.left) / canvas.width;
      setSelection({ start: startX, end: null });
      setIsDragging(true);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !allowEditing) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
      setSelection(prev => ({
        start: Math.min(startX, currentX),
        end: Math.max(startX, currentX)
      }));
    };
    
    const handleMouseUp = () => {
      if (!isDragging || !allowEditing) return;
      setIsDragging(false);
      if (selection.end !== null && onSelectionChange) {
        onSelectionChange({
          start: selection.start,
          end: selection.end
        });
      }
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, allowEditing, onSelectionChange]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Calculate pulse effect
      const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      const baseWidth = 1;
      ctx.lineWidth = baseWidth + pulse;

      // Use white with pulse-based opacity
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      // Draw with mirror effect and smoothing
      let lastY = height / 2;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const prevX = x - sliceWidth;
          const midX = prevX + sliceWidth / 2;
          ctx.quadraticCurveTo(prevX, lastY, midX, y);
        }

        lastY = y;
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw selection overlay if editing is enabled
      if (allowEditing && selection.end !== null) {
        const startX = selection.start * width;
        const endX = selection.end * width;
        
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(236, 72, 153, 0.2)'; // Pink color matching theme
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Draw selection borders
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        className="w-full h-12 rounded bg-gray-900"
        width={200}
        height={48}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-black/50 hover:bg-black/70 border-white/20"
          onClick={() => onPlayPause?.(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}