import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const buttonVariants = cva(
    "font-display inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-clay-btn hover:bg-primary-hover",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-[0_4px_0_#991b1b] hover:bg-destructive/90",
                outline:
                    "border-border bg-card text-foreground shadow-clay-secondary hover:bg-muted border",
                secondary:
                    "border-border bg-card text-foreground shadow-clay-secondary hover:bg-muted border",
                ghost: "hover:bg-muted hover:text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                tableAction:
                    "border-border bg-card text-secondary-foreground hover:bg-muted border font-sans font-medium",
                tableActionDanger:
                    "border-border bg-card text-secondary-foreground hover:bg-destructive-faint hover:text-destructive border font-sans font-medium",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-9 px-4",
                lg: "h-11 px-7",
                icon: "h-10 w-10",
                tableIcon: "h-[30px] w-[30px] rounded-lg [&_svg]:size-3.5",
                tableText: "h-[30px] rounded-lg px-[11px] text-[12.5px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
