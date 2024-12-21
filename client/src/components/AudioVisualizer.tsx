import { useEffect, useRef } from 'react';
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}


interface AudioVisualizerProps {
  isRecording: boolean;
  analyserNode: AnalyserNode | null;
  colors?: {
    primary: string;
    secondary: string;
    background: string;
    particle: string;
    waveform: string;
  };
}

export function AudioVisualizer({ 
  isRecording, 
  analyserNode,
  colors = {
    primary: '#4ade80',
    secondary: '#2563eb',
    background: '#111827',
    particle: '#ec4899',
    waveform: '#8b5cf6'
  }
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    hue: number;
  }>>([]);

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize frequency data arrays
    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    const timeData = new Uint8Array(analyserNode.frequencyBinCount);
    let animationFrameId: number;
    let startTime = Date.now();

    // Initialize particles if empty
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 2,
          size: 2 + Math.random() * 3,
          hue: Math.random() * 360
        });
      }
    }

    function draw() {
      if (!isRecording || !analyserNode || !ctx) return;
      
      animationFrameId = requestAnimationFrame(draw);
      
      // Get both frequency and time domain data
      analyserNode.getByteFrequencyData(frequencyData);
      analyserNode.getByteTimeDomainData(timeData);
      
      // Calculate average frequency and intensity
      const avgFrequency = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
      const intensity = timeData.reduce((sum, value) => sum + Math.abs(value - 128), 0) / timeData.length;
      
      // Create dynamic background
      const bgColor = colors.background.replace('#', '');
      const r = parseInt(bgColor.substr(0, 2), 16);
      const g = parseInt(bgColor.substr(2, 2), 16);
      const b = parseInt(bgColor.substr(4, 2), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Time-based effects
      const time = (Date.now() - startTime) * 0.001;
      const globalPulse = Math.sin(time * 2) * 0.5 + 0.5;
      
      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle position based on audio intensity
        particle.y += particle.speed * (1 + intensity / 128);
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }
        
        // Create dynamic particle color based on frequency and time
        const hue = (particle.hue + avgFrequency / 2) % 360;
        const alpha = 0.3 + globalPulse * 0.7;
        
        // Draw particle with glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.particle;
        ctx.fillStyle = colors.particle;
        
        // Draw expanding circles for particles
        const size = particle.size * (1 + globalPulse * 0.5);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw main waveform
      const centerY = canvas.height / 2;
      const amplitude = (50 + intensity) * (1 + globalPulse * 0.3);
      
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.waveform;
      
      for (let i = 0; i < timeData.length; i++) {
        const x = (i / timeData.length) * canvas.width;
        const normalized = (timeData[i] / 128.0) - 1;
        const y = centerY + normalized * amplitude;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth curve
          const prevX = ((i - 1) / timeData.length) * canvas.width;
          const prevY = centerY + ((timeData[i - 1] / 128.0) - 1) * amplitude;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }
      
      // Add glow effect to waveform
      ctx.shadowBlur = 20;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.stroke();

      // Draw frequency bars
      const barWidth = canvas.width / 64;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 64; i++) {
        const freq = frequencyData[i];
        const hue = (time * 50 + i * 4) % 360;
        const height = (freq / 256.0) * canvas.height * 0.5;
        
        const t = i / 64;
        ctx.fillStyle = `rgba(
          ${lerp(hexToRgb(colors.primary).r, hexToRgb(colors.secondary).r, t)},
          ${lerp(hexToRgb(colors.primary).g, hexToRgb(colors.secondary).g, t)},
          ${lerp(hexToRgb(colors.primary).b, hexToRgb(colors.secondary).b, t)},
          0.5
        )`;
        ctx.fillRect(
          i * barWidth,
          canvas.height - height,
          barWidth - 1,
          height
        );
      }
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