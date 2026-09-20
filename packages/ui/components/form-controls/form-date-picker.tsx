import * as React from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "../../lib/utils";
import { DatePicker } from "../date-picker";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";

export interface FormDatePickerProps {
    name: string;
    label?: string;
    /** Renders a muted "optional" marker next to the label — and, because
     *  the two must not drift apart, puts a clear button on the control so
     *  the field can actually be emptied again. */
    optional?: boolean;
    /** Accessible name for that clear button. */
    clearLabel?: string;
    description?: string;
    placeholder?: string;
    /** Earliest selectable day, inclusive (compared by calendar day). */
    min?: Date;
    /** Latest selectable day, inclusive (compared by calendar day). */
    max?: Date;
    disabled?: boolean;
    className?: string;
}

/**
 * Date-only picker for react-hook-form. The field value is a `Date` at local
 * midnight (or `null`). The control itself is `DatePicker`, so a date chosen
 * inside a form and one chosen outside look and behave the same.
 */
export const FormDatePicker = React.forwardRef<
    HTMLDivElement,
    FormDatePickerProps
>(
    (
        {
            name,
            label,
            optional,
            clearLabel,
            description,
            placeholder,
            min,
            max,
            disabled,
            className,
        },
        ref,
    ) => {
        const { control } = useFormContext();

        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem
                        className={cn("flex flex-col", className)}
                        ref={ref}
                    >
                        {label && (
                            <FormLabel optional={optional}>{label}</FormLabel>
                        )}
                        <FormControl>
                            <DatePicker
                                value={field.value ?? null}
                                onChange={field.onChange}
                                placeholder={placeholder}
                                min={min}
                                max={max}
                                clearable={optional}
                                clearLabel={clearLabel}
                                disabled={disabled}
                            />
                        </FormControl>
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
FormDatePicker.displayName = "FormDatePicker";
