import { useState } from "react";
import { Plus, X } from "lucide-react";
import { EditableText } from "./EditableText";
import { cn } from "@/lib/utils";

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  editedIndices?: Set<number>;
}

export function EditableList({
  items,
  onChange,
  placeholder = "Click to edit...",
  addLabel = "Add item",
  editedIndices,
}: EditableListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleItemChange = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-1 group/listitem"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span className="text-primary shrink-0 mt-1 text-sm">•</span>
          <div className="flex-1 min-w-0">
            <EditableText
              value={item}
              onChange={(v) => handleItemChange(index, v)}
              placeholder={placeholder}
              isEdited={editedIndices?.has(index)}
            />
          </div>
          <button
            onClick={() => handleDelete(index)}
            className={cn(
              "shrink-0 p-0.5 mt-0.5 text-muted-foreground hover:text-destructive transition-opacity",
              hoveredIndex === index ? "opacity-100" : "opacity-0"
            )}
            aria-label="Remove item"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pt-1"
      >
        <Plus className="w-3 h-3" />
        {addLabel}
      </button>
    </div>
  );
}
