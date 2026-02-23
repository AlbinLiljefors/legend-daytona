// Shared type definitions for Legend graph data
// Used by both hardcoded demo data and dynamically loaded generated data

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  lastUpdated: string;
}

export type NodeType = "component" | "api" | "utility" | "data" | "config" | "problem" | "actor" | "external";
export type ZoomLevel = "context" | "system" | "module" | "file";

// SystemGroup is now a string to support dynamically generated repos
export type SystemGroup = string;

export interface TechnicalSpec {
  title: string;
  details: string;
}

export interface WorkflowStep {
  step: number;
  description: string;
}

export interface EdgeCase {
  scenario: string;
  handling: string;
  severity?: "info" | "warning" | "critical";
}

export interface SystemFlow {
  diagram: string;
}

export interface ComponentInteraction {
  component: string;
  role: string;
}

export interface DataFlow {
  inputs: string[];
  processing: string[];
  outputs: string[];
}

export interface LogicLocation {
  name: string;
  file: string;
  functionName?: string;
  steps: string[];
}

export interface ImplementationFile {
  path: string;
  purpose: string;
  exports?: {
    name: string;
    signature?: string;
    responsibility: string;
    calledBy?: string;
  }[];
  dependencies?: string[];
}

export interface TechnicalDecision {
  topic: string;
  decision: string;
  rationale: string[];
  tradeoffs?: {
    benefits: string[];
    drawbacks?: string[];
  };
}

export interface CodeFile {
  path: string;
  language: string;
  symbolCount: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  stats: string;
  level: ZoomLevel;
  parentId?: string;
  group?: SystemGroup;
  codeFiles?: CodeFile[];
  hasProblem?: boolean;
  problemDescription?: string;
  functionalities?: {
    name: string;
    description: string;
    items?: string[];
  }[];
  technicalSpecs?: TechnicalSpec[];
  architecture?: string;
  keyDecisions?: string[];
  connections?: {
    inputs: { name: string; id: string }[];
    outputs: { name: string; id: string }[];
  };
  dependencies?: {
    external: string[];
    internal: string[];
  };
  purpose?: string;
  howItWorks?: {
    overview?: string;
    workflow?: WorkflowStep[];
    edgeCases?: EdgeCase[];
  };
  architectureDetails?: {
    overview?: string;
    systemFlow?: SystemFlow;
    componentInteractions?: ComponentInteraction[];
    dataFlow?: DataFlow;
  };
  logicLocations?: LogicLocation[];
  implementationFiles?: ImplementationFile[];
  technicalDecisions?: TechnicalDecision[];
  confidenceScore?: number;  // 0.0-1.0
}

export type EdgeType = "integrates-with" | "depends-on" | "dependency";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  verified: boolean;
  weight?: number;
  isCircular?: boolean;
  communicationMode?: "sync" | "async";
  protocol?: string;          // "http" | "grpc" | "kafka" | "rabbitmq" | "redis" | "postgres" | "sqs" etc.
  dataSource?: "scip" | "config" | "ai";  // provenance tracking
}

export interface SystemGroupDef {
  id: string;
  label: string;
  color: string;
}

// Shape of generated repo JSON files
export interface GeneratedRepoData {
  repository: Repository;
  systemGroups: SystemGroupDef[];
  contextNodes: GraphNode[];
  contextEdges: GraphEdge[];
  systemNodes: GraphNode[];
  systemEdges: GraphEdge[];
  moduleNodes: GraphNode[];
  moduleEdges: GraphEdge[];
  fileNodes: GraphNode[];
  fileEdges: GraphEdge[];
}
