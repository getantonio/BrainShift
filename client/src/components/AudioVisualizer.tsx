import { useEffect, useRef, useState } from 'react';
// Utility functions for color manipulation
function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}


interface AudioVisualizerProps {
  isRecording: boolean;
  isPlaying?: boolean;
  analyserNode: AnalyserNode | null;
}

type VisualizationStyle = 'classic' | 'circular' | 'bars';

export function AudioVisualizer({ 
  isRecording,
  isPlaying = false,
  analyserNode
}: AudioVisualizerProps) {
  const [visualizationStyle, setVisualizationStyle] = useState<VisualizationStyle>('classic');
  // Vibrant color palette
  const colors = {
    primary: '#00ffff', // Vibrant Cyan
    secondary: '#ff00ff', // Vibrant Magenta
    tertiary: '#ffff00', // Vibrant Yellow
    quaternary: '#ff0000', // Vibrant Red
    quinary: '#0000ff', // Vibrant Blue
    senary: '#00ff00', // Vibrant Green
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    hue: number;
  }>>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a dummy analyzer node for idle animation
    let dummyAnalyser: AnalyserNode | null = null;
    let dummyContext: AudioContext | null = null;
    if (!analyserNode) {
      // Create AudioContext with proper type checking
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      dummyContext = new AudioContextClass();
      dummyAnalyser = dummyContext.createAnalyser();
      dummyAnalyser.fftSize = 2048;
    }
    
    const currentAnalyser = analyserNode || dummyAnalyser;
    if (!currentAnalyser) return;
    
    // Initialize frequency data arrays
    const frequencyData = new Uint8Array(currentAnalyser.frequencyBinCount);
    const timeData = new Uint8Array(currentAnalyser.frequencyBinCount);
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

    // Draw classic waveform
    function drawClassicWaveform(ctx: CanvasRenderingContext2D, timeData: Uint8Array, intensity: number, time: number) {
      const centerY = canvas.height / 2;
      const amplitude = (50 + intensity) * (1 + Math.sin(time * 2) * 0.3);
      
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors.primary;
      
      for (let i = 0; i < timeData.length; i++) {
        const x = (i / timeData.length) * canvas.width;
        const normalized = (timeData[i] / 128.0) - 1;
        const y = centerY + normalized * amplitude;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = ((i - 1) / timeData.length) * canvas.width;
          const prevY = centerY + ((timeData[i - 1] / 128.0) - 1) * amplitude;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }
      
      ctx.stroke();
      
      // Draw secondary waveform with offset
      ctx.beginPath();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      
      for (let i = 0; i < timeData.length; i++) {
        const x = (i / timeData.length) * canvas.width;
        const normalized = (timeData[i] / 128.0) - 1;
        const y = centerY + normalized * (amplitude * 0.8);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = ((i - 1) / timeData.length) * canvas.width;
          const prevY = centerY + ((timeData[i - 1] / 128.0) - 1) * (amplitude * 0.8);
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }
      
      ctx.stroke();
    }
    
    // Draw circular waveform
    function drawCircularWaveform(ctx: CanvasRenderingContext2D, timeData: Uint8Array, intensity: number, time: number) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time);
      
      // Draw primary circle
      ctx.beginPath();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      
      for (let i = 0; i < timeData.length; i++) {
        const angle = (i / timeData.length) * Math.PI * 2;
        const normalized = (timeData[i] / 128.0) - 1;
        const radius = baseRadius + normalized * (30 + intensity);
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
      
      // Draw secondary circle
      ctx.beginPath();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      
      for (let i = 0; i < timeData.length; i++) {
        const angle = (i / timeData.length) * Math.PI * 2;
        const normalized = (timeData[i] / 128.0) - 1;
        const radius = (baseRadius * 0.8) + normalized * (20 + intensity);
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw frequency bars
    function drawFrequencyBars(ctx: CanvasRenderingContext2D, frequencyData: Uint8Array, time: number) {
      const barWidth = canvas.width / 64;
      const maxHeight = canvas.height * 0.8;
      
      for (let i = 0; i < 64; i++) {
        const freq = frequencyData[i];
        const height = (freq / 256.0) * maxHeight;
        const x = i * barWidth;
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, canvas.height - height, x, canvas.height);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        
        ctx.fillStyle = gradient;
        
        // Add a pulsing effect
        const pulse = Math.sin(time * 3 + i * 0.1) * 0.2 + 0.8;
        ctx.fillRect(
          x,
          canvas.height - height * pulse,
          barWidth - 1,
          height * pulse
        );
      }
    }

    function draw() {
      if (!ctx) return;
      
      animationFrameId = requestAnimationFrame(draw);
      
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = `rgba(17, 24, 39, 0.2)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = (Date.now() - startTime) * 0.001;
      const breatheScale = Math.sin(time * 1.5) * 0.3 + 0.7; // Creates a breathing effect between 0.4 and 1.0
      
      if ((isRecording || isPlaying) && currentAnalyser) {
        // Get real audio data
        currentAnalyser.getByteFrequencyData(frequencyData);
        currentAnalyser.getByteTimeDomainData(timeData);
      } else {
        // Generate synthetic waveform data for idle animation
        const time = Date.now() * 0.0005; // Slowed down overall animation by 50%
        for (let i = 0; i < timeData.length; i++) {
          // Create a smooth, continuous wave pattern
          const t = i / timeData.length;
          const breatheIntensity = breatheScale * 0.625; // Increased intensity by 25%
          const wave = 
            Math.sin(t * 10 + time * 2) * breatheIntensity + // Base wave
            Math.sin(t * 20 + time * 3) * breatheIntensity * 0.375 +  // Higher frequency detail with more intensity
            Math.sin(t * 5 - time) * breatheIntensity * 0.625;        // Slower moving wave with more intensity
          
          timeData[i] = wave * 30 + 128;
          frequencyData[i] = Math.abs(wave) * 100 + 50;
        }
      }
      
      // Calculate audio metrics
      const avgFrequency = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
      const intensity = timeData.reduce((sum, value) => sum + Math.abs(value - 128), 0) / timeData.length;
      
      // Clear canvas with semi-transparent background
      ctx.fillStyle = `rgba(17, 24, 39, 0.2)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated brain elements in background
      const time2 = (Date.now() - startTime) * 0.001;
      const globalPulse = Math.sin(time2 * 2) * 0.5 + 0.5;
      
      // Draw neural network-like connections
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + globalPulse * 0.1})`;
      ctx.lineWidth = 1;
      
      const nodeCount = 5;
      const nodes: Array<{ x: number; y: number }> = [];
      
      // Calculate node positions
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + time2 * 0.2;
        const radius = 40 + Math.sin(time2 * 2 + i) * 10;
        nodes.push({
          x: canvas.width / 2 + Math.cos(angle) * radius,
          y: canvas.height / 2 + Math.sin(angle) * radius
        });
      }
      
      // Draw connections
      ctx.beginPath();
      nodes.forEach((node, i) => {
        nodes.forEach((otherNode, j) => {
          if (i !== j) {
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
          }
        });
      });
      ctx.stroke();
      
      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + globalPulse * 0.2})`;
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle position based on audio intensity and playback state
        const speedMultiplier = isPlaying ? 1.5 : 1;
        particle.y += particle.speed * (1 + intensity / 128) * speedMultiplier;
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }
        
        // Create dynamic particle color based on frequency and time
        const hue = (particle.hue + avgFrequency / 2) % 360;
        const alpha = 0.3 + globalPulse * 0.7;
        
        // Draw particle with glow effect
        const particleColor = colors.primary;
        ctx.shadowBlur = 15;
        ctx.shadowColor = particleColor;
        ctx.fillStyle = particleColor;
        
        // Draw expanding circles for particles
        const size = particle.size * (1 + globalPulse * 0.5);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Use the existing time variable from above
      const styleIndex = Math.floor((Date.now() - startTime) * 0.001 / 5) % 3;
      const currentStyle: VisualizationStyle = 
        styleIndex === 0 ? 'classic' :
        styleIndex === 1 ? 'circular' : 'bars';
      
      // Add glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = colors.primary;
      
      // Get color based on time
      const colorIndex = Math.floor(time * 0.25) % 6; // Slowed down color cycling by 50%
      const primaryColor = Object.values(colors)[colorIndex];
      const secondaryColor = Object.values(colors)[(colorIndex + 1) % 6];
      
      // Draw current visualization style
      switch (currentStyle) {
        case 'classic':
          ctx.strokeStyle = primaryColor;
          drawClassicWaveform(ctx, timeData, intensity, time);
          ctx.strokeStyle = secondaryColor;
          drawClassicWaveform(ctx, timeData, intensity * 0.8, time + Math.PI);
          break;
        case 'circular':
          ctx.strokeStyle = primaryColor;
          drawCircularWaveform(ctx, timeData, intensity, time);
          ctx.strokeStyle = secondaryColor;
          drawCircularWaveform(ctx, timeData, intensity * 0.8, time + Math.PI);
          break;
        case 'bars':
          drawFrequencyBars(ctx, frequencyData, time);
          break;
      }
      
      // Additional bar visualization with color cycling
      const frequencyBarWidth = canvas.width / 64;
      for (let i = 0; i < 64; i++) {
        const freq = frequencyData[i];
        const height = (freq / 256.0) * canvas.height * 0.5;
        const t = i / 64;
        
        // Cycle through colors based on position and time
        const colorPhase = (t + time * 0.2) % 1;
        const colorIndex1 = Math.floor(colorPhase * 6);
        const colorIndex2 = (colorIndex1 + 1) % 6;
        const colorT = (colorPhase * 6) % 1;
        
        const color1 = hexToRgb(Object.values(colors)[colorIndex1]);
        const color2 = hexToRgb(Object.values(colors)[colorIndex2]);
        
        ctx.fillStyle = `rgba(
          ${lerp(color1.r, color2.r, colorT)},
          ${lerp(color1.g, color2.g, colorT)},
          ${lerp(color1.b, color2.b, colorT)},
          0.5
        )`;
        ctx.fillRect(
          i * frequencyBarWidth,
          canvas.height - height,
          frequencyBarWidth - 1,
          height
        );
      }
    }

    draw();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (dummyContext) {
        dummyContext.close();
      }
    };
  }, [isRecording, isPlaying, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-3/4 mx-auto h-[50px] rounded-lg bg-gray-900"
      width={450}
      height={50}
    />
  );
}