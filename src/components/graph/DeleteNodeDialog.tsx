import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteNodeDialogProps {
  open: boolean;
  nodeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteNodeDialog({
  open,
  nodeName,
  onClose,
  onConfirm,
}: DeleteNodeDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === "delete") {
      onConfirm();
      setConfirmText("");
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setConfirmText(""); onClose(); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{nodeName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the node and all its connections. Type{" "}
            <span className="font-mono font-semibold text-foreground">delete</span> to
            confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          placeholder='Type "delete" to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setConfirmText(""); onClose(); }}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={confirmText.toLowerCase() !== "delete"}
            onClick={handleConfirm}
          >
            Delete node
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
