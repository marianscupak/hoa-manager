import { toast, Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success:
                        "group-[.toaster]:!bg-success-muted group-[.toaster]:!text-success group-[.toaster]:!border-success/20",
                    error: "group-[.toaster]:!bg-destructive-muted group-[.toaster]:!text-destructive group-[.toaster]:!border-destructive/20",
                    warning:
                        "group-[.toaster]:!bg-warning-muted group-[.toaster]:!text-warning group-[.toaster]:!border-warning/20",
                    info: "group-[.toaster]:!bg-info-muted group-[.toaster]:!text-info group-[.toaster]:!border-info/20",
                },
            }}
            {...props}
        />
    );
};

export { Toaster, toast };
