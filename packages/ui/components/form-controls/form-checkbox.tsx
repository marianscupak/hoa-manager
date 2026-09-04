import * as React from "react";
import { useFormContext } from "react-hook-form";

import { Checkbox } from "../checkbox";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "../form";

export interface FormCheckboxProps
    extends React.ComponentPropsWithoutRef<typeof Checkbox> {
    name: string;
    label: string;
    description?: string;
}

export const FormCheckbox = React.forwardRef<
    React.ElementRef<typeof Checkbox>,
    FormCheckboxProps
>(({ name, label, description, ...props }, ref) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="rounded-panel bg-card flex flex-row items-start space-y-0 space-x-3 border p-4 shadow-sm">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            ref={ref}
                            {...props}
                        />
                    </FormControl>
                    <div className="space-y-1">
                        <FormLabel>{label}</FormLabel>
                        {description && (
                            <FormDescription>{description}</FormDescription>
                        )}
                    </div>
                </FormItem>
            )}
        />
    );
});
FormCheckbox.displayName = "FormCheckbox";
