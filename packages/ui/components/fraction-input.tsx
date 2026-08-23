import * as React from "react";

import { cn } from "../lib/utils";
import { Input } from "./input";
import { formatFraction, parseFraction, type Fraction } from "../lib/fraction";

interface FractionInputProps {
    "value": Fraction | null;
    "onChange": (value: Fraction | null) => void;
    "placeholder"?: string;
    "disabled"?: boolean;
    "aria-invalid"?: boolean;
    "className"?: string;
}

export function FractionInput({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    ...rest
}: FractionInputProps) {
    const [text, setText] = React.useState(value ? formatFraction(value) : "");
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
        if (!focused) setText(value ? formatFraction(value) : "");
    }, [value, focused]);

    return (
        <Input
            {...rest}
            value={text}
            disabled={disabled}
            placeholder={placeholder ?? "1/2"}
            inputMode="text"
            className={cn("font-mono", className)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
                setText(e.target.value);
                onChange(parseFraction(e.target.value));
            }}
        />
    );
}
