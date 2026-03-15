import { useFormContext } from "react-hook-form";

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";
import { Textarea, TextareaProps } from "../textarea";

interface FormTextareaProps extends TextareaProps {
    name: string;
    label?: string;
    description?: string;
}

export function FormTextarea({
    name,
    label,
    description,
    ...props
}: FormTextareaProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    {label && <FormLabel>{label}</FormLabel>}
                    <FormControl>
                        <Textarea {...field} {...props} />
                    </FormControl>
                    {description && (
                        <FormDescription>{description}</FormDescription>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
