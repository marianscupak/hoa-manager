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

const sameFraction = (a: Fraction | null, b: Fraction | null): boolean =>
    a === b || (!!a && !!b && a.num === b.num && a.den === b.den);

/**
 * The one way to type a share anywhere in the app. Accepts `3200/10000`,
 * `0,5` or `75 %` (see `parseFraction`) and commits on blur or Enter rather
 * than on every keystroke, so a half-typed "3200" is never emitted as 3200/1
 * to a live sum. Invalid text stays visible and is flagged via
 * `aria-invalid`; the value emitted for it is `null`.
 */
export function FractionInput({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    "aria-invalid": ariaInvalid,
}: FractionInputProps) {
    const [text, setText] = React.useState(value ? formatFraction(value) : "");
    const [invalid, setInvalid] = React.useState(false);
    // The value this input last emitted. When the parent echoes it back the
    // user's own text (maybe "75 %", maybe something invalid) must survive;
    // only a genuinely external change (preset chip, form reset) replaces it.
    const lastEmitted = React.useRef<Fraction | null | undefined>(undefined);

    React.useEffect(() => {
        if (
            lastEmitted.current !== undefined &&
            sameFraction(lastEmitted.current, value)
        ) {
            return;
        }
        lastEmitted.current = undefined;
        setText(value ? formatFraction(value) : "");
        setInvalid(false);
    }, [value]);

    const commit = () => {
        const trimmed = text.trim();
        const parsed = trimmed === "" ? null : parseFraction(trimmed);
        setInvalid(trimmed !== "" && parsed === null);
        lastEmitted.current = parsed;
        onChange(parsed);
    };

    return (
        <Input
            value={text}
            disabled={disabled}
            placeholder={placeholder ?? "1/2"}
            inputMode="text"
            aria-invalid={ariaInvalid || invalid || undefined}
            className={cn("font-mono", className)}
            onChange={(e) => {
                setText(e.target.value);
                setInvalid(false);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
            }}
        />
    );
}
