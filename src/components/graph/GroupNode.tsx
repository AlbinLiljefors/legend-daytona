import { memo } from "react";
import { NodeProps } from "@xyflow/react";

export interface GroupNodeData {
  label: string;
  group: string;
  width: number;
  height: number;
  color: string;
}

// Hardcoded mappings for demo repos
const GROUP_COLOR_VARS: Record<string, string> = {
  // PostHog groups
  "web-app": "--node-api",
  "frontend": "--node-component",
  "plugin-server": "--node-utility",
  "workers": "--node-config",
  "temporal": "--node-problem",
  "rust-services": "--node-rust",
  "infrastructure": "--node-data",
  "livestream": "--node-external",
  // Daytona groups
  "d-api": "--node-api",
  "d-dashboard": "--node-component",
  "d-runner": "--node-utility",
  "d-daemon": "--node-config",
  "d-cli": "--node-problem",
  "d-gateway": "--node-rust",
  "d-sdks": "--node-external",
  "d-infra": "--node-data",
  // ksync groups
  "k-cli": "--node-problem",
  "k-core": "--node-utility",
  "k-syncthing": "--node-component",
  "k-radar": "--node-config",
  "k-proto": "--node-api",
  "k-infra": "--node-data",
};

// Rotating palette for dynamically generated groups
const COLOR_PALETTE = [
  "--node-api",
  "--node-component",
  "--node-utility",
  "--node-config",
  "--node-data",
  "--node-external",
  "--node-problem",
  "--node-rust",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getGroupColorVar(group: string, color?: string): string {
  // Known demo group
  if (GROUP_COLOR_VARS[group]) return GROUP_COLOR_VARS[group];
  // Generated data provides color as "hsl(var(--node-api))" — extract the var name
  if (color) {
    const match = color.match(/var\((--[^)]+)\)/);
    if (match) return match[1];
  }
  // Fallback: hash to palette
  return COLOR_PALETTE[hashCode(group) % COLOR_PALETTE.length];
}

function GroupNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as GroupNodeData;
  const colorVar = getGroupColorVar(nodeData.group, nodeData.color);

  return (
    <div
      className="rounded-2xl pointer-events-none"
      style={{
        width: nodeData.width,
        height: nodeData.height,
        backgroundColor: `hsl(var(${colorVar}) / 0.08)`,
        border: `1.5px dashed hsl(var(${colorVar}) / 0.25)`,
      }}
    >
      <div
        className="absolute -top-1 left-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md"
        style={{
          color: `hsl(var(${colorVar}) / 0.7)`,
          backgroundColor: "hsl(var(--background))",
        }}
      >
        {nodeData.label}
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
