// Dynamic data loader for pipeline-generated repo data
// Fetches JSON from /generated/<repoId>.json at runtime

import type {
  GeneratedRepoData,
  Repository,
  SystemGroupDef,
  GraphNode,
  GraphEdge,
  ZoomLevel,
} from "./types";

// In-memory cache of loaded repos
const cache = new Map<string, GeneratedRepoData>();

// Manifest of available generated repos (loaded once)
let manifestCache: string[] | null = null;

export async function loadGeneratedManifest(): Promise<string[]> {
  if (manifestCache !== null) return manifestCache;

  try {
    const resp = await fetch("/generated/manifest.json");
    if (!resp.ok) {
      manifestCache = [];
      return [];
    }
    const data = await resp.json();
    manifestCache = Array.isArray(data) ? data : [];
    return manifestCache;
  } catch {
    manifestCache = [];
    return [];
  }
}

export async function loadGeneratedRepo(repoId: string): Promise<GeneratedRepoData | null> {
  if (cache.has(repoId)) return cache.get(repoId)!;

  try {
    const resp = await fetch(`/generated/${repoId}.json`);
    if (!resp.ok) return null;
    const data: GeneratedRepoData = await resp.json();
    cache.set(repoId, data);
    return data;
  } catch {
    return null;
  }
}

export function getLoadedRepo(repoId: string): GeneratedRepoData | null {
  return cache.get(repoId) || null;
}

export function getGeneratedRepositories(): Repository[] {
  return Array.from(cache.values()).map((d) => d.repository);
}

export function getGeneratedSystemGroups(repoId: string): SystemGroupDef[] {
  const data = cache.get(repoId);
  return data?.systemGroups || [];
}

export function getGeneratedNodesForLevel(level: ZoomLevel, repoId: string): GraphNode[] {
  const data = cache.get(repoId);
  if (!data) return [];
  switch (level) {
    case "context": return data.contextNodes;
    case "system": return data.systemNodes;
    case "module": return data.moduleNodes;
    case "file": return data.fileNodes;
  }
}

export function getGeneratedEdgesForLevel(level: ZoomLevel, repoId: string): GraphEdge[] {
  const data = cache.get(repoId);
  if (!data) return [];
  switch (level) {
    case "context": return data.contextEdges;
    case "system": return data.systemEdges;
    case "module": return data.moduleEdges;
    case "file": return data.fileEdges;
  }
}
