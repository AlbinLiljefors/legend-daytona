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
import { GraphNode, NodeType, ZoomLevel, SystemGroupDef } from "@/data/types";

const nodeTypeOptions: { value: NodeType; label: string }[] = [
  { value: "component", label: "Component" },
  { value: "api", label: "API" },
  { value: "utility", label: "Utility" },
  { value: "data", label: "Data" },
  { value: "config", label: "Config" },
];

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (node: GraphNode, position: { x: number; y: number }) => void;
  zoomLevel: ZoomLevel;
  systemGroups: SystemGroupDef[];
  viewportCenter: { x: number; y: number };
}

export function AddNodeDialog({
  open,
  onClose,
  onAdd,
  zoomLevel,
  systemGroups,
  viewportCenter,
}: AddNodeDialogProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<NodeType>("component");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState<string>("");

  const showGroup = zoomLevel === "module" || zoomLevel === "file";

  const handleSubmit = () => {
    if (!label.trim()) return;

    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const node: GraphNode = {
      id,
      label: label.trim(),
      type,
      description: description.trim() || `User-created ${type}`,
      stats: "User added",
      level: zoomLevel,
      group: showGroup && group ? group : undefined,
    };

    onAdd(node, viewportCenter);
    // Reset form
    setLabel("");
    setType("component");
    setDescription("");
    setGroup("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add component</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="node-label">Label *</Label>
            <Input
              id="node-label"
              placeholder="e.g. Auth Service"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NodeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodeTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="node-desc">Description</Label>
            <Input
              id="node-desc"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {showGroup && systemGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {systemGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
