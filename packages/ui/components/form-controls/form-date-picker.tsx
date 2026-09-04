import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export interface FormDatePickerProps {
    name: string;
    label?: string;
    description?: string;
    placeholder?: string;
    /** Earliest selectable day, inclusive (compared by calendar day). */
    min?: Date;
    /** Latest selectable day, inclusive (compared by calendar day). */
    max?: Date;
    className?: string;
}

/**
 * Date-only picker for react-hook-form. The field value is a `Date` at local
 * midnight (or `null`); the trigger shows it as `d. M. yyyy`. Sibling of
 * `FormDatetimePicker` without the time input.
 */
export const FormDatePicker = React.forwardRef<
    HTMLDivElement,
    FormDatePickerProps
>(({ name, label, description, placeholder, min, max, className }, ref) => {
    const { control } = useFormContext();
    const [open, setOpen] = React.useState(false);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const value: Date | undefined =
                    field.value instanceof Date && !isNaN(field.value.getTime())
                        ? field.value
                        : undefined;
                const disabled = [
                    ...(min ? [{ before: startOfDay(min) }] : []),
                    ...(max ? [{ after: startOfDay(max) }] : []),
                ];

                return (
                    <FormItem className={cn("flex flex-col", className)} ref={ref}>
                        {label && <FormLabel>{label}</FormLabel>}
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full cursor-pointer pl-3 text-left font-normal",
                                            !value && "text-muted-foreground",
                                        )}
                                    >
                                        {value ? (
                                            format(value, "d. M. yyyy")
                                        ) : (
                                            <span>{placeholder ?? " "}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto rounded-xl p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={value}
                                    defaultMonth={value}
                                    disabled={disabled}
                                    onSelect={(day) => {
                                        field.onChange(day ? startOfDay(day) : null);
                                        if (day) setOpen(false);
                                    }}
                                    initialFocus
                                    className="pointer-events-auto p-3"
                                />
                            </PopoverContent>
                        </Popover>
                        {description && (
                            <p className="text-muted-foreground text-detail">
                                {description}
                            </p>
                        )}
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
});
FormDatePicker.displayName = "FormDatePicker";
