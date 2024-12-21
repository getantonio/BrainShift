import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingScreen({ isLoading, message = "Loading..." }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = {
    primary: '#ec4899', // Pink-500
    secondary: '#f472b6', // Pink-400
    tertiary: '#f9a8d4', // Pink-300
    quaternary: '#fbcfe8', // Pink-200
    quinary: '#e11d48', // Rose-600
    senary: '#be185d', // Pink-700
  };

  useEffect(() => {
    if (!isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Neuron class
    class Neuron {
      x: number;
      y: number;
      connections: Neuron[];
      pulsePhase: number;
      velocity: { x: number; y: number };
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.connections = [];
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5
        };
        this.color = color;
      }

      update(width: number, height: number) {
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Bounce off edges
        if (this.x <= 0 || this.x >= width) this.velocity.x *= -1;
        if (this.y <= 0 || this.y >= height) this.velocity.y *= -1;

        // Update pulse phase
        this.pulsePhase += 0.05;
        if (this.pulsePhase > Math.PI * 2) this.pulsePhase = 0;
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
        const size = 3 + pulse * 2;

        // Draw neuron body
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw connections
        this.connections.forEach(target => {
          const distance = Math.hypot(target.x - this.x, target.y - this.y);
          const strength = Math.max(0, 1 - distance / 200);
          if (strength > 0) {
            const gradient = ctx.createLinearGradient(this.x, this.y, target.x, target.y);
            gradient.addColorStop(0, `${this.color}${Math.floor(strength * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${target.color}${Math.floor(strength * 255).toString(16).padStart(2, '0')}`);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = strength * 2;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      }
    }

    // Create neurons
    const neurons: Neuron[] = [];
    const colorArray = Object.values(colors);
    for (let i = 0; i < 30; i++) {
      neurons.push(new Neuron(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        colorArray[i % colorArray.length]
      ));
    }

    // Connect neurons
    neurons.forEach(neuron => {
      const nearest = neurons
        .filter(n => n !== neuron)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - neuron.x, a.y - neuron.y);
          const distB = Math.hypot(b.x - neuron.x, b.y - neuron.y);
          return distA - distB;
        })
        .slice(0, 3);
      neuron.connections = nearest;
    });

    // Animation loop
    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      if (!ctx || !canvas) return;
      
      const time = (Date.now() - startTime) * 0.001;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      neurons.forEach(neuron => {
        neuron.update(canvas.width, canvas.height);
        neuron.draw(ctx, time);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Brain-Shift Studio</h2>
            <p className="text-white mb-3">{message.replace("Brain Wave Studio", "Brain-Shift Studio")}</p>
            <div className="flex space-x-2 justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
