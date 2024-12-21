import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NeuronNode {
  x: number;
  y: number;
  connections: number[];
}

export function LoadingAnimation() {
  const [nodes] = useState<NeuronNode[]>(() => {
    // Create a network of 8 neurons with random positions
    const neurons: NeuronNode[] = [];
    for (let i = 0; i < 8; i++) {
      neurons.push({
        x: 30 + Math.random() * 140,
        y: 30 + Math.random() * 140,
        connections: []
      });
    }
    
    // Create connections between neurons
    neurons.forEach((neuron, i) => {
      const numConnections = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numConnections; j++) {
        let target;
        do {
          target = Math.floor(Math.random() * neurons.length);
        } while (target === i || neuron.connections.includes(target));
        neuron.connections.push(target);
      }
    });
    
    return neurons;
  });

  return (
    <div className="flex items-center justify-center w-full h-40">
      <svg width="200" height="200" viewBox="0 0 200 200" className="text-pink-500">
        {/* Draw connections */}
        {nodes.map((node, i) => 
          node.connections.map((target, j) => (
            <motion.line
              key={`${i}-${j}`}
              x1={node.x}
              y1={node.y}
              x2={nodes[target].x}
              y2={nodes[target].y}
              stroke="currentColor"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0.3 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))
        )}
        
        {/* Draw neurons */}
        {nodes.map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="currentColor"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
