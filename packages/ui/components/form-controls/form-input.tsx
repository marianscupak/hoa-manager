import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "../../lib/utils";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useFormField,
} from "../form";
import { Input, type InputProps } from "../input";

export interface FormInputProps extends InputProps {
    name: string;
    label?: string;
    /** Renders a muted "optional" marker next to the label. */
    optional?: boolean;
    description?: string;
    suffix?: React.ReactNode;
    /** Accessible name for the reveal toggle on a `type="password"` field. */
    revealLabel?: string;
    /** Accessible name for the same toggle once the value is visible. */
    hideLabel?: string;
}

const InputWithSuffix = React.forwardRef<
    HTMLInputElement,
    InputProps & { suffix: React.ReactNode }
>(({ suffix, className, ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } =
        useFormField();
    return (
        <div className="relative">
            <Input
                ref={ref}
                id={formItemId}
                aria-describedby={
                    !error
                        ? formDescriptionId
                        : `${formDescriptionId} ${formMessageId}`
                }
                aria-invalid={!!error}
                className={cn("pr-8", className)}
                {...props}
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
                {suffix}
            </span>
        </div>
    );
});
InputWithSuffix.displayName = "InputWithSuffix";

/**
 * A password field the user can read back. Without this there is no way to
 * check a typo before submitting, which is the one thing a masked field makes
 * impossible and password managers otherwise paper over.
 */
const InputWithReveal = React.forwardRef<
    HTMLInputElement,
    InputProps & { revealLabel: string; hideLabel: string }
>(({ revealLabel, hideLabel, className, ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } =
        useFormField();
    const [revealed, setRevealed] = React.useState(false);
    const Icon = revealed ? EyeOff : Eye;

    return (
        <div className="relative">
            <Input
                ref={ref}
                id={formItemId}
                aria-describedby={
                    !error
                        ? formDescriptionId
                        : `${formDescriptionId} ${formMessageId}`
                }
                aria-invalid={!!error}
                {...props}
                type={revealed ? "text" : "password"}
                className={cn("pr-10", className)}
            />
            <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? hideLabel : revealLabel}
                className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex cursor-pointer items-center px-3"
            >
                <Icon className="h-4 w-4" />
            </button>
        </div>
    );
});
InputWithReveal.displayName = "InputWithReveal";

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    (
        {
            name,
            label,
            optional,
            description,
            suffix,
            revealLabel = "Show password",
            hideLabel = "Hide password",
            className,
            ...props
        },
        ref,
    ) => {
        const { control } = useFormContext();
        const isPassword = props.type === "password";

        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        {label && (
                            <FormLabel optional={optional}>{label}</FormLabel>
                        )}
                        {isPassword ? (
                            <InputWithReveal
                                revealLabel={revealLabel}
                                hideLabel={hideLabel}
                                {...field}
                                {...props}
                                ref={ref}
                                className={className}
                            />
                        ) : suffix !== undefined ? (
                            <InputWithSuffix
                                suffix={suffix}
                                {...field}
                                {...props}
                                ref={ref}
                                className={className}
                            />
                        ) : (
                            <FormControl>
                                <Input
                                    {...field}
                                    {...props}
                                    ref={ref}
                                    className={className}
                                />
                            </FormControl>
                        )}
                        {description && (
                            <p className="text-muted-foreground text-detail">
                                {description}
                            </p>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    },
);
FormInput.displayName = "FormInput";
