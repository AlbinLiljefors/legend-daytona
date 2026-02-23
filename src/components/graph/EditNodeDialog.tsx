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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraphNode, NodeType, SystemGroupDef } from "@/data/types";

const nodeTypeOptions: { value: NodeType; label: string }[] = [
  { value: "component", label: "Component" },
  { value: "api", label: "API" },
  { value: "utility", label: "Utility" },
  { value: "data", label: "Data" },
  { value: "config", label: "Config" },
];

interface EditNodeDialogProps {
  open: boolean;
  onClose: () => void;
  node: GraphNode;
  onSave: (edits: Partial<Pick<GraphNode, 'label' | 'type' | 'description' | 'group'>>) => void;
  systemGroups: SystemGroupDef[];
}

export function EditNodeDialog({
  open,
  onClose,
  node,
  onSave,
  systemGroups,
}: EditNodeDialogProps) {
  const [label, setLabel] = useState(node.label);
  const [type, setType] = useState<NodeType>(node.type);
  const [description, setDescription] = useState(node.description);
  const [group, setGroup] = useState<string>(node.group || "");

  // Reset form when node changes
  useEffect(() => {
    setLabel(node.label);
    setType(node.type);
    setDescription(node.description);
    setGroup(node.group || "");
  }, [node]);

  const showGroup = node.level === "module" || node.level === "file";

  const handleSubmit = () => {
    const edits: Partial<Pick<GraphNode, 'label' | 'type' | 'description' | 'group'>> = {};
    if (label.trim() !== node.label) edits.label = label.trim();
    if (type !== node.type) edits.type = type;
    if (description.trim() !== node.description) edits.description = description.trim();
    if (showGroup && group !== (node.group || "")) edits.group = group || undefined;

    if (Object.keys(edits).length > 0) {
      onSave(edits);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit component</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-node-label">Label</Label>
            <Input
              id="edit-node-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
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
            <Label htmlFor="edit-node-desc">Description</Label>
            <Textarea
              id="edit-node-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
