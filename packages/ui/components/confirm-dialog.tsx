import { Button } from "./button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog";

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    /** Shown on the confirm button while `confirming`; falls back to confirmLabel. */
    confirmingLabel?: string;
    /** Disables both buttons and swaps the confirm label. */
    confirming?: boolean;
    onConfirm: () => void;
}

/** Destructive confirmation dialog. Call sites own the mutation, toast,
 *  and query invalidation; this component is purely presentational. */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
    confirmingLabel,
    confirming = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={confirming}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={confirming}
                    >
                        {confirming
                            ? confirmingLabel ?? confirmLabel
                            : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
