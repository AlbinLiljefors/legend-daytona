import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export function LoadingAnimation() {
  const navigate = useNavigate();
  const { repoId } = useParams();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 20;
    const intervalTime = duration / steps;
    let count = 0;

    const interval = setInterval(() => {
      count++;
      setProgress((count / steps) * 100);
      if (count >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          navigate(`/graph/${repoId}`);
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [navigate, repoId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold">Legend</span>
        </div>

        <p className="text-muted-foreground">
          Building your codebase map...
        </p>

        <div className="w-64 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
