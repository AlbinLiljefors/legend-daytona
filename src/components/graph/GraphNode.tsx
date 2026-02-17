import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  Layers,
  ArrowRightLeft,
  Wrench,
  Database,
  Settings,
  AlertTriangle,
  Users,
  Cloud
} from "lucide-react";
import { NodeType } from "@/data/demoData";
import { cn } from "@/lib/utils";

const nodeTypeConfig: Record<NodeType, { 
  icon: React.ElementType; 
  colorClass: string;
  borderColor: string;
}> = {
  component: { 
    icon: Layers, 
    colorClass: "text-node-component",
    borderColor: "border-l-node-component",
  },
  api: { 
    icon: ArrowRightLeft, 
    colorClass: "text-node-api",
    borderColor: "border-l-node-api",
  },
  utility: { 
    icon: Wrench, 
    colorClass: "text-node-utility",
    borderColor: "border-l-node-utility",
  },
  data: { 
    icon: Database, 
    colorClass: "text-node-data",
    borderColor: "border-l-node-data",
  },
  config: { 
    icon: Settings, 
    colorClass: "text-node-config",
    borderColor: "border-l-node-config",
  },
  problem: {
    icon: AlertTriangle,
    colorClass: "text-node-problem",
    borderColor: "border-l-node-problem",
  },
  actor: {
    icon: Users,
    colorClass: "text-node-actor",
    borderColor: "border-l-node-actor",
  },
  external: {
    icon: Cloud,
    colorClass: "text-node-external",
    borderColor: "border-l-node-external",
  },
};

export interface GraphNodeData {
  label: string;
  type: NodeType;
  description: string;
  stats: string;
  hasProblem?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  purpose?: string;
  level?: string;
}

function GraphNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData;
  const effectiveType = nodeData.hasProblem ? "problem" : nodeData.type;
  const config = nodeTypeConfig[effectiveType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: nodeData.isDimmed ? 0.3 : 1, 
        scale: 1 
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative bg-card rounded-lg border-l-4 border legend-shadow-md cursor-pointer transition-all duration-200 min-w-[180px] max-w-[220px]",
        config.borderColor,
        selected && "ring-2 ring-primary legend-shadow-lg",
        nodeData.hasProblem && "ring-2 ring-node-problem/50",
        nodeData.isHighlighted && "ring-2 ring-primary/50 legend-shadow-lg"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-edge !border-0"
      />
      
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className={cn("shrink-0 mt-0.5", config.colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground leading-tight truncate">
              {nodeData.label}
            </h3>
            {nodeData.purpose && (
              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                {nodeData.purpose}
              </p>
            )}
          </div>
          {nodeData.hasProblem && (
            <AlertTriangle className="w-4 h-4 text-node-problem shrink-0" />
          )}
        </div>

        {/* Stats preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {nodeData.stats}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-edge !border-0"
      />
    </motion.div>
  );
}

export const GraphNode = memo(GraphNodeComponent);
