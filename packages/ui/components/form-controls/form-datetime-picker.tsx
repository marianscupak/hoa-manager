import { format } from "date-fns";
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
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export interface FormDatetimePickerProps {
    name: string;
    label?: string;
    description?: string;
    placeholder?: string;
    className?: string;
}

export const FormDatetimePicker = React.forwardRef<
    HTMLDivElement,
    FormDatetimePickerProps
>(({ name, label, description, placeholder, className }, ref) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const dateValue = field.value
                    ? new Date(field.value)
                    : undefined;

                const [timeStr, setTimeStr] = React.useState(
                    dateValue ? format(dateValue, "HH:mm") : "",
                );

                React.useEffect(() => {
                    if (dateValue && !isNaN(dateValue.getTime())) {
                        setTimeStr(format(dateValue, "HH:mm"));
                    } else {
                        setTimeStr("");
                    }
                }, [field.value]);

                const handleDateSelect = (selectedDate: Date | undefined) => {
                    if (!selectedDate) {
                        field.onChange("");
                        return;
                    }

                    // Preserve existing time if available
                    if (dateValue) {
                        selectedDate.setHours(dateValue.getHours());
                        selectedDate.setMinutes(dateValue.getMinutes());
                    } else {
                        // Default to 12:00 if no time was previously set
                        selectedDate.setHours(12);
                        selectedDate.setMinutes(0);
                    }

                    field.onChange(selectedDate.toISOString());
                };

                const handleTimeChange = (
                    e: React.ChangeEvent<HTMLInputElement>,
                ) => {
                    const newTime = e.target.value;
                    setTimeStr(newTime);

                    if (!dateValue || !newTime) return;

                    const [hours, minutes] = newTime.split(":").map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        const newDate = new Date(dateValue.getTime());
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        field.onChange(newDate.toISOString());
                    }
                };

                return (
                    <FormItem
                        className={cn("flex flex-col", className)}
                        ref={ref}
                    >
                        {label && <FormLabel>{label}</FormLabel>}
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        {field.value &&
                                        dateValue &&
                                        !isNaN(dateValue.getTime()) ? (
                                            format(
                                                dateValue,
                                                "dd. MM. yyyy HH:mm",
                                            )
                                        ) : (
                                            <span>{placeholder}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={dateValue}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                                <div className="border-border border-t p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <FormLabel className="text-muted-foreground text-sm whitespace-nowrap">
                                            Time
                                        </FormLabel>
                                        <Input
                                            type="time"
                                            value={timeStr}
                                            onChange={handleTimeChange}
                                            disabled={!dateValue}
                                            className="w-[120px]"
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {description && (
                            <p className="text-muted-foreground text-[0.8rem]">
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
FormDatetimePicker.displayName = "FormDatetimePicker";
