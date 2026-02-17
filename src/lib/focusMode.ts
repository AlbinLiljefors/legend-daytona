// Focus Mode utility functions for graph visualization

export type FocusDisplayMode = "dim" | "hide";

export interface FocusModeState {
  enabled: boolean;
  displayMode: FocusDisplayMode;
  depth: number; // 1-3 hops
}

export const defaultFocusModeState: FocusModeState = {
  enabled: false,
  displayMode: "dim",
  depth: 1,
};

/**
 * Computes all node IDs within n-hops of the given node using BFS.
 * Treats the graph as undirected for neighbor discovery.
 *
 * @param nodeId - The starting node ID
 * @param edges - Array of edges with source and target properties
 * @param maxHops - Maximum number of hops (1-3)
 * @returns Set of node IDs within n-hops (including the starting node)
 */
export function computeNHopNeighbors(
  nodeId: string,
  edges: { source: string; target: string }[],
  maxHops: number
): Set<string> {
  const visited = new Set<string>([nodeId]);
  const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];

  // Build adjacency map once for O(1) lookups
  const adjacencyMap = new Map<string, string[]>();
  for (const edge of edges) {
    // Add both directions for bidirectional traversal
    if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, []);
    if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, []);
    adjacencyMap.get(edge.source)!.push(edge.target);
    adjacencyMap.get(edge.target)!.push(edge.source);
  }

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= maxHops) continue;

    const neighbors = adjacencyMap.get(id) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }

  return visited;
}

/**
 * Filters edges to only include those where both endpoints are in the visible set
 */
export function getVisibleEdges<T extends { source: string; target: string }>(
  edges: T[],
  visibleNodeIds: Set<string>
): T[] {
  return edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
}
