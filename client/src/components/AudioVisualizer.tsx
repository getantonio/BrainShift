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
      
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

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
