import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Layers, LogOut, ArrowLeft, Plus, Trash2, Unlink, Pencil, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraphNode } from "./GraphNode";
import { GroupNode } from "./GroupNode";
import { AnimatedEdge } from "./AnimatedEdge";
import { GraphSidebar, EdgeFilters, AnimationSettings } from "./GraphSidebar";
import { DetailPanel } from "./DetailPanel";
import { OnboardingTour } from "./OnboardingTour";
import { AddNodeDialog } from "./AddNodeDialog";
import { DeleteNodeDialog } from "./DeleteNodeDialog";
import { AddEdgeDialog } from "./AddEdgeDialog";
import { DeleteEdgeDialog } from "./DeleteEdgeDialog";
import { EditNodeDialog } from "./EditNodeDialog";
import { EditEdgeDialog } from "./EditEdgeDialog";
import { DiagramLegend } from "./DiagramLegend";
import { useUserEdits } from "@/hooks/useUserEdits";
import {
  ZoomLevel,
  GraphNode as GraphNodeType,
  GraphEdge as GraphEdgeType,
  SystemGroup,
  getNodesForLevel,
  getEdgesForLevel,
  getNodesGroupedBySystem,
  getSystemGroupsForRepo,
  demoRepositories,
  getAllRepositories,
} from "@/data/demoData";
import { loadGeneratedManifest, loadGeneratedRepo } from "@/data/loader";
import {
  FocusModeState,
  defaultFocusModeState,
  computeNHopNeighbors,
} from "@/lib/focusMode";

const nodeTypes = {
  custom: GraphNode,
  group: GroupNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// Group labels are now derived per-repo inside GraphViewInner

// Node dimensions
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const NODE_SPACING_X = 280;
const NODE_SPACING_Y = 140;
const GROUP_PADDING = 60;
const GROUP_GAP = 80;

// Calculate dimensions needed for a group based on node count
function calculateGroupDimensions(nodeCount: number): { width: number; height: number; cols: number } {
  if (nodeCount === 0) return { width: 0, height: 0, cols: 0 };

  const cols = nodeCount <= 4 ? 2 : Math.min(4, Math.ceil(Math.sqrt(nodeCount)));
  const rows = Math.ceil(nodeCount / cols);

  const width = cols * NODE_SPACING_X + GROUP_PADDING * 2;
  const height = rows * NODE_SPACING_Y + GROUP_PADDING * 2 + 30;

  return { width, height, cols };
}

// Dynamically calculate group positions for N groups using a grid layout
function calculateDynamicGroupPositions(
  groupedNodes: Map<SystemGroup, GraphNodeType[]>,
  repoGroups: { id: SystemGroup; label: string; color: string }[]
): Map<SystemGroup, { x: number; y: number; cols: number }> {
  const positions = new Map<SystemGroup, { x: number; y: number; cols: number }>();

  // Collect groups that have nodes
  const activeGroups = repoGroups.filter(
    (g) => (groupedNodes.get(g.id)?.length || 0) > 0
  );

  if (activeGroups.length === 0) return positions;

  // Grid layout: rows of 3
  const GRID_COLS = 3;
  const startX = 100;
  const startY = 100;

  // Calculate dimensions for all groups
  const groupDims = new Map<string, { width: number; height: number; cols: number }>();
  for (const g of repoGroups) {
    groupDims.set(g.id, calculateGroupDimensions(groupedNodes.get(g.id)?.length || 0));
  }

  // Place groups in a grid of GRID_COLS columns
  let currentY = startY;

  for (let rowStart = 0; rowStart < activeGroups.length; rowStart += GRID_COLS) {
    const rowGroups = activeGroups.slice(rowStart, rowStart + GRID_COLS);
    let currentX = startX;
    let rowMaxHeight = 0;

    for (const g of rowGroups) {
      const dims = groupDims.get(g.id) || { width: 400, height: 400, cols: 2 };
      positions.set(g.id, {
        x: currentX,
        y: currentY,
        cols: dims.cols || 2,
      });
      currentX += (dims.width || 400) + GROUP_GAP;
      rowMaxHeight = Math.max(rowMaxHeight, dims.height || 400);
    }

    currentY += rowMaxHeight + GROUP_GAP;
  }

  return positions;
}

// Calculate the bounding box for a group of nodes
const calculateGroupBounds = (
  nodes: Node[],
  group: SystemGroup,
  padding: number = 40
): { x: number; y: number; width: number; height: number } | null => {
  const groupNodes = nodes.filter(
    (n) => (n.data as { group?: SystemGroup }).group === group
  );

  if (groupNodes.length === 0) return null;

  const positions = groupNodes.map((n) => ({
    x: n.position.x,
    y: n.position.y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));

  const minX = Math.min(...positions.map((p) => p.x)) - padding;
  const minY = Math.min(...positions.map((p) => p.y)) - padding - 20;
  const maxX = Math.max(...positions.map((p) => p.x + p.width)) + padding;
  const maxY = Math.max(...positions.map((p) => p.y + p.height)) + padding;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Layout positions for nodes with group clustering
const getNodePosition = (
  index: number,
  level: ZoomLevel,
  total: number,
  node?: GraphNodeType,
  groupedNodes?: Map<SystemGroup, GraphNodeType[]>,
  dynamicGroupPositions?: Map<SystemGroup, { x: number; y: number; cols: number }>
) => {
  // Context level: radial layout with center system node
  if (level === "context") {
    if (index === 0) return { x: 600, y: 400 };
    const angle = ((index - 1) / (total - 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 600 + Math.cos(angle) * 350,
      y: 400 + Math.sin(angle) * 350,
    };
  }

  // System level: clean grid layout with more spacing
  if (level === "system") {
    const cols = 3;
    const spacingX = 380;
    const spacingY = 280;
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: 200 + col * spacingX,
      y: 200 + row * spacingY,
    };
  }

  // Module/File level: group by system with dynamic positions
  if (node?.group && groupedNodes && dynamicGroupPositions) {
    const groupNodes = groupedNodes.get(node.group) || [];
    const nodeIndex = groupNodes.findIndex(n => n.id === node.id);
    const groupPos = dynamicGroupPositions.get(node.group);

    if (groupPos) {
      const cols = groupPos.cols || 3;
      const row = Math.floor(nodeIndex / cols);
      const col = nodeIndex % cols;

      return {
        x: groupPos.x + GROUP_PADDING + col * NODE_SPACING_X,
        y: groupPos.y + GROUP_PADDING + 30 + row * NODE_SPACING_Y,
      };
    }
  }

  // Fallback
  const cols = 3;
  const spacingX = 340;
  const spacingY = 200;
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: 150 + col * spacingX,
    y: 150 + row * spacingY,
  };
};

function GraphViewInner() {
  const navigate = useNavigate();
  const { repoId } = useParams();
  const reactFlowInstance = useReactFlow();

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("module");
  const [selectedNode, setSelectedNode] = useState<GraphNodeType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [edgeFilters, setEdgeFilters] = useState<EdgeFilters>({
    verifiedOnly: false,
    circularOnly: false,
    weightThreshold: 1,
  });
  const [focusMode, setFocusMode] = useState<FocusModeState>(defaultFocusModeState);
  // Animation settings (persisted to localStorage)
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(() => {
    try {
      const stored = localStorage.getItem("legend-animation-settings");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { enabled: true, speed: 1.5 };
  });
  // Track which module we drilled into for L4 filtering
  const [fileModuleId, setFileModuleId] = useState<string | null>(null);
  // Generated data loading state
  const [generatedLoaded, setGeneratedLoaded] = useState(false);

  // CRUD dialog state
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [deleteNodeTarget, setDeleteNodeTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState<{ id: string; sourceLabel: string; targetLabel: string } | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{ sourceId: string; targetId: string; sourceLabel: string; targetLabel: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "node" | "edge"; id: string; label: string; edgeSourceLabel?: string; edgeTargetLabel?: string } | null>(null);
  const [editNodeTarget, setEditNodeTarget] = useState<GraphNodeType | null>(null);
  const [editEdgeTarget, setEditEdgeTarget] = useState<{ edge: GraphEdgeType; sourceLabel: string; targetLabel: string } | null>(null);

  // User edits persistence
  const userEdits = useUserEdits(repoId);

  // Load generated repo data on mount
  useEffect(() => {
    async function loadGenerated() {
      const manifest = await loadGeneratedManifest();
      // Load current repo if it's a generated one
      if (repoId && manifest.includes(repoId)) {
        await loadGeneratedRepo(repoId);
      }
      // Also pre-load all generated repos for the dropdown
      await Promise.all(manifest.map((id) => loadGeneratedRepo(id)));
      setGeneratedLoaded(true);
    }
    loadGenerated();
  }, [repoId]);

  const allRepos = useMemo(() => getAllRepositories(), [generatedLoaded]);
  const repo = allRepos.find((r) => r.id === repoId) || allRepos[0];

  // Get repo-specific system groups
  const repoSystemGroups = useMemo(() => getSystemGroupsForRepo(repoId), [repoId, generatedLoaded]);
  const groupLabels: Record<string, string> = useMemo(
    () => Object.fromEntries(repoSystemGroups.map((g) => [g.id, g.label])),
    [repoSystemGroups]
  );

  // Convert demo data to React Flow nodes — merge user edits and filter file level by parent module
  const graphNodes = useMemo(() => {
    let nodes = getNodesForLevel(zoomLevel, repoId);
    if (zoomLevel === "file" && fileModuleId) {
      nodes = nodes.filter((n) => n.parentId === fileModuleId);
    }
    return userEdits.mergeNodes(nodes, zoomLevel);
  }, [zoomLevel, fileModuleId, repoId, generatedLoaded, userEdits.mergeNodes]);
  const graphEdges = useMemo(() => userEdits.mergeEdges(getEdgesForLevel(zoomLevel, repoId)), [zoomLevel, repoId, generatedLoaded, userEdits.mergeEdges]);
  const groupedNodes = useMemo(() => getNodesGroupedBySystem(graphNodes, repoId), [graphNodes, repoId]);

  // L4 overview: when at file level without drilled module, group by parentId
  const isL4Overview = zoomLevel === "file" && !fileModuleId;

  // Build parent module info for L4 overview grouping
  const l4ParentGroups = useMemo(() => {
    if (!isL4Overview) return { grouped: groupedNodes, groups: repoSystemGroups };

    // Get module nodes to look up parent labels/colors
    const moduleNodes = getNodesForLevel("module", repoId);
    const moduleMap = new Map(moduleNodes.map(m => [m.id, m]));

    // Group L4 nodes by parentId
    const grouped = new Map<string, GraphNodeType[]>();
    const groupDefs: { id: string; label: string; color: string }[] = [];
    const seenParents = new Set<string>();

    // Default colors for groups
    const defaultColors = [
      "hsl(220, 70%, 55%)", "hsl(280, 60%, 50%)", "hsl(150, 50%, 45%)",
      "hsl(35, 65%, 50%)", "hsl(350, 60%, 50%)", "hsl(180, 50%, 40%)",
      "hsl(100, 45%, 45%)", "hsl(260, 50%, 55%)",
    ];

    for (const node of graphNodes) {
      const parentKey = node.parentId || "__ungrouped__";
      if (!grouped.has(parentKey)) grouped.set(parentKey, []);
      grouped.get(parentKey)!.push(node);

      if (!seenParents.has(parentKey)) {
        seenParents.add(parentKey);
        const parentModule = moduleMap.get(parentKey);
        // Find matching system group color for this module
        const moduleGroup = parentModule?.group;
        const sysGroup = moduleGroup ? repoSystemGroups.find(g => g.id === moduleGroup) : undefined;
        groupDefs.push({
          id: parentKey,
          label: parentModule?.label || parentKey,
          color: sysGroup?.color || defaultColors[groupDefs.length % defaultColors.length],
        });
      }
    }

    return { grouped, groups: groupDefs };
  }, [isL4Overview, graphNodes, repoId, groupedNodes, repoSystemGroups]);

  // Effective groups/positions — switch between normal and L4 overview
  const effectiveGroupedNodes = l4ParentGroups.grouped;
  const effectiveGroups = l4ParentGroups.groups;

  // Calculate dynamic group positions based on node counts
  const dynamicGroupPositions = useMemo(
    () => calculateDynamicGroupPositions(effectiveGroupedNodes, effectiveGroups),
    [effectiveGroupedNodes, effectiveGroups]
  );

  // Compute focused node IDs when focus mode is enabled
  const focusedNodeIds = useMemo(() => {
    if (!focusMode.enabled || !selectedNode) {
      return new Set<string>();
    }
    return computeNHopNeighbors(selectedNode.id, graphEdges, focusMode.depth);
  }, [focusMode.enabled, focusMode.depth, selectedNode, graphEdges]);

  // Create regular nodes first
  const regularNodes: Node[] = useMemo(() => {
    const allNodes = graphNodes.map((node, index) => {
      // For L4 overview, use parentId as group key for positioning
      const effectiveNode = isL4Overview
        ? { ...node, group: node.parentId || "__ungrouped__" }
        : node;

      // Use persisted position for user-added nodes, otherwise calculate
      const userPos = node.id.startsWith("user-") ? userEdits.getNodePosition(node.id) : undefined;

      return {
        id: node.id,
        type: "custom",
        position: userPos || getNodePosition(index, zoomLevel, graphNodes.length, effectiveNode, effectiveGroupedNodes, dynamicGroupPositions),
        data: {
          label: node.label,
          type: node.type,
          description: node.description,
          stats: node.stats,
          hasProblem: node.hasProblem,
          group: isL4Overview ? (node.parentId || "__ungrouped__") : node.group,
          purpose: node.purpose,
          level: node.level,
          isHighlighted: selectedNode?.id === node.id,
          isDimmed:
            (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (focusMode.enabled && selectedNode && !focusedNodeIds.has(node.id)),
          isUserEdited: userEdits.isNodeEdited(node.id),
          isUserAdded: userEdits.isNodeUserAdded(node.id),
        },
      };
    });

    // In "hide" mode, filter out non-focused nodes
    if (focusMode.enabled && focusMode.displayMode === "hide" && selectedNode) {
      return allNodes.filter((node) => focusedNodeIds.has(node.id));
    }
    return allNodes;
  }, [graphNodes, zoomLevel, selectedNode, searchQuery, effectiveGroupedNodes, dynamicGroupPositions, focusMode, focusedNodeIds, isL4Overview, userEdits.getNodePosition, userEdits.isNodeEdited, userEdits.isNodeUserAdded]);

  // Effective group labels — at L4 overview use parent module labels
  const effectiveGroupLabels: Record<string, string> = useMemo(() => {
    if (isL4Overview) {
      return Object.fromEntries(effectiveGroups.map((g) => [g.id, g.label]));
    }
    return groupLabels;
  }, [isL4Overview, effectiveGroups, groupLabels]);

  // Build color lookup from effective groups
  const effectiveGroupColors: Record<string, string> = useMemo(
    () => Object.fromEntries(effectiveGroups.map((g) => [g.id, g.color])),
    [effectiveGroups]
  );

  // Create group background nodes that move with the canvas
  const groupNodes: Node[] = useMemo(() => {
    if (zoomLevel === "system" || zoomLevel === "context") return [];

    const groups: Node[] = [];

    for (const [groupKey, label] of Object.entries(effectiveGroupLabels)) {
      const group = groupKey as SystemGroup;
      const bounds = calculateGroupBounds(regularNodes, group);

      if (bounds) {
        groups.push({
          id: `group-${group}`,
          type: "group",
          position: { x: bounds.x, y: bounds.y },
          data: {
            label: label,
            group: group,
            width: bounds.width,
            height: bounds.height,
            color: effectiveGroupColors[groupKey] || "",
          },
          zIndex: -1,
          selectable: false,
          draggable: false,
        });
      }
    }

    return groups;
  }, [regularNodes, zoomLevel, effectiveGroupLabels, effectiveGroupColors]);

  // Combine group nodes (background) with regular nodes
  const initialNodes: Node[] = useMemo(() => {
    return [...groupNodes, ...regularNodes];
  }, [groupNodes, regularNodes]);

  const initialEdges: Edge[] = useMemo(() => {
    // Level-aware edge filtering
    let filteredEdges = graphEdges.filter((edge) => {
      // L1: no filtering
      if (zoomLevel === "context") return true;
      // L2: if verifiedOnly → edge.verified === true
      if (zoomLevel === "system" && edgeFilters.verifiedOnly && !edge.verified) return false;
      // L3: verifiedOnly + circularOnly
      if (zoomLevel === "module") {
        if (edgeFilters.verifiedOnly && !edge.verified) return false;
        if (edgeFilters.circularOnly && !edge.isCircular) return false;
      }
      // L4: weight threshold
      if (zoomLevel === "file" && (edge.weight || 1) < edgeFilters.weightThreshold) return false;
      return true;
    });

    // In "hide" mode, filter out edges where both endpoints aren't visible
    if (focusMode.enabled && focusMode.displayMode === "hide" && selectedNode) {
      filteredEdges = filteredEdges.filter(
        (edge) => focusedNodeIds.has(edge.source) && focusedNodeIds.has(edge.target)
      );
    }

    return filteredEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "animated",
      data: {
        type: edge.type,
        isCircular: edge.isCircular,
        label: edge.label,
        verified: edge.verified,
        weight: edge.weight,
        communicationMode: edge.communicationMode,
        protocol: edge.protocol,
        dataSource: edge.dataSource,
        isUserEdited: userEdits.isEdgeEdited(edge.id),
        animationEnabled: animationSettings.enabled,
        animationSpeed: animationSettings.speed,
        isHighlighted:
          selectedNode?.id === edge.source || selectedNode?.id === edge.target,
        isDimmed:
          (searchQuery
            ? !graphNodes.some(
                (n) =>
                  (n.id === edge.source || n.id === edge.target) &&
                  n.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : false) ||
          (focusMode.enabled &&
            selectedNode &&
            focusMode.displayMode === "dim" &&
            (!focusedNodeIds.has(edge.source) || !focusedNodeIds.has(edge.target))),
      },
    }));
  }, [graphEdges, graphNodes, edgeFilters, selectedNode, searchQuery, focusMode, focusedNodeIds, zoomLevel, animationSettings, userEdits.isEdgeEdited]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when deps change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graphNodes.find((n) => n.id === node.id);
      if (!graphNode) return;
      setSelectedNode(graphNode);
    },
    [graphNodes]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graphNodes.find((n) => n.id === node.id);
      if (!graphNode) return;

      // Double-click a module at L3 → drill into L4 (file view)
      if (zoomLevel === "module" && graphNode.level === "module") {
        const repoFileNodes = getNodesForLevel("file", repoId);
        const hasChildren = repoFileNodes.some((n) => n.parentId === graphNode.id);
        if (hasChildren) {
          setFileModuleId(graphNode.id);
          setZoomLevel("file");
          setSelectedNode(null);
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
          }, 100);
        }
      }
    },
    [graphNodes, zoomLevel, reactFlowInstance, repoId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const handleZoomChange = useCallback((level: ZoomLevel) => {
    setZoomLevel(level);
    setSelectedNode(null);
    if (level !== "file") setFileModuleId(null);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
  }, [reactFlowInstance]);

  const handleEdgeFilterChange = useCallback(
    (updates: Partial<EdgeFilters>) => {
      setEdgeFilters((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleAnimationSettingsChange = useCallback(
    (updates: Partial<AnimationSettings>) => {
      setAnimationSettings((prev) => {
        const next = { ...prev, ...updates };
        try { localStorage.setItem("legend-animation-settings", JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    []
  );

  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      const graphNode = graphNodes.find((n) => n.id === nodeId);
      if (graphNode) {
        setSelectedNode(graphNode);
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 50, {
            zoom: 1,
            duration: 500,
          });
        }
      }
    },
    [graphNodes, nodes, reactFlowInstance]
  );

  const handleRepoChange = useCallback(
    (newRepoId: string) => {
      navigate(`/loading/${newRepoId}`);
    },
    [navigate]
  );

  const handleSignOut = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Handle navigation to file or directory from Code tab — drill into the parent module
  const handleNavigateToFile = useCallback(
    (filePath: string) => {
      const repoFileNodes = getNodesForLevel("file", repoId);

      // Strategy 1: Find L4 directory node whose codeFiles array contains this exact file path
      let fileNode = repoFileNodes.find(
        (n) => n.codeFiles?.some((cf) => cf.path === filePath)
      );

      // Strategy 2: Directory path — find the L4 node whose codeFiles live under this directory
      // (handles folder clicks from FileTree, e.g. "api/src/auth")
      if (!fileNode) {
        const dirPrefix = filePath + "/";
        // Pick the most specific match: the node where the MOST files match the prefix
        let bestCount = 0;
        for (const n of repoFileNodes) {
          if (!n.codeFiles) continue;
          const matchCount = n.codeFiles.filter((cf) => cf.path.startsWith(dirPrefix)).length;
          if (matchCount > 0 && matchCount > bestCount) {
            bestCount = matchCount;
            fileNode = n;
          }
        }
      }

      // Strategy 3: Match by directory prefix on labels/ids
      if (!fileNode) {
        const fileDirParts = filePath.split("/");
        for (let depth = fileDirParts.length - 1; depth >= 1; depth--) {
          const prefix = fileDirParts.slice(0, depth).join("/");
          fileNode = repoFileNodes.find(
            (n) => n.label.includes(prefix) || n.id.includes(prefix.replace(/\//g, "-"))
          );
          if (fileNode) break;
        }
      }

      // Strategy 4: Fallback to fuzzy label match
      if (!fileNode) {
        fileNode = repoFileNodes.find(
          (n) =>
            n.label.toLowerCase().includes(filePath.toLowerCase()) ||
            filePath.toLowerCase().includes(n.label.toLowerCase())
        );
      }

      if (fileNode && fileNode.parentId) {
        setFileModuleId(fileNode.parentId);
        setZoomLevel("file");

        // Small delay to let the zoom level change take effect
        setTimeout(() => {
          setSelectedNode(fileNode!);
          reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
        }, 150);
      }
    },
    [reactFlowInstance, repoId]
  );

  // Handle back navigation from L4 to L3
  const handleBackToModules = useCallback(() => {
    setZoomLevel("module");
    setFileModuleId(null);
    setSelectedNode(null);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [reactFlowInstance]);

  // Context menu for nodes
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const graphNode = graphNodes.find((n) => n.id === node.id);
      if (!graphNode) return;
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        id: node.id,
        label: graphNode.label,
      });
    },
    [graphNodes]
  );

  // Context menu for edges
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const sourceNode = graphNodes.find((n) => n.id === edge.source);
      const targetNode = graphNodes.find((n) => n.id === edge.target);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        id: edge.id,
        label: "",
        edgeSourceLabel: sourceNode?.label || edge.source,
        edgeTargetLabel: targetNode?.label || edge.target,
      });
    },
    [graphNodes]
  );

  // Handle new edge connection via drag
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const sourceNode = graphNodes.find((n) => n.id === connection.source);
      const targetNode = graphNodes.find((n) => n.id === connection.target);
      setPendingConnection({
        sourceId: connection.source,
        targetId: connection.target,
        sourceLabel: sourceNode?.label || connection.source,
        targetLabel: targetNode?.label || connection.target,
      });
    },
    [graphNodes]
  );

  // Persist position when user-added nodes are dragged
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("user-")) {
        userEdits.updateNodePosition(node.id, node.position);
      }
    },
    [userEdits.updateNodePosition]
  );

  // Get viewport center for placing new nodes
  const getViewportCenter = useCallback(() => {
    const viewport = reactFlowInstance.getViewport();
    const pane = document.querySelector(".react-flow__pane");
    const width = pane?.clientWidth || 800;
    const height = pane?.clientHeight || 600;
    return {
      x: (-viewport.x + width / 2) / viewport.zoom,
      y: (-viewport.y + height / 2) / viewport.zoom,
    };
  }, [reactFlowInstance]);

  // Export edits as a file download
  const handleExportEdits = useCallback(() => {
    const json = userEdits.exportEdits();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legend-edits-${repoId || "default"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [userEdits.exportEdits, repoId]);

  // Import edits from a file
  const handleImportEdits = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const json = reader.result as string;
        userEdits.importEdits(json);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [userEdits.importEdits]);

  // Handle opening edit dialog for a node (from DetailPanel or context menu)
  const handleEditNode = useCallback(
    (node: GraphNodeType) => {
      setEditNodeTarget(node);
    },
    []
  );

  // Handle opening edit dialog for an edge (from context menu)
  const handleEditEdge = useCallback(
    (edgeId: string) => {
      const edge = graphEdges.find((e) => e.id === edgeId);
      if (!edge) return;
      const sourceNode = graphNodes.find((n) => n.id === edge.source);
      const targetNode = graphNodes.find((n) => n.id === edge.target);
      setEditEdgeTarget({
        edge,
        sourceLabel: sourceNode?.label || edge.source,
        targetLabel: targetNode?.label || edge.target,
      });
    },
    [graphEdges, graphNodes]
  );

  // Get zoom level label — show parent module name at file level
  const getZoomLabel = () => {
    switch (zoomLevel) {
      case "context":
        return "Context View";
      case "system":
        return "System View";
      case "module":
        return "Module View";
      case "file": {
        if (fileModuleId) {
          const repoModuleNodes = getNodesForLevel("module", repoId);
          const parentModule = repoModuleNodes.find((n) => n.id === fileModuleId);
          return parentModule ? `Files: ${parentModule.label}` : "File View";
        }
        return "File View";
      }
    }
  };

  // Loading guard — AFTER all hooks to avoid React hooks violation
  if (!generatedLoaded || !repo) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading architecture data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top navigation */}
      <header className="h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold hidden sm:block">Legend</span>
          </div>

          {/* Repo selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <span className="font-medium">{repo.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allRepos.map((r) => (
                <DropdownMenuItem key={r.id} onClick={() => handleRepoChange(r.id)}>
                  {r.owner}/{r.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Back button when at file level */}
          {zoomLevel === "file" && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleBackToModules}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Modules</span>
            </Button>
          )}

          {/* Zoom level indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
            <span className="text-muted-foreground">View:</span>
            <span className="font-medium">{getZoomLabel()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files, functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          {/* Create component button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setAddNodeOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add component</TooltipContent>
          </Tooltip>

          {/* Export/Import edits */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportEdits}>
                <Download className="w-4 h-4 mr-2" />
                Export edits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportEdits}>
                <Upload className="w-4 h-4 mr-2" />
                Import edits
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <GraphSidebar
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          edgeFilters={edgeFilters}
          onEdgeFilterChange={handleEdgeFilterChange}
          onFitView={handleFitView}
          focusMode={focusMode}
          onFocusModeChange={(updates) => setFocusMode((prev) => ({ ...prev, ...updates }))}
          hasSelectedNode={!!selectedNode}
          animationEnabled={animationSettings.enabled}
          animationSpeed={animationSettings.speed}
          onAnimationSettingsChange={handleAnimationSettingsChange}
        />

        {/* Graph canvas */}
        <motion.div
          className="flex-1 relative"
          animate={{ width: selectedNode ? "calc(100% - 400px)" : "100%" }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPaneClick={handlePaneClick}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            onConnect={handleConnect}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="hsl(var(--muted-foreground) / 0.15)" gap={24} size={1} />


            <MiniMap
              nodeColor={(node) => {
                const data = node.data as { hasProblem?: boolean };
                return data?.hasProblem ? "hsl(var(--destructive))" : "hsl(var(--primary))";
              }}
              maskColor="hsla(var(--background) / 0.8)"
              className="!bg-card !border rounded-lg"
            />
          </ReactFlow>
          <DiagramLegend />
        </motion.div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNavigateToNode={handleNavigateToNode}
              onNavigateToFile={handleNavigateToFile}
              onEditNode={handleEditNode}
              onEditField={userEdits.editNodeField}
              getFieldEdits={userEdits.getFieldEdits}
              getNodeNote={userEdits.getNodeNote}
              setNodeNote={userEdits.setNodeNote}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Onboarding tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onZoomChange={handleZoomChange}
      />

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === "node" ? (
            <>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  const node = graphNodes.find((n) => n.id === contextMenu.id);
                  if (node) handleEditNode(node);
                  setContextMenu(null);
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit node
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                onClick={() => {
                  setDeleteNodeTarget({ id: contextMenu.id, label: contextMenu.label });
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete node
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  handleEditEdge(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit connection
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                onClick={() => {
                  setDeleteEdgeTarget({
                    id: contextMenu.id,
                    sourceLabel: contextMenu.edgeSourceLabel || "",
                    targetLabel: contextMenu.edgeTargetLabel || "",
                  });
                  setContextMenu(null);
                }}
              >
                <Unlink className="w-4 h-4" />
                Delete connection
              </button>
            </>
          )}
        </div>
      )}

      {/* Add node dialog */}
      <AddNodeDialog
        open={addNodeOpen}
        onClose={() => setAddNodeOpen(false)}
        onAdd={(node, pos) => userEdits.addNode(node, pos)}
        zoomLevel={zoomLevel}
        systemGroups={repoSystemGroups}
        viewportCenter={getViewportCenter()}
      />

      {/* Delete node dialog */}
      <DeleteNodeDialog
        open={!!deleteNodeTarget}
        nodeName={deleteNodeTarget?.label || ""}
        onClose={() => setDeleteNodeTarget(null)}
        onConfirm={() => {
          if (deleteNodeTarget) {
            userEdits.deleteNode(deleteNodeTarget.id);
            if (selectedNode?.id === deleteNodeTarget.id) setSelectedNode(null);
          }
        }}
      />

      {/* Add edge dialog (from handle-to-handle drag) */}
      <AddEdgeDialog
        open={!!pendingConnection}
        sourceLabel={pendingConnection?.sourceLabel || ""}
        targetLabel={pendingConnection?.targetLabel || ""}
        sourceId={pendingConnection?.sourceId || ""}
        targetId={pendingConnection?.targetId || ""}
        onClose={() => setPendingConnection(null)}
        onAdd={(edge) => userEdits.addEdge(edge)}
      />

      {/* Delete edge dialog */}
      <DeleteEdgeDialog
        open={!!deleteEdgeTarget}
        sourceLabel={deleteEdgeTarget?.sourceLabel || ""}
        targetLabel={deleteEdgeTarget?.targetLabel || ""}
        onClose={() => setDeleteEdgeTarget(null)}
        onConfirm={() => {
          if (deleteEdgeTarget) userEdits.deleteEdge(deleteEdgeTarget.id);
        }}
      />

      {/* Edit node dialog */}
      {editNodeTarget && (
        <EditNodeDialog
          open={!!editNodeTarget}
          onClose={() => setEditNodeTarget(null)}
          node={editNodeTarget}
          onSave={(edits) => {
            userEdits.editNode(editNodeTarget.id, edits);
            // Update selectedNode if it's the one being edited
            if (selectedNode?.id === editNodeTarget.id) {
              setSelectedNode({ ...selectedNode, ...edits });
            }
          }}
          systemGroups={repoSystemGroups}
        />
      )}

      {/* Edit edge dialog */}
      {editEdgeTarget && (
        <EditEdgeDialog
          open={!!editEdgeTarget}
          onClose={() => setEditEdgeTarget(null)}
          edge={editEdgeTarget.edge}
          onSave={(edits) => {
            userEdits.editEdge(editEdgeTarget.edge.id, edits);
          }}
          sourceLabel={editEdgeTarget.sourceLabel}
          targetLabel={editEdgeTarget.targetLabel}
        />
      )}
    </div>
  );
}

export function GraphView() {
  return (
    <ReactFlowProvider>
      <GraphViewInner />
    </ReactFlowProvider>
  );
}
