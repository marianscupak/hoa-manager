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
    description?: string;
    suffix?: React.ReactNode;
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

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ name, label, description, suffix, className, ...props }, ref) => {
        const { control } = useFormContext();

        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        {label && <FormLabel>{label}</FormLabel>}
                        {suffix !== undefined ? (
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
