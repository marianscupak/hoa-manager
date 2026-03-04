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
    description?: string;
    placeholder?: string;
    options: FormSelectOption[];
    disabled?: boolean;
}

export const FormSelect = ({
    name,
    label,
    description,
    placeholder,
    options,
    disabled,
}: FormSelectProps) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    {label && <FormLabel>{label}</FormLabel>}
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                        <p className="text-muted-foreground text-[0.8rem]">
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
