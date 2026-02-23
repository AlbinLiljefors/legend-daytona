import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EdgeType, GraphEdge } from "@/data/types";

const edgeTypeOptions: { value: EdgeType; label: string }[] = [
  { value: "integrates-with", label: "Integrates with" },
  { value: "depends-on", label: "Depends on" },
  { value: "dependency", label: "Dependency" },
];

const commModeOptions = [
  { value: "sync", label: "Sync" },
  { value: "async", label: "Async" },
];

const protocolSuggestions = ["http", "grpc", "kafka", "rabbitmq", "redis", "postgres", "sqs"];

interface EditEdgeDialogProps {
  open: boolean;
  onClose: () => void;
  edge: GraphEdge;
  onSave: (edits: Partial<Pick<GraphEdge, 'label' | 'type' | 'communicationMode' | 'protocol'>>) => void;
  sourceLabel: string;
  targetLabel: string;
}

export function EditEdgeDialog({
  open,
  onClose,
  edge,
  onSave,
  sourceLabel,
  targetLabel,
}: EditEdgeDialogProps) {
  const [label, setLabel] = useState(edge.label || "");
  const [edgeType, setEdgeType] = useState<EdgeType>(edge.type);
  const [commMode, setCommMode] = useState<string>(edge.communicationMode || "");
  const [protocol, setProtocol] = useState(edge.protocol || "");

  useEffect(() => {
    setLabel(edge.label || "");
    setEdgeType(edge.type);
    setCommMode(edge.communicationMode || "");
    setProtocol(edge.protocol || "");
  }, [edge]);

  const handleSubmit = () => {
    const edits: Partial<Pick<GraphEdge, 'label' | 'type' | 'communicationMode' | 'protocol'>> = {};
    if (label.trim() !== (edge.label || "")) edits.label = label.trim() || undefined;
    if (edgeType !== edge.type) edits.type = edgeType;
    if (commMode !== (edge.communicationMode || "")) {
      edits.communicationMode = (commMode as "sync" | "async") || undefined;
    }
    if (protocol.trim() !== (edge.protocol || "")) edits.protocol = protocol.trim() || undefined;

    if (Object.keys(edits).length > 0) {
      onSave(edits);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit connection</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{sourceLabel}</span>
          {" -> "}
          <span className="font-medium text-foreground">{targetLabel}</span>
        </p>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-edge-label">Label</Label>
            <Input
              id="edit-edge-label"
              placeholder="Optional label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={edgeType} onValueChange={(v) => setEdgeType(v as EdgeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {edgeTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Communication mode</Label>
            <Select value={commMode || "__none__"} onValueChange={(v) => setCommMode(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not set</SelectItem>
                {commModeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-edge-protocol">Protocol</Label>
            <Input
              id="edit-edge-protocol"
              placeholder="e.g. http, grpc, kafka"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              list="protocol-suggestions"
            />
            <datalist id="protocol-suggestions">
              {protocolSuggestions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
