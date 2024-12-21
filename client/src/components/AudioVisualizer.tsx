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
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#111');
      gradient.addColorStop(1, '#000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate pulse effect
      const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      const baseWidth = 2;
      ctx.lineWidth = baseWidth + pulse;
      
      // Use high contrast white with pulse-based opacity
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
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
