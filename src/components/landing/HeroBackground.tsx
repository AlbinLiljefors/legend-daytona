import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface Edge {
  from: number;
  to: number;
  progress: number;
}

const colors = [
  "hsl(217, 91%, 60%)",  // Blue - component
  "hsl(160, 84%, 39%)",  // Green - api
  "hsl(38, 92%, 50%)",   // Orange - utility
  "hsl(258, 90%, 66%)",  // Purple - data
  "hsl(220, 9%, 46%)",   // Gray - config
];

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize nodes
    const nodeCount = 25;
    nodesRef.current = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4,
    }));

    // Initialize edges - connect each node to many others
    edgesRef.current = [];
    for (let i = 0; i < nodeCount; i++) {
      const connections = 4 + Math.floor(Math.random() * 4); // 4-7 connections per node
      for (let j = 0; j < connections; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) {
          edgesRef.current.push({ from: i, to: target, progress: Math.random() });
        }
      }
    }

    // Add proximity-based edges for nearby nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        // Add edge between all node pairs (will only render if close enough)
        if (Math.random() > 0.3) { // 70% chance to add edge
          edgesRef.current.push({ from: i, to: j, progress: Math.random() });
        }
      }
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw edges
      edgesRef.current.forEach((edge) => {
        const fromNode = nodesRef.current[edge.from];
        const toNode = nodesRef.current[edge.to];

        if (!fromNode || !toNode) return;

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 400) {
          const opacity = (1 - distance / 400) * 0.5;

          // Draw line - sharper, more defined
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `hsla(150, 25%, 28%, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Animate dot along edge
          edge.progress = (edge.progress + 0.005) % 1;
          const dotX = fromNode.x + dx * edge.progress;
          const dotY = fromNode.y + dy * edge.progress;

          ctx.beginPath();
          ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(150, 25%, 28%, ${opacity * 1.5})`;
          ctx.fill();
        }
      });

      // Update and draw nodes
      nodesRef.current.forEach((node) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 3
        );
        gradient.addColorStop(0, node.color.replace(")", ", 0.3)").replace("hsl", "hsla"));
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
}
