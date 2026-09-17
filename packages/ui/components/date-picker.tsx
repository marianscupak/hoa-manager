import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type TriggerProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "value" | "onChange" | "type"
>;

/**
 * Anything else lands on the trigger button. `FormDatePicker` relies on that:
 * `FormControl` hands down the id the label points at, plus aria-describedby
 * and aria-invalid.
 */
export interface DatePickerProps extends TriggerProps {
    /** The selected day at local midnight, or `null` for none. */
    value: Date | null;
    onChange: (value: Date | null) => void;
    placeholder?: string;
    /** Earliest selectable day, inclusive (compared by calendar day). */
    min?: Date;
    /** Latest selectable day, inclusive (compared by calendar day). */
    max?: Date;
}

/**
 * Date-only picker with no form attached: the day is held by whoever renders
 * it. `FormDatePicker` wraps this for react-hook-form, so both look and behave
 * the same wherever a date is chosen.
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
    (
        {
            value,
            onChange,
            placeholder,
            min,
            max,
            disabled,
            className,
            ...rest
        },
        ref,
    ) => {
        const [open, setOpen] = React.useState(false);

        const selected =
            value instanceof Date && !isNaN(value.getTime())
                ? value
                : undefined;

        const blocked = [
            ...(min ? [{ before: startOfDay(min) }] : []),
            ...(max ? [{ after: startOfDay(max) }] : []),
        ];

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        {...rest}
                        className={cn(
                            // `Button` is pill-shaped; a field trigger has to carry
                            // the same 9px corner as `Input`, `FormCombobox`
                            // and `FractionInput` or it reads as a button.
                            "w-full cursor-pointer rounded-[9px] pl-3 text-left font-normal",
                            !selected && "text-muted-foreground",
                            className,
                        )}
                    >
                        {selected ? (
                            format(selected, "d. M. yyyy")
                        ) : (
                            <span>{placeholder ?? " "}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-xl p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected}
                        disabled={blocked}
                        onSelect={(day) => {
                            onChange(day ? startOfDay(day) : null);
                            if (day) setOpen(false);
                        }}
                        initialFocus
                        className="pointer-events-auto p-3"
                    />
                </PopoverContent>
            </Popover>
        );
    },
);
DatePicker.displayName = "DatePicker";
