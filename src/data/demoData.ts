// Minimal demoData module — re-exports types from types.ts
// and provides data access functions that delegate to the generated data loader.
// No hardcoded demo data; all repos come from pipeline-generated JSON.

import type { GraphEdge, GraphNode, SystemGroupDef, ZoomLevel } from "./types";
import {
  getGeneratedRepositories,
  getLoadedRepo,
  getGeneratedNodesForLevel,
  getGeneratedEdgesForLevel,
  getGeneratedSystemGroups,
} from "./loader";

// Re-export all types so existing imports keep working
export type {
  Repository,
  NodeType,
  ZoomLevel,
  SystemGroup,
  TechnicalSpec,
  WorkflowStep,
  EdgeCase,
  SystemFlow,
  ComponentInteraction,
  DataFlow,
  LogicLocation,
  ImplementationFile,
  TechnicalDecision,
  CodeFile,
  GraphNode,
  GraphEdge,
  EdgeType,
  SystemGroupDef,
  GeneratedRepoData,
} from "./types";

// No hardcoded demo repos — only generated repos
export const demoRepositories: never[] = [];

export function getAllRepositories() {
  return getGeneratedRepositories();
}

export function getSystemGroupsForRepo(repoId: string): SystemGroupDef[] {
  return getGeneratedSystemGroups(repoId);
}

export function getNodesForLevel(level: ZoomLevel, repoId: string): GraphNode[] {
  return getGeneratedNodesForLevel(level, repoId);
}

export function getEdgesForLevel(level: ZoomLevel, repoId: string): GraphEdge[] {
  return getGeneratedEdgesForLevel(level, repoId);
}

export function getNodesGroupedBySystem(
  nodes: GraphNode[]
): Map<string, GraphNode[]> {
  const groups = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const group = node.group || "ungrouped";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(node);
  }
  return groups;
}
