import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { EdgeType } from "@/data/types";

export interface AnimatedEdgeData {
  type: EdgeType;
  isCircular?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  sourceColor?: string;
  label?: string;
  verified?: boolean;
  weight?: number;
}

const edgeColors: Record<EdgeType, { normal: string; highlighted: string }> = {
  "integrates-with": { normal: "hsl(190, 60%, 50%)", highlighted: "hsl(190, 80%, 45%)" },
  "depends-on":      { normal: "hsl(220, 13%, 65%)", highlighted: "hsl(220, 30%, 55%)" },
  "dependency":      { normal: "hsl(220, 13%, 65%)", highlighted: "hsl(220, 30%, 55%)" },
};

function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const edgeType = edgeData?.type || "depends-on";
  const isCircular = edgeData?.isCircular || false;
  const isHighlighted = edgeData?.isHighlighted || selected;
  const isDimmed = edgeData?.isDimmed || false;
  const verified = edgeData?.verified !== false; // default true for backwards compat
  const weight = edgeData?.weight || 1;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const colors = edgeColors[edgeType] || edgeColors["depends-on"];

  // Weight-based width for L4 dependency edges
  const weightWidth = edgeType === "dependency"
    ? Math.min(1 + Math.log2(weight), 5)
    : isHighlighted ? 2.5 : 1.5;

  // Edge styling based on type
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: weightWidth,
      opacity: isDimmed ? 0.15 : verified ? 1 : 0.7,
    };

    // Circular overrides ALL other styling
    if (isCircular) {
      return {
        ...baseStyle,
        stroke: "hsl(0, 84%, 60%)",
        strokeDasharray: "none",
        opacity: isDimmed ? 0.15 : 1,
      };
    }

    const stroke = isHighlighted ? colors.highlighted : colors.normal;

    // Unverified: dashed
    if (!verified) {
      return { ...baseStyle, stroke, strokeDasharray: "6 3" };
    }

    switch (edgeType) {
      case "integrates-with":
        return { ...baseStyle, stroke, strokeDasharray: "4 4" };
      case "depends-on":
        return { ...baseStyle, stroke, strokeDasharray: "none" };
      case "dependency":
        return { ...baseStyle, stroke, strokeDasharray: "none" };
      default:
        return { ...baseStyle, stroke, strokeDasharray: "none" };
    }
  };

  const edgeStyle = getEdgeStyle();

  return (
    <g className="react-flow__edge">
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
      />

      {/* Edge label — rendered in HTML layer above all SVG edges */}
      <EdgeLabelRenderer>
        {edgeData?.label && !isDimmed && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground text-[9px] leading-none whitespace-nowrap"
          >
            {edgeData.label}
          </div>
        )}
      </EdgeLabelRenderer>

      {/* Animated dot overlay - only show when not dimmed */}
      {!isDimmed && (
        <circle
          r={isHighlighted ? 4 : 3}
          fill={isCircular ? "hsl(0, 84%, 60%)" : colors.highlighted}
          className={cn(
            isCircular ? "animate-pulse" : ""
          )}
        >
          <animateMotion
            dur={isCircular ? "1s" : "1.5s"}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Circular dependency indicator — the killer feature */}
      {isCircular && (
        <>
          {/* Pulsing glow */}
          <path
            d={edgePath}
            fill="none"
            stroke="hsl(0, 84%, 60%)"
            strokeWidth={6}
            strokeOpacity={0.2}
            className="animate-pulse"
          />
          {/* Second dot going opposite direction */}
          <circle r={3} fill="hsl(0, 84%, 60%)" className="animate-pulse">
            <animateMotion
              dur="1s"
              repeatCount="indefinite"
              path={edgePath}
              keyPoints="1;0"
              keyTimes="0;1"
            />
          </circle>
        </>
      )}
    </g>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
