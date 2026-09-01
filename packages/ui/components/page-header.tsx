import * as React from "react";

/** Left-aligned page title block with optional description and actions.
 *  For standard app pages — hero (font-display) titles are a different
 *  pattern and do not use this component. */
export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground mt-2 text-sm">
                        {description}
                    </p>
                )}
            </div>
            {actions}
        </div>
    );
}
