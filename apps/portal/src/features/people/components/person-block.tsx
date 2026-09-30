import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

interface PersonBlockProps {
    icon: LucideIcon;
    title: string;
    caption: string;
    /** Sits at the right of the header, e.g. "Edit name". */
    action?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * The card both halves of a person's page share: the ownership-register
 * record and the portal account. Kept alike so that either one missing reads
 * as an absence, not as a different kind of page.
 */
export function PersonBlock({
    icon: Icon,
    title,
    caption,
    action,
    children,
}: PersonBlockProps) {
    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary-tint text-primary-tint-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{caption}</CardDescription>
                    </div>
                </div>
                {action}
            </CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
        </Card>
    );
}

export function FieldList({ children }: { children: React.ReactNode }) {
    return (
        <dl className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-3 text-sm">
            {children}
        </dl>
    );
}

export function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{children}</dd>
        </>
    );
}

/** A later part of a block, set off by a hairline. */
export function BlockSection({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn("border-t pt-4", className)}>{children}</div>;
}
