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
    /** Renders a muted "optional" marker next to the label. */
    optional?: boolean;
    description?: string;
}

export function FormTextarea({
    name,
    label,
    optional,
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
                    {label && (
                        <FormLabel optional={optional}>{label}</FormLabel>
                    )}
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
