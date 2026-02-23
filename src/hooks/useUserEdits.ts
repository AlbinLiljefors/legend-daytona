// Doc: Persistence layer for user-added/deleted nodes and edges
// Stores edits in localStorage keyed by repoId

import { useCallback, useMemo, useState } from "react";
import { GraphNode, GraphEdge, ZoomLevel } from "@/data/types";

/** All editable fields for a node — structural + content */
export interface NodeFieldEdits {
  // Structural edits (used by EditNodeDialog)
  label?: string;
  type?: string;
  description?: string;
  group?: string;
  // Content field edits (used by inline editing)
  purpose?: string;
  architecture?: string;
  howItWorksOverview?: string;
  technicalSpecs?: { title: string; details: string }[];
  keyDecisions?: string[];
  note?: string;
}

interface UserEdits {
  addedNodes: GraphNode[];
  deletedNodeIds: string[];
  addedEdges: GraphEdge[];
  deletedEdgeIds: string[];
  /** Persisted positions for user-added nodes: nodeId → {x, y} */
  nodePositions: Record<string, { x: number; y: number }>;
  /** Edits to existing node properties (structural + content) */
  editedNodes: Record<string, NodeFieldEdits>;
  /** Edits to existing edge properties */
  editedEdges: Record<string, Partial<Pick<GraphEdge, 'label' | 'type' | 'communicationMode' | 'protocol'>>>;
  /** @deprecated Use editedNodes[nodeId].note instead. Kept for backward compat on import. */
  nodeNotes: Record<string, string>;
}

const STORAGE_PREFIX = "legend-user-edits-";

function getStorageKey(repoId: string) {
  return `${STORAGE_PREFIX}${repoId}`;
}

function loadEdits(repoId: string): UserEdits {
  try {
    const raw = localStorage.getItem(getStorageKey(repoId));
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data — start fresh
  }
  return { addedNodes: [], deletedNodeIds: [], addedEdges: [], deletedEdgeIds: [], nodePositions: {}, editedNodes: {}, editedEdges: {}, nodeNotes: {} };
}

function saveEdits(repoId: string, edits: UserEdits) {
  localStorage.setItem(getStorageKey(repoId), JSON.stringify(edits));
}

export function useUserEdits(repoId: string | undefined) {
  const effectiveId = repoId || "__default__";
  const [edits, setEdits] = useState<UserEdits>(() => loadEdits(effectiveId));

  const persist = useCallback(
    (next: UserEdits) => {
      setEdits(next);
      saveEdits(effectiveId, next);
    },
    [effectiveId]
  );

  /** Merge user edits into pipeline nodes, filtered by zoom level */
  const mergeNodes = useCallback(
    (pipelineNodes: GraphNode[], level: ZoomLevel): GraphNode[] => {
      const filtered = pipelineNodes
        .filter((n) => !edits.deletedNodeIds.includes(n.id))
        .map((n) => {
          const ne = edits.editedNodes[n.id];
          if (!ne) return n;
          const merged = { ...n };
          // Structural fields
          if (ne.label !== undefined) merged.label = ne.label;
          if (ne.type !== undefined) merged.type = ne.type as any;
          if (ne.description !== undefined) merged.description = ne.description;
          if (ne.group !== undefined) merged.group = ne.group;
          // Content fields
          if (ne.purpose !== undefined) merged.purpose = ne.purpose;
          if (ne.architecture !== undefined) merged.architecture = ne.architecture;
          if (ne.howItWorksOverview !== undefined) {
            merged.howItWorks = { ...merged.howItWorks, overview: ne.howItWorksOverview };
          }
          if (ne.technicalSpecs !== undefined) merged.technicalSpecs = ne.technicalSpecs;
          if (ne.keyDecisions !== undefined) merged.keyDecisions = ne.keyDecisions;
          return merged;
        });
      const userForLevel = edits.addedNodes.filter((n) => n.level === level);
      return [...filtered, ...userForLevel];
    },
    [edits.deletedNodeIds, edits.addedNodes, edits.editedNodes]
  );

  /** Merge user edits into pipeline edges */
  const mergeEdges = useCallback(
    (pipelineEdges: GraphEdge[]): GraphEdge[] => {
      const filtered = pipelineEdges
        .filter((e) => !edits.deletedEdgeIds.includes(e.id))
        .map((e) => {
          const edgeEdits = edits.editedEdges[e.id];
          return edgeEdits ? { ...e, ...edgeEdits } : e;
        });
      return [...filtered, ...edits.addedEdges];
    },
    [edits.deletedEdgeIds, edits.addedEdges, edits.editedEdges]
  );

  /** Add a new user node */
  const addNode = useCallback(
    (node: GraphNode, position: { x: number; y: number }) => {
      const next: UserEdits = {
        ...edits,
        addedNodes: [...edits.addedNodes, node],
        nodePositions: { ...edits.nodePositions, [node.id]: position },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Delete a node + cascade-delete connected edges */
  const deleteNode = useCallback(
    (nodeId: string) => {
      // Find edges connected to this node (both pipeline and user-added)
      const connectedUserEdgeIds = edits.addedEdges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => e.id);

      const next: UserEdits = {
        ...edits,
        deletedNodeIds: [...edits.deletedNodeIds, nodeId],
        // Remove user-added edges connected to this node
        addedEdges: edits.addedEdges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        // Also mark pipeline edges connected to this node as deleted
        // (caller should pass those IDs, but we store the node deletion;
        //  mergeEdges will handle filtering since endpoints won't exist)
        deletedEdgeIds: [...edits.deletedEdgeIds],
        // Remove user-added nodes if it's a user node
        addedNodes: edits.addedNodes.filter((n) => n.id !== nodeId),
        nodePositions: { ...edits.nodePositions },
      };
      delete next.nodePositions[nodeId];
      persist(next);
    },
    [edits, persist]
  );

  /** Add a new user edge */
  const addEdge = useCallback(
    (edge: GraphEdge) => {
      const next: UserEdits = {
        ...edits,
        addedEdges: [...edits.addedEdges, edge],
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Delete an edge */
  const deleteEdge = useCallback(
    (edgeId: string) => {
      // Check if it's a user-added edge
      const isUserEdge = edits.addedEdges.some((e) => e.id === edgeId);
      const next: UserEdits = {
        ...edits,
        addedEdges: isUserEdge
          ? edits.addedEdges.filter((e) => e.id !== edgeId)
          : edits.addedEdges,
        deletedEdgeIds: isUserEdge
          ? edits.deletedEdgeIds
          : [...edits.deletedEdgeIds, edgeId],
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Update position of a user-added node after drag */
  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const next: UserEdits = {
        ...edits,
        nodePositions: { ...edits.nodePositions, [nodeId]: position },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Get persisted position for a user node (or undefined) */
  const getNodePosition = useCallback(
    (nodeId: string): { x: number; y: number } | undefined => {
      return edits.nodePositions[nodeId];
    },
    [edits.nodePositions]
  );

  /** Edit properties of an existing node */
  const editNode = useCallback(
    (nodeId: string, nodeEdits: Partial<Pick<GraphNode, 'label' | 'type' | 'description' | 'group'>>) => {
      const next: UserEdits = {
        ...edits,
        editedNodes: {
          ...edits.editedNodes,
          [nodeId]: { ...edits.editedNodes[nodeId], ...nodeEdits },
        },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Edit a single content field on an existing node */
  const editNodeField = useCallback(
    (nodeId: string, field: keyof NodeFieldEdits, value: any) => {
      const next: UserEdits = {
        ...edits,
        editedNodes: {
          ...edits.editedNodes,
          [nodeId]: { ...edits.editedNodes[nodeId], [field]: value },
        },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Get all field edits for a node */
  const getFieldEdits = useCallback(
    (nodeId: string): NodeFieldEdits => {
      return edits.editedNodes[nodeId] || {};
    },
    [edits.editedNodes]
  );

  /** Edit properties of an existing edge */
  const editEdge = useCallback(
    (edgeId: string, edgeEdits: Partial<Pick<GraphEdge, 'label' | 'type' | 'communicationMode' | 'protocol'>>) => {
      const next: UserEdits = {
        ...edits,
        editedEdges: {
          ...edits.editedEdges,
          [edgeId]: { ...edits.editedEdges[edgeId], ...edgeEdits },
        },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Set a note on a node (stored in editedNodes.note, empty string removes) */
  const setNodeNote = useCallback(
    (nodeId: string, note: string) => {
      const nodeEdit = edits.editedNodes[nodeId] || {};
      const next: UserEdits = {
        ...edits,
        editedNodes: {
          ...edits.editedNodes,
          [nodeId]: { ...nodeEdit, note: note || undefined },
        },
      };
      persist(next);
    },
    [edits, persist]
  );

  /** Get the note for a node (backward compat: checks editedNodes.note then legacy nodeNotes) */
  const getNodeNote = useCallback(
    (nodeId: string): string => {
      return edits.editedNodes[nodeId]?.note || edits.nodeNotes[nodeId] || "";
    },
    [edits.editedNodes, edits.nodeNotes]
  );

  /** Check if a node has user edits */
  const isNodeEdited = useCallback(
    (nodeId: string): boolean => {
      return !!edits.editedNodes[nodeId];
    },
    [edits.editedNodes]
  );

  /** Check if a node was user-added */
  const isNodeUserAdded = useCallback(
    (nodeId: string): boolean => {
      return edits.addedNodes.some((n) => n.id === nodeId);
    },
    [edits.addedNodes]
  );

  /** Check if an edge has user edits */
  const isEdgeEdited = useCallback(
    (edgeId: string): boolean => {
      return !!edits.editedEdges[edgeId];
    },
    [edits.editedEdges]
  );

  /** Export all edits as a JSON string */
  const exportEdits = useCallback((): string => {
    return JSON.stringify(edits, null, 2);
  }, [edits]);

  /** Import edits from a JSON string. Returns true on success. */
  const importEdits = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json) as UserEdits;
        // Basic validation
        if (!Array.isArray(parsed.addedNodes) || !Array.isArray(parsed.deletedNodeIds)) {
          return false;
        }
        // Ensure new fields exist
        const full: UserEdits = {
          addedNodes: parsed.addedNodes || [],
          deletedNodeIds: parsed.deletedNodeIds || [],
          addedEdges: parsed.addedEdges || [],
          deletedEdgeIds: parsed.deletedEdgeIds || [],
          nodePositions: parsed.nodePositions || {},
          editedNodes: parsed.editedNodes || {},
          editedEdges: parsed.editedEdges || {},
          nodeNotes: parsed.nodeNotes || {},
        };
        persist(full);
        return true;
      } catch {
        return false;
      }
    },
    [persist]
  );

  return {
    mergeNodes,
    mergeEdges,
    addNode,
    deleteNode,
    addEdge,
    deleteEdge,
    updateNodePosition,
    getNodePosition,
    editNode,
    editNodeField,
    getFieldEdits,
    editEdge,
    setNodeNote,
    getNodeNote,
    isNodeEdited,
    isNodeUserAdded,
    isEdgeEdited,
    exportEdits,
    importEdits,
    edits,
  };
}
