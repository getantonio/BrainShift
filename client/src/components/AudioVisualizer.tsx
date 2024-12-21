import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  analyserNode: AnalyserNode | null;
}

export function AudioVisualizer({ isRecording, analyserNode }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let animationFrameId: number;
    
    function draw() {
      if (!isRecording || !analyserNode || !ctx) return;
      
      animationFrameId = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);
      
      // Clear the canvas with a dark background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set up the line style for better visibility
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4ade80'; // Bright green color
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      // Draw with mirror effect and smoothing
      let lastY = canvas.height / 2;
      for (let i = 0; i < dataArray.length; i++) {
        const raw = dataArray[i] / 128.0;
        // Smooth the value
        const v = raw * 0.7 + lastY * 0.3;
        const y = v * (canvas.height / 2);
        lastY = y;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const prevX = x - sliceWidth;
          const midX = prevX + sliceWidth / 2;
          ctx.quadraticCurveTo(prevX, lastY, midX, y);
        }

        // Draw mirrored effect
        ctx.moveTo(x, canvas.height - y);
        ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    draw();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[150px] rounded-lg bg-gray-900"
      width={800}
      height={150}
    />
  );
}