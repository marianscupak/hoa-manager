import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";
import { Input, type InputProps } from "../input";

export interface FormInputProps extends InputProps {
    name: string;
    label?: string;
    description?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ name, label, description, ...props }, ref) => {
        const { control } = useFormContext();

        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        {label && <FormLabel>{label}</FormLabel>}
                        <FormControl>
                            <Input {...field} {...props} ref={ref} />
                        </FormControl>
                        {description && (
                            <p className="text-[0.8rem] text-slate-500">
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
FormInput.displayName = "FormInput";
