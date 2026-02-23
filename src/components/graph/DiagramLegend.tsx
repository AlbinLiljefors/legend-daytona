import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ArrowRightLeft,
  Wrench,
  Database,
  Settings,
  Users,
  Cloud,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nodeTypeEntries = [
  { type: "component", label: "Component", icon: Layers, colorVar: "--node-component" },
  { type: "api", label: "API", icon: ArrowRightLeft, colorVar: "--node-api" },
  { type: "utility", label: "Utility", icon: Wrench, colorVar: "--node-utility" },
  { type: "data", label: "Data", icon: Database, colorVar: "--node-data" },
  { type: "config", label: "Config", icon: Settings, colorVar: "--node-config" },
  { type: "actor", label: "Actor", icon: Users, colorVar: "--node-actor" },
  { type: "external", label: "External", icon: Cloud, colorVar: "--node-external" },
] as const;

function EdgeLineSample({
  strokeDasharray,
  color,
  label,
}: {
  strokeDasharray: string;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="8" className="shrink-0">
        <line
          x1="0"
          y1="4"
          x2="32"
          y2="4"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

export function DiagramLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "mb-2 bg-background/80 backdrop-blur-md border rounded-lg shadow-lg",
              "p-3 w-56"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Legend</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Node Types */}
            <div className="mb-3">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Node Types
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
                {nodeTypeEntries.map(({ type, label, icon: Icon, colorVar }) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <Icon
                      className="w-3 h-3 shrink-0"
                      style={{ color: `hsl(var(${colorVar}))` }}
                    />
                    <span className="text-[10px] text-foreground leading-none">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Types */}
            <div className="mb-3">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Edge Types
              </span>
              <div className="mt-1.5 space-y-1.5">
                <EdgeLineSample
                  strokeDasharray="none"
                  color="hsl(220, 13%, 65%)"
                  label="Sync / Verified"
                />
                <EdgeLineSample
                  strokeDasharray="8 4"
                  color="hsl(190, 60%, 50%)"
                  label="Async communication"
                />
                <EdgeLineSample
                  strokeDasharray="6 3"
                  color="hsl(220, 13%, 65%)"
                  label="Unverified (AI-inferred)"
                />
                <EdgeLineSample
                  strokeDasharray="none"
                  color="hsl(0, 84%, 60%)"
                  label="Circular dependency"
                />
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Data Source
              </span>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-foreground/70 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">SCIP verified - static analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-foreground/40 shrink-0 border border-foreground/30" />
                  <span className="text-[10px] text-muted-foreground">AI inferred - from LLM analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(190, 60%, 50%)" }} />
                  <span className="text-[10px] text-muted-foreground">Config detected - infra files</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      {!isOpen && (
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 shadow-md bg-background/80 backdrop-blur-sm border"
          onClick={() => setIsOpen(true)}
        >
          <Info className="w-3.5 h-3.5" />
          <span className="text-xs">Legend</span>
        </Button>
      )}
    </div>
  );
}
