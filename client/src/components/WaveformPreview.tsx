import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface WaveformPreviewProps {
  audioUrl: string;
  isPlaying?: boolean;
  onPlayPause?: (playing: boolean) => void;
}

export function WaveformPreview({ audioUrl, isPlaying = false, onPlayPause }: WaveformPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    const context = new AudioContext();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 2048;
    const source = context.createMediaElementSource(audio);
    source.connect(analyserNode);
    analyserNode.connect(context.destination);

    setAudioContext(context);
    setAnalyser(analyserNode);
    setAudioSource(source);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      context.close();
    };
  }, [audioUrl]);

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
