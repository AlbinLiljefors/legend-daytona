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

interface DeleteEdgeDialogProps {
  open: boolean;
  sourceLabel: string;
  targetLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteEdgeDialog({
  open,
  sourceLabel,
  targetLabel,
  onClose,
  onConfirm,
}: DeleteEdgeDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete connection?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove the connection from{" "}
            <span className="font-medium text-foreground">{sourceLabel}</span>
            {" to "}
            <span className="font-medium text-foreground">{targetLabel}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete connection
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
