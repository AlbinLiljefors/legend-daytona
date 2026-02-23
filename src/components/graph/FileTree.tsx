import { useState, useMemo, useCallback } from "react";
import {
  ChevronRight,
  FileCode,
  FolderOpen,
  FolderClosed,
  ChevronsUpDown,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CodeFile } from "@/data/types";

// Language color mapping (matches DetailPanel's LANG_COLORS)
const LANG_COLORS: Record<string, string> = {
  TypeScript: "text-blue-500",
  JavaScript: "text-yellow-500",
  Python: "text-green-500",
  Go: "text-cyan-500",
  Rust: "text-orange-500",
  Java: "text-red-500",
  "C#": "text-purple-500",
  Ruby: "text-red-400",
  PHP: "text-indigo-400",
  Kotlin: "text-violet-500",
  Scala: "text-red-600",
  "C++": "text-pink-500",
  C: "text-gray-500",
  Dart: "text-teal-500",
};

interface FileTreeNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  language?: string;
  symbolCount?: number;
  children: FileTreeNode[];
  fileCount: number;
}

// Build a nested tree from flat CodeFile paths
function buildFileTree(files: CodeFile[]): FileTreeNode[] {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    isDir: true,
    children: [],
    fileCount: 0,
  };

  // Build trie
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          fullPath,
          isDir: !isFile,
          children: [],
          fileCount: 0,
          ...(isFile && {
            language: file.language,
            symbolCount: file.symbolCount,
          }),
        };
        current.children.push(child);
      }
      current = child;
    }
  }

  // Count files in each subtree
  function countFiles(node: FileTreeNode): number {
    if (!node.isDir) return 1;
    node.fileCount = node.children.reduce((sum, c) => sum + countFiles(c), 0);
    return node.fileCount;
  }
  countFiles(root);

  // Collapse single-child directories (VS Code behavior)
  function collapse(node: FileTreeNode): FileTreeNode {
    if (!node.isDir) return node;

    // First collapse children recursively
    node.children = node.children.map(collapse);

    // Then collapse this node if it has exactly one child that is also a dir
    while (
      node.children.length === 1 &&
      node.children[0].isDir
    ) {
      const child = node.children[0];
      node.name = node.name ? `${node.name}/${child.name}` : child.name;
      node.fullPath = child.fullPath;
      node.children = child.children;
      node.fileCount = child.fileCount;
    }
    return node;
  }

  root.children = root.children.map(collapse);

  // Sort: dirs first (alphabetical), then files (alphabetical)
  function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
    const dirs = nodes.filter((n) => n.isDir).sort((a, b) => a.name.localeCompare(b.name));
    const fileNodes = nodes.filter((n) => !n.isDir).sort((a, b) => a.name.localeCompare(b.name));
    dirs.forEach((d) => (d.children = sortTree(d.children)));
    return [...dirs, ...fileNodes];
  }

  return sortTree(root.children);
}

// Collect all directory paths for expand/collapse state
function collectDirPaths(nodes: FileTreeNode[], depth: number, maxAutoDepth: number): Set<string> {
  const paths = new Set<string>();
  for (const node of nodes) {
    if (node.isDir) {
      if (depth < maxAutoDepth) {
        paths.add(node.fullPath);
      }
      const childPaths = collectDirPaths(node.children, depth + 1, maxAutoDepth);
      childPaths.forEach((p) => paths.add(p));
    }
  }
  return paths;
}

function getAllDirPaths(nodes: FileTreeNode[]): Set<string> {
  const paths = new Set<string>();
  for (const node of nodes) {
    if (node.isDir) {
      paths.add(node.fullPath);
      getAllDirPaths(node.children).forEach((p) => paths.add(p));
    }
  }
  return paths;
}

// -- Recursive tree row --

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  onNavigateToFile,
}: {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onNavigateToFile?: (filePath: string) => void;
}) {
  const isOpen = expanded.has(node.fullPath);

  if (!node.isDir) {
    // File row
    const langColor = node.language ? LANG_COLORS[node.language] || "text-muted-foreground" : "text-muted-foreground";
    return (
      <button
        onClick={onNavigateToFile ? () => onNavigateToFile(node.fullPath) : undefined}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-1.5 rounded text-xs",
          onNavigateToFile
            ? "hover:bg-muted/50 cursor-pointer transition-colors"
            : "cursor-default"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <FileCode className={cn("w-3.5 h-3.5 shrink-0", langColor)} />
        <span className="font-mono text-foreground truncate">{node.name}</span>
        {node.symbolCount != null && (
          <span className="flex items-center gap-0.5 text-muted-foreground shrink-0 ml-auto">
            <Hash className="w-2.5 h-2.5" />
            {node.symbolCount}
          </span>
        )}
      </button>
    );
  }

  // Directory row — chevron toggles expand/collapse, folder name navigates to L4
  return (
    <div>
      <div
        className="w-full flex items-center gap-1.5 py-1 px-1.5 rounded text-xs hover:bg-muted/50 transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(node.fullPath); }}
          className="shrink-0 p-0 bg-transparent border-none cursor-pointer"
        >
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
              isOpen && "rotate-90"
            )}
          />
        </button>
        <button
          onClick={() => {
            if (onNavigateToFile) {
              onNavigateToFile(node.fullPath);
            } else {
              onToggle(node.fullPath);
            }
          }}
          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer bg-transparent border-none p-0"
        >
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FolderClosed className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="font-mono text-foreground truncate font-medium">{node.name}</span>
        </button>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-4 shrink-0 ml-auto font-normal"
        >
          {node.fileCount}
        </Badge>
      </div>

      {isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNavigateToFile={onNavigateToFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Main component --

interface FileTreeProps {
  codeFiles: CodeFile[];
  nodeLevel?: string; // "file" (L4), "module" (L3), "system" (L2), "context" (L1)
  onNavigateToFile?: (filePath: string) => void;
}

export function FileTree({ codeFiles, nodeLevel, onNavigateToFile }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(codeFiles), [codeFiles]);

  // Smart default expand depth: L4 (few files) → 2 levels, otherwise → 1 level
  const defaultAutoDepth = nodeLevel === "file" ? 2 : 1;

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectDirPaths(tree, 0, defaultAutoDepth)
  );
  const [allExpanded, setAllExpanded] = useState(false);

  const allDirPaths = useMemo(() => getAllDirPaths(tree), [tree]);

  const togglePath = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
    setAllExpanded(false);
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      // Collapse to default
      setExpanded(collectDirPaths(tree, 0, defaultAutoDepth));
      setAllExpanded(false);
    } else {
      setExpanded(new Set(allDirPaths));
      setAllExpanded(true);
    }
  }, [allExpanded, allDirPaths, tree, defaultAutoDepth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileCode className="w-4 h-4 text-primary" />
          Source Files
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleAll}
            title={allExpanded ? "Collapse all" : "Expand all"}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </Button>
          <Badge variant="secondary" className="text-xs">
            {codeFiles.length} files
          </Badge>
        </div>
      </div>

      <div className="space-y-0">
        {tree.map((node) => (
          <TreeRow
            key={node.fullPath}
            node={node}
            depth={0}
            expanded={expanded}
            onToggle={togglePath}
            onNavigateToFile={onNavigateToFile}
          />
        ))}
      </div>
    </div>
  );
}
