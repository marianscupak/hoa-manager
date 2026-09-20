import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, XIcon } from "lucide-react";
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
    /** Shows a clear button once a day is chosen. A field the form calls
     *  optional needs one: without it the only way back to "no date" is to
     *  close the dialog and start again. */
    clearable?: boolean;
    /** Accessible name for that button. */
    clearLabel?: string;
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
            clearable = false,
            clearLabel,
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

        const showClear = clearable && selected !== undefined && !disabled;

        return (
            <Popover open={open} onOpenChange={setOpen}>
                {/* The clear button is a sibling of the trigger, not a child
                    of it: the trigger is itself a <button>, and a button
                    inside a button is invalid and unreachable by keyboard. */}
                <div className="relative w-full">
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
                                showClear && "pr-10",
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
                    {showClear && (
                        <button
                            type="button"
                            aria-label={clearLabel ?? "Clear date"}
                            onClick={() => onChange(null)}
                            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <XIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
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
