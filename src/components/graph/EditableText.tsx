import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  isEdited?: boolean;
  className?: string;
}

export function EditableText({
  value,
  onChange,
  placeholder = "Click to add...",
  multiline = false,
  isEdited = false,
  className,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const save = useCallback(() => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  }, [draft, value, onChange]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !multiline)) {
        e.preventDefault();
        save();
      }
    },
    [cancel, save, multiline]
  );

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setDraft(e.target.value),
      onBlur: save,
      onKeyDown: handleKeyDown,
      placeholder,
      className:
        "w-full bg-background border border-primary/40 rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y",
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={3}
          {...sharedProps}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        {...sharedProps}
      />
    );
  }

  const isEmpty = !value;

  return (
    <div
      className={cn(
        "group/editable relative cursor-pointer rounded-md transition-colors hover:bg-muted/50 -mx-1 px-1 py-0.5",
        className
      )}
      onDoubleClick={() => setEditing(true)}
    >
      <span
        className={cn(
          "text-sm leading-relaxed",
          isEmpty && "text-muted-foreground italic",
          isEdited && "text-primary/90"
        )}
      >
        {value || placeholder}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="absolute right-0 top-0 p-1 opacity-0 group-hover/editable:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        aria-label="Edit"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
