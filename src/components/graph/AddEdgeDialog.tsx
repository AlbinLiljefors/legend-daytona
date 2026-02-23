import { useState } from "react";
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

interface AddEdgeDialogProps {
  open: boolean;
  sourceLabel: string;
  targetLabel: string;
  onClose: () => void;
  onAdd: (edge: GraphEdge) => void;
  sourceId: string;
  targetId: string;
}

export function AddEdgeDialog({
  open,
  sourceLabel,
  targetLabel,
  onClose,
  onAdd,
  sourceId,
  targetId,
}: AddEdgeDialogProps) {
  const [edgeType, setEdgeType] = useState<EdgeType>("depends-on");
  const [label, setLabel] = useState("");

  const handleSubmit = () => {
    const id = `user-edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const edge: GraphEdge = {
      id,
      source: sourceId,
      target: targetId,
      type: edgeType,
      label: label.trim() || undefined,
      verified: false,
    };

    onAdd(edge);
    setEdgeType("depends-on");
    setLabel("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add connection</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{sourceLabel}</span>
          {" → "}
          <span className="font-medium text-foreground">{targetLabel}</span>
        </p>

        <div className="space-y-4 py-2">
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
            <Label htmlFor="edge-label">Label</Label>
            <Input
              id="edge-label"
              placeholder="Optional label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add connection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
