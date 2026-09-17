import { useFormContext } from "react-hook-form";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select";

export interface FormSelectOption {
    label: string;
    value: string;
}

export interface FormSelectProps {
    name: string;
    label?: string;
    /** Renders a muted "optional" marker next to the label. */
    optional?: boolean;
    description?: string;
    placeholder?: string;
    options: FormSelectOption[];
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}

export const FormSelect = ({
    name,
    label,
    optional,
    description,
    placeholder,
    options,
    disabled,
    onValueChange,
}: FormSelectProps) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    {label && (
                        <FormLabel optional={optional}>{label}</FormLabel>
                    )}
                    <Select
                        onValueChange={(value) => {
                            field.onChange(value);
                            onValueChange?.(value);
                        }}
                        value={field.value}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
};

FormSelect.displayName = "FormSelect";
