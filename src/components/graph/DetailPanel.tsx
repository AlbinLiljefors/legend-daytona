import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRightLeft,
  Wrench,
  Database,
  Settings,
  AlertTriangle,
  Users,
  Cloud,
  Target,
  Cpu,
  ArrowDownToLine,
  ArrowUpFromLine,
  GitBranch,
  FileCode,
  Lightbulb,
  Network,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
  FolderOpen,
  Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraphNode,
  NodeType,
  WorkflowStep,
  EdgeCase,
  ComponentInteraction,
  DataFlow,
  LogicLocation,
  ImplementationFile,
  TechnicalDecision
} from "@/data/demoData";
import { cn } from "@/lib/utils";

interface DetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
  onNavigateToFile?: (filePath: string) => void;
}

const nodeTypeConfig: Record<NodeType, {
  icon: React.ElementType;
  label: string;
  bgClass: string;
}> = {
  component: {
    icon: Layers,
    label: "Component",
    bgClass: "bg-node-component/10 text-node-component",
  },
  api: {
    icon: ArrowRightLeft,
    label: "API",
    bgClass: "bg-node-api/10 text-node-api",
  },
  utility: {
    icon: Wrench,
    label: "Utility",
    bgClass: "bg-node-utility/10 text-node-utility",
  },
  data: {
    icon: Database,
    label: "Data",
    bgClass: "bg-node-data/10 text-node-data",
  },
  config: {
    icon: Settings,
    label: "Config",
    bgClass: "bg-node-config/10 text-node-config",
  },
  problem: {
    icon: AlertTriangle,
    label: "Problem",
    bgClass: "bg-node-problem/10 text-node-problem",
  },
  actor: {
    icon: Users,
    label: "Actor",
    bgClass: "bg-node-actor/10 text-node-actor",
  },
  external: {
    icon: Cloud,
    label: "External System",
    bgClass: "bg-node-external/10 text-node-external",
  },
};

// Check if node has enhanced data (demo format or pipeline format)
function hasEnhancedData(node: GraphNode): boolean {
  return !!(node.purpose || node.howItWorks || node.architectureDetails ||
            node.logicLocations || node.implementationFiles || node.technicalDecisions ||
            node.dependencies || node.architecture || node.keyDecisions ||
            node.technicalSpecs);
}

export function DetailPanel({ node, onClose, onNavigateToNode, onNavigateToFile }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!node) return null;

  const config = nodeTypeConfig[node.type];
  const Icon = config.icon;
  const enhanced = hasEnhancedData(node);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-[480px] bg-card border-l h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-b from-secondary/30 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className={cn("gap-1.5 px-2.5 py-1", config.bgClass)}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </Badge>
                {node.level !== "system" && node.level !== "context" && (
                  <Badge variant="outline" className="text-xs">
                    {node.level === "file" ? "File" : "Module"}
                  </Badge>
                )}
                {node.level === "context" && (
                  <Badge variant="outline" className="text-xs">
                    Context
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground truncate mb-1">
                {node.label}
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                {node.stats}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Problem Alert - Always visible if present */}
        {node.hasProblem && node.problemDescription && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">Issue Detected</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {node.problemDescription}
            </p>
          </div>
        )}

        {/* Content - with or without tabs */}
        {enhanced ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-5 pt-4">
              <TabsList className="w-full grid grid-cols-5 h-9">
                <TabsTrigger value="overview" className="text-xs px-2">Overview</TabsTrigger>
                <TabsTrigger value="architecture" className="text-xs px-2">Arch</TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-2">Code</TabsTrigger>
                <TabsTrigger value="decisions" className="text-xs px-2">Decisions</TabsTrigger>
                <TabsTrigger value="connections" className="text-xs px-2">Links</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="overview" className="mt-0 p-5 space-y-4">
                <OverviewTab node={node} />
              </TabsContent>

              <TabsContent value="architecture" className="mt-0 p-5 space-y-4">
                <ArchitectureTab node={node} />
              </TabsContent>

              <TabsContent value="code" className="mt-0 p-5 space-y-4">
                <CodeTab node={node} onNavigateToFile={onNavigateToFile} />
              </TabsContent>

              <TabsContent value="decisions" className="mt-0 p-5 space-y-4">
                <DecisionsTab node={node} />
              </TabsContent>

              <TabsContent value="connections" className="mt-0 p-5 space-y-4">
                <ConnectionsTab node={node} onNavigateToNode={onNavigateToNode} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              <LegacyContent node={node} onNavigateToNode={onNavigateToNode} />
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== TAB CONTENT COMPONENTS ====================

// Overview Tab: Purpose + How it Works
function OverviewTab({ node }: { node: GraphNode }) {
  return (
    <>
      {/* Purpose Section */}
      <InfoCard icon={<Target className="w-4 h-4" />} title="Purpose" variant="primary">
        <p className="text-sm text-foreground leading-relaxed">
          {node.purpose || node.description}
        </p>
      </InfoCard>

      {/* How it Works Section */}
      {node.howItWorks && (
        <InfoCard icon={<Cpu className="w-4 h-4" />} title="How It Works" variant="secondary">
          <div className="space-y-4">
            {/* Overview */}
            {node.howItWorks.overview && (
              <p className="text-sm text-foreground leading-relaxed">
                {node.howItWorks.overview}
              </p>
            )}

            {/* Workflow Steps */}
            {node.howItWorks.workflow && node.howItWorks.workflow.length > 0 && (
              <WorkflowTimeline steps={node.howItWorks.workflow} />
            )}

            {/* Edge Cases */}
            {node.howItWorks.edgeCases && node.howItWorks.edgeCases.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Edge Cases
                </span>
                <div className="mt-2 space-y-2">
                  {node.howItWorks.edgeCases.map((edgeCase, index) => (
                    <EdgeCaseCard key={index} edgeCase={edgeCase} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Fallback to legacy How It Works if no enhanced data */}
      {!node.howItWorks && (node.architecture || node.technicalSpecs || node.keyDecisions) && (
        <InfoCard icon={<Cpu className="w-4 h-4" />} title="How It Works" variant="secondary">
          <div className="space-y-4">
            {node.architecture && (
              <p className="text-sm text-foreground leading-relaxed">
                {node.architecture}
              </p>
            )}

            {node.technicalSpecs && node.technicalSpecs.length > 0 && (
              <div className="space-y-2">
                {node.technicalSpecs.map((spec, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0 w-20">
                      {spec.title}
                    </span>
                    <span className="text-foreground">{spec.details}</span>
                  </div>
                ))}
              </div>
            )}

            {node.keyDecisions && node.keyDecisions.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Key Decisions
                </span>
                <ul className="mt-2 space-y-1.5">
                  {node.keyDecisions.map((decision, index) => (
                    <li key={index} className="text-sm text-foreground leading-relaxed flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </InfoCard>
      )}
    </>
  );
}

// Architecture Tab: System Flow, Component Interactions, Data Flow
function ArchitectureTab({ node }: { node: GraphNode }) {
  const arch = node.architectureDetails;
  const hasPipelineArch = !arch && !!(node.architecture || node.technicalSpecs);

  if (!arch && !hasPipelineArch) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No architecture details available</p>
      </div>
    );
  }

  // Fallback: render pipeline fields (architecture string + technicalSpecs)
  if (!arch && hasPipelineArch) {
    return (
      <>
        {node.architecture && (
          <InfoCard icon={<Network className="w-4 h-4" />} title="Architecture Overview" variant="primary">
            <p className="text-sm text-foreground leading-relaxed">
              {node.architecture}
            </p>
          </InfoCard>
        )}

        {node.technicalSpecs && node.technicalSpecs.length > 0 && (
          <InfoCard icon={<Cpu className="w-4 h-4" />} title="Technical Specs" variant="secondary">
            <div className="space-y-2">
              {node.technicalSpecs.map((spec, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <span className="font-medium text-muted-foreground shrink-0 w-24">
                    {spec.title}
                  </span>
                  <span className="text-foreground">{spec.details}</span>
                </div>
              ))}
            </div>
          </InfoCard>
        )}
      </>
    );
  }

  return (
    <>
      {/* Overview */}
      {arch!.overview && (
        <InfoCard icon={<Network className="w-4 h-4" />} title="Architecture Overview" variant="primary">
          <p className="text-sm text-foreground leading-relaxed">
            {arch!.overview}
          </p>
        </InfoCard>
      )}

      {/* System Flow Diagram */}
      {arch!.systemFlow && (
        <InfoCard icon={<GitBranch className="w-4 h-4" />} title="System Flow" variant="secondary">
          <SystemFlowDiagram diagram={arch!.systemFlow.diagram} />
        </InfoCard>
      )}

      {/* Component Interactions */}
      {arch!.componentInteractions && arch!.componentInteractions.length > 0 && (
        <InfoCard icon={<Layers className="w-4 h-4" />} title="Component Interactions" variant="secondary">
          <div className="space-y-3">
            {arch!.componentInteractions.map((interaction, index) => (
              <ComponentInteractionCard key={index} interaction={interaction} />
            ))}
          </div>
        </InfoCard>
      )}

      {/* Data Flow */}
      {arch!.dataFlow && (
        <InfoCard icon={<ArrowRightLeft className="w-4 h-4" />} title="Data Flow" variant="muted">
          <DataFlowCard dataFlow={arch!.dataFlow} />
        </InfoCard>
      )}
    </>
  );
}

// Code Tab: Logic Locations, Implementation Files
function CodeTab({
  node,
  onNavigateToFile,
}: {
  node: GraphNode;
  onNavigateToFile?: (filePath: string) => void;
}) {
  const hasLogic = node.logicLocations && node.logicLocations.length > 0;
  const hasFiles = node.implementationFiles && node.implementationFiles.length > 0;

  if (!hasLogic && !hasFiles) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No code details available</p>
      </div>
    );
  }

  return (
    <>
      {/* Logic Locations */}
      {hasLogic && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Code2 className="w-4 h-4 text-primary" />
            Logic Locations
          </div>
          <div className="space-y-3">
            {node.logicLocations!.map((location, index) => (
              <LogicCard
                key={index}
                location={location}
                onClick={onNavigateToFile ? () => onNavigateToFile(location.file) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Implementation Files */}
      {hasFiles && (
        <div className={hasLogic ? "pt-4 border-t border-border/50" : ""}>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <FolderOpen className="w-4 h-4 text-primary" />
            Implementation Files
          </div>
          <div className="space-y-3">
            {node.implementationFiles!.map((file, index) => (
              <ImplementationFileCard
                key={index}
                file={file}
                onClick={onNavigateToFile ? () => onNavigateToFile(file.path) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Decisions Tab: Technical Decisions
function DecisionsTab({ node }: { node: GraphNode }) {
  const hasStructuredDecisions = node.technicalDecisions && node.technicalDecisions.length > 0;
  const hasPipelineDecisions = node.keyDecisions && node.keyDecisions.length > 0;

  if (!hasStructuredDecisions && !hasPipelineDecisions) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No technical decisions documented</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasStructuredDecisions && node.technicalDecisions!.map((decision, index) => (
        <DecisionCard key={index} decision={decision} />
      ))}

      {!hasStructuredDecisions && hasPipelineDecisions && (
        <InfoCard icon={<Lightbulb className="w-4 h-4" />} title="Key Decisions" variant="secondary">
          <ul className="space-y-2">
            {node.keyDecisions!.map((decision, index) => (
              <li key={index} className="text-sm text-foreground leading-relaxed flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}
    </div>
  );
}

// Connections Tab: Input/Output + Dependencies
function ConnectionsTab({
  node,
  onNavigateToNode
}: {
  node: GraphNode;
  onNavigateToNode: (nodeId: string) => void;
}) {
  const hasConnections = node.connections &&
    (node.connections.inputs.length > 0 || node.connections.outputs.length > 0);
  const hasDependencies = node.dependencies &&
    (node.dependencies.external.length > 0 || node.dependencies.internal.length > 0);

  return (
    <>
      {/* Input/Output Connections */}
      {hasConnections && (
        <InfoCard icon={<ArrowRightLeft className="w-4 h-4" />} title="Input / Output" variant="secondary">
          <div className="space-y-4">
            {node.connections!.inputs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  <ArrowDownToLine className="w-3 h-3" />
                  Receives From
                </div>
                <div className="space-y-1">
                  {node.connections!.inputs.map((input, index) => (
                    <ConnectionButton
                      key={index}
                      name={input.name}
                      direction="input"
                      onClick={() => onNavigateToNode(input.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {node.connections!.outputs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  <ArrowUpFromLine className="w-3 h-3" />
                  Provides To
                </div>
                <div className="space-y-1">
                  {node.connections!.outputs.map((output, index) => (
                    <ConnectionButton
                      key={index}
                      name={output.name}
                      direction="output"
                      onClick={() => onNavigateToNode(output.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Dependencies */}
      {hasDependencies && (
        <InfoCard icon={<GitBranch className="w-4 h-4" />} title="Dependencies" variant="muted">
          <div className="space-y-3">
            {node.dependencies!.external.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  External
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {node.dependencies!.external.map((dep, index) => (
                    <Badge key={index} variant="secondary" className="font-mono text-xs px-2 py-0.5">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {node.dependencies!.internal.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Internal
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {node.dependencies!.internal.map((dep, index) => (
                    <Badge key={index} variant="outline" className="font-mono text-xs px-2 py-0.5">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Functionalities */}
      {node.functionalities && node.functionalities.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Key Features
          </div>
          <div className="space-y-2">
            {node.functionalities.map((func, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{func.name}</span>
                  <span className="text-muted-foreground"> — {func.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Legacy content for nodes without enhanced data
function LegacyContent({
  node,
  onNavigateToNode
}: {
  node: GraphNode;
  onNavigateToNode: (nodeId: string) => void;
}) {
  return (
    <>
      {/* Purpose */}
      <InfoCard icon={<Target className="w-4 h-4" />} title="Purpose" variant="primary">
        <p className="text-sm text-foreground leading-relaxed">
          {node.description}
        </p>
      </InfoCard>

      {/* How It Works */}
      {(node.architecture || node.technicalSpecs || node.keyDecisions) && (
        <InfoCard icon={<Cpu className="w-4 h-4" />} title="How It Works" variant="secondary">
          <div className="space-y-4">
            {node.architecture && (
              <p className="text-sm text-foreground leading-relaxed">
                {node.architecture}
              </p>
            )}

            {node.technicalSpecs && node.technicalSpecs.length > 0 && (
              <div className="space-y-2">
                {node.technicalSpecs.map((spec, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0 w-20">
                      {spec.title}
                    </span>
                    <span className="text-foreground">{spec.details}</span>
                  </div>
                ))}
              </div>
            )}

            {node.keyDecisions && node.keyDecisions.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Key Decisions
                </span>
                <ul className="mt-2 space-y-1.5">
                  {node.keyDecisions.map((decision, index) => (
                    <li key={index} className="text-sm text-foreground leading-relaxed flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Input/Output */}
      {node.connections && (node.connections.inputs.length > 0 || node.connections.outputs.length > 0) && (
        <InfoCard icon={<ArrowRightLeft className="w-4 h-4" />} title="Input / Output" variant="secondary">
          <div className="space-y-4">
            {node.connections.inputs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  <ArrowDownToLine className="w-3 h-3" />
                  Receives From
                </div>
                <div className="space-y-1">
                  {node.connections.inputs.map((input, index) => (
                    <ConnectionButton
                      key={index}
                      name={input.name}
                      direction="input"
                      onClick={() => onNavigateToNode(input.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {node.connections.outputs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  <ArrowUpFromLine className="w-3 h-3" />
                  Provides To
                </div>
                <div className="space-y-1">
                  {node.connections.outputs.map((output, index) => (
                    <ConnectionButton
                      key={index}
                      name={output.name}
                      direction="output"
                      onClick={() => onNavigateToNode(output.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Dependencies */}
      {node.dependencies && (node.dependencies.external.length > 0 || node.dependencies.internal.length > 0) && (
        <InfoCard icon={<GitBranch className="w-4 h-4" />} title="Dependencies" variant="muted">
          <div className="space-y-3">
            {node.dependencies.external.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  External
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {node.dependencies.external.map((dep, index) => (
                    <Badge key={index} variant="secondary" className="font-mono text-xs px-2 py-0.5">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {node.dependencies.internal.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Internal
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {node.dependencies.internal.map((dep, index) => (
                    <Badge key={index} variant="outline" className="font-mono text-xs px-2 py-0.5">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Functionalities */}
      {node.functionalities && node.functionalities.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Key Features
          </div>
          <div className="space-y-2">
            {node.functionalities.map((func, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{func.name}</span>
                  <span className="text-muted-foreground"> — {func.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ==================== SUB-COMPONENTS ====================

// Info Card Component
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  variant?: "primary" | "secondary" | "muted";
  children: React.ReactNode;
}

function InfoCard({ icon, title, variant = "secondary", children }: InfoCardProps) {
  const variantStyles = {
    primary: "bg-primary/5 border-primary/20",
    secondary: "bg-secondary/50 border-border",
    muted: "bg-muted/30 border-border/50",
  };

  return (
    <div className={cn("rounded-xl border p-4", variantStyles[variant])}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

// Connection Button Component
interface ConnectionButtonProps {
  name: string;
  direction: "input" | "output";
  onClick: () => void;
}

function ConnectionButton({ name, onClick }: ConnectionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-background transition-colors group text-sm border border-transparent hover:border-border"
    >
      <span className="text-foreground font-medium">{name}</span>
      <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        Go to
        <ExternalLink className="w-3 h-3" />
      </span>
    </button>
  );
}

// Workflow Timeline Component
function WorkflowTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 z-10">
              <span className="text-xs font-semibold text-primary">{step.step}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed pt-0.5">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Edge Case Card Component
function EdgeCaseCard({ edgeCase }: { edgeCase: EdgeCase }) {
  const severityConfig = {
    info: { icon: Info, className: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
    warning: { icon: AlertCircle, className: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600" },
    critical: { icon: AlertTriangle, className: "bg-red-500/10 border-red-500/20 text-red-600" },
  };

  const config = severityConfig[edgeCase.severity || "info"];
  const SeverityIcon = config.icon;

  return (
    <div className={cn("rounded-lg border p-3", config.className.split(" ").slice(0, 2).join(" "))}>
      <div className="flex items-start gap-2">
        <SeverityIcon className={cn("w-4 h-4 shrink-0 mt-0.5", config.className.split(" ")[2])} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{edgeCase.scenario}</p>
          <p className="text-xs text-muted-foreground">{edgeCase.handling}</p>
        </div>
      </div>
    </div>
  );
}

// System Flow Diagram Component
function SystemFlowDiagram({ diagram }: { diagram: string }) {
  return (
    <pre className="text-xs font-mono bg-background/50 p-4 rounded-lg border border-border/50 overflow-x-auto whitespace-pre leading-relaxed text-foreground">
      {diagram}
    </pre>
  );
}

// Component Interaction Card
function ComponentInteractionCard({ interaction }: { interaction: ComponentInteraction }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="shrink-0">
        <Badge variant="outline" className="font-mono text-xs">
          {interaction.component}
        </Badge>
      </div>
      <p className="text-muted-foreground leading-relaxed">{interaction.role}</p>
    </div>
  );
}

// Data Flow Card
function DataFlowCard({ dataFlow }: { dataFlow: DataFlow }) {
  return (
    <div className="space-y-4">
      {/* Inputs */}
      {dataFlow.inputs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <ArrowDownToLine className="w-3 h-3" />
            Inputs
          </div>
          <ul className="space-y-1">
            {dataFlow.inputs.map((input, index) => (
              <li key={index} className="text-sm text-foreground flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span className="font-mono text-xs">{input}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Processing */}
      {dataFlow.processing.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <Cpu className="w-3 h-3" />
            Processing
          </div>
          <ul className="space-y-1">
            {dataFlow.processing.map((step, index) => (
              <li key={index} className="text-sm text-foreground flex gap-2">
                <span className="text-primary shrink-0">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outputs */}
      {dataFlow.outputs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <ArrowUpFromLine className="w-3 h-3" />
            Outputs
          </div>
          <ul className="space-y-1">
            {dataFlow.outputs.map((output, index) => (
              <li key={index} className="text-sm text-foreground flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span className="font-mono text-xs">{output}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Logic Location Card
function LogicCard({
  location,
  onClick,
}: {
  location: LogicLocation;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/50 p-3",
        onClick && "cursor-pointer hover:border-primary/50 hover:bg-background/80 transition-colors group"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-medium text-sm text-foreground">{location.name}</span>
        {onClick && (
          <span className="text-xs text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            View in graph
            <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <FileCode className="w-3 h-3 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{location.file}</span>
        </div>
        {location.functionName && (
          <div className="flex items-center gap-2 text-xs">
            <Code2 className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-primary">{location.functionName}()</span>
          </div>
        )}
        {location.steps.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <ul className="space-y-1">
              {location.steps.map((step, index) => (
                <li key={index} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary shrink-0">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Implementation File Card
function ImplementationFileCard({
  file,
  onClick,
}: {
  file: ImplementationFile;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/50 p-3",
        onClick && "cursor-pointer hover:border-primary/50 hover:bg-background/80 transition-colors group"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm font-medium text-foreground">{file.path}</span>
        </div>
        {onClick && (
          <span className="text-xs text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            View
            <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{file.purpose}</p>

      {file.exports && file.exports.length > 0 && (
        <div className="space-y-2">
          {file.exports.map((exp, index) => (
            <div key={index} className="text-xs bg-secondary/30 rounded p-2">
              <div className="font-mono text-foreground font-medium">{exp.name}</div>
              {exp.signature && (
                <div className="font-mono text-muted-foreground text-[10px] mt-0.5">{exp.signature}</div>
              )}
              <div className="text-muted-foreground mt-1">{exp.responsibility}</div>
              {exp.calledBy && (
                <div className="text-muted-foreground mt-0.5">
                  Called by: <span className="text-primary">{exp.calledBy}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {file.dependencies && file.dependencies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {file.dependencies.map((dep, index) => (
            <Badge key={index} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
              {dep}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Decision Card Component
function DecisionCard({ decision }: { decision: TechnicalDecision }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-start gap-3 mb-3">
        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {decision.topic}
          </span>
          <h4 className="text-sm font-semibold text-foreground mt-0.5">
            {decision.decision}
          </h4>
        </div>
      </div>

      {/* Rationale */}
      <div className="mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Rationale
        </span>
        <ul className="mt-1.5 space-y-1">
          {decision.rationale.map((reason, index) => (
            <li key={index} className="text-sm text-foreground flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tradeoffs */}
      {decision.tradeoffs && (
        <div className="pt-3 border-t border-border/50 space-y-2">
          {decision.tradeoffs.benefits && decision.tradeoffs.benefits.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 mb-1">
                <CheckCircle2 className="w-3 h-3" />
                Benefits
              </div>
              <ul className="space-y-0.5">
                {decision.tradeoffs.benefits.map((benefit, index) => (
                  <li key={index} className="text-xs text-muted-foreground pl-4">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {decision.tradeoffs.drawbacks && decision.tradeoffs.drawbacks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 mb-1">
                <XCircle className="w-3 h-3" />
                Drawbacks
              </div>
              <ul className="space-y-0.5">
                {decision.tradeoffs.drawbacks.map((drawback, index) => (
                  <li key={index} className="text-xs text-muted-foreground pl-4">
                    {drawback}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
