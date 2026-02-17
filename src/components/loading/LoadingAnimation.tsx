import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";

interface BubbleNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: number[];
}

const nodeColors = [
  "hsl(217, 91%, 60%)",  // Blue
  "hsl(160, 84%, 39%)",  // Green
  "hsl(38, 92%, 50%)",   // Orange
  "hsl(258, 90%, 66%)",  // Purple
  "hsl(350, 89%, 60%)",  // Red
  "hsl(180, 70%, 45%)",  // Cyan
];

const CANVAS_SIZE = 600;
const CENTER = CANVAS_SIZE / 2;
const MIN_RADIUS = 18;
const MAX_RADIUS = 28;
const REPULSION_STRENGTH = 2000;
const ATTRACTION_TO_CENTER = 0.015;
const DAMPING = 0.9;
const MIN_DISTANCE = 100;

export function LoadingAnimation() {
  const navigate = useNavigate();
  const { repoId } = useParams();
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [progress, setProgress] = useState(0);

  // Add a new node
  const addNode = useCallback(() => {
    setNodes((prev) => {
      const id = prev.length;
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 100;

      // Spawn from edge, moving toward center area
      const spawnX = CENTER + Math.cos(angle) * distance;
      const spawnY = CENTER + Math.sin(angle) * distance;

      const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);

      // Connect to nearest 1-2 existing nodes
      const connections: number[] = [];
      if (prev.length > 0) {
        // Calculate distances to all existing nodes
        const distances = prev.map((node, idx) => ({
          idx,
          dist: Math.sqrt(
            Math.pow(node.x - spawnX, 2) + Math.pow(node.y - spawnY, 2)
          ),
        }));

        // Sort by distance (nearest first)
        distances.sort((a, b) => a.dist - b.dist);

        // Connect to 1-2 nearest nodes
        const numConnections = Math.min(prev.length, prev.length === 1 ? 1 : 1 + Math.floor(Math.random() * 2));
        for (let i = 0; i < numConnections; i++) {
          connections.push(distances[i].idx);
        }
      }

      const newNode: BubbleNode = {
        id,
        x: spawnX,
        y: spawnY,
        vx: (CENTER - spawnX) * 0.05,
        vy: (CENTER - spawnY) * 0.05,
        radius,
        color: nodeColors[id % nodeColors.length],
        connections,
      };

      // Trigger ripple effect
      setRipple({ x: spawnX, y: spawnY, id });

      return [...prev, newNode];
    });
  }, []);

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes((prev) => {
        return prev.map((node, i) => {
          let fx = 0;
          let fy = 0;

          // Repulsion from other nodes
          prev.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = node.radius + other.radius + MIN_DISTANCE;

            if (distance < minDist) {
              const force = REPULSION_STRENGTH / (distance * distance);
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          });

          // Attraction to center
          const dxCenter = CENTER - node.x;
          const dyCenter = CENTER - node.y;
          fx += dxCenter * ATTRACTION_TO_CENTER;
          fy += dyCenter * ATTRACTION_TO_CENTER;

          // Keep within bounds with soft boundary
          const margin = node.radius + 20;
          if (node.x < margin) fx += (margin - node.x) * 0.1;
          if (node.x > CANVAS_SIZE - margin) fx += (CANVAS_SIZE - margin - node.x) * 0.1;
          if (node.y < margin) fy += (margin - node.y) * 0.1;
          if (node.y > CANVAS_SIZE - margin) fy += (CANVAS_SIZE - margin - node.y) * 0.1;

          const newVx = (node.vx + fx) * DAMPING;
          const newVy = (node.vy + fy) * DAMPING;

          return {
            ...node,
            x: node.x + newVx,
            y: node.y + newVy,
            vx: newVx,
            vy: newVy,
          };
        });
      });
    };

    const interval = setInterval(simulate, 16);
    return () => clearInterval(interval);
  }, [nodes.length]);

  // Add nodes over time
  useEffect(() => {
    const totalNodes = 15;
    const totalDuration = 4000;
    const intervalTime = totalDuration / totalNodes;
    let count = 0;

    const interval = setInterval(() => {
      if (count < totalNodes) {
        addNode();
        count++;
        setProgress((count / totalNodes) * 100);
      } else {
        clearInterval(interval);
        // Navigate after a short delay
        setTimeout(() => {
          navigate(`/graph/${repoId}`);
        }, 800);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [addNode, navigate, repoId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center gap-8">
        {/* Graph visualization */}
        <div
          className="relative"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          {/* SVG for connections */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes[targetId];
                if (!target) return null;
                return (
                  <motion.line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeOpacity={0.3}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                );
              })
            )}
          </svg>

          {/* Ripple effect */}
          <AnimatePresence>
            {ripple && (
              <motion.div
                key={ripple.id}
                className="absolute rounded-full border-2 pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  borderColor: nodeColors[ripple.id % nodeColors.length],
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{ width: 150, height: 150, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                onAnimationComplete={() => setRipple(null)}
              />
            )}
          </AnimatePresence>

          {/* Bubble nodes */}
          <AnimatePresence>
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                className="absolute rounded-full flex items-center justify-center shadow-lg"
                style={{
                  width: node.radius * 2,
                  height: node.radius * 2,
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle at 30% 30%, ${node.color}dd, ${node.color})`,
                  boxShadow: `0 4px 20px ${node.color}40, inset 0 -2px 10px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.3)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                }}
              >
                {/* Inner highlight for bubble effect */}
                <div
                  className="absolute rounded-full bg-white/30"
                  style={{
                    width: node.radius * 0.6,
                    height: node.radius * 0.4,
                    top: '15%',
                    left: '20%',
                    filter: 'blur(2px)',
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">Legend</span>
          </div>

          <p className="text-muted-foreground">
            Building your codebase map...
          </p>

          {/* Progress bar */}
          <div className="w-64 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
