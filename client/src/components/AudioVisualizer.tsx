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
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate pulse effect for dynamic visualization
      const time = Date.now() * 0.001;
      const pulse = Math.sin(time * 2) * 0.5 + 0.5;
      const baseWidth = 2;
      ctx.lineWidth = baseWidth + pulse;

      // Create dynamic color based on audio intensity
      const intensity = dataArray.reduce((sum, value) => sum + Math.abs(value - 128), 0) / dataArray.length;
      const hue = (200 + intensity) % 360; // Blue to purple range
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.7 + pulse * 0.3})`;
      
      ctx.beginPath();
      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      // Draw with mirror effect and enhanced smoothing
      let lastY = canvas.height / 2;
      for (let i = 0; i < dataArray.length; i++) {
        const raw = dataArray[i] / 128.0;
        // Enhanced smoothing with dynamic factor
        const smoothingFactor = 0.8 + pulse * 0.1;
        const v = raw * (1 - smoothingFactor) + lastY * smoothingFactor;
        const y = v * (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Enhanced curve smoothing
          const prevX = x - sliceWidth;
          const midX = prevX + sliceWidth / 2;
          const cpX1 = prevX + sliceWidth * 0.25;
          const cpX2 = prevX + sliceWidth * 0.75;
          
          ctx.bezierCurveTo(
            cpX1, lastY,
            cpX2, y,
            midX, y
          );
        }

        // Draw mirrored effect with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.moveTo(x, canvas.height - y);
        ctx.lineTo(x, y);
        
        lastY = y;
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