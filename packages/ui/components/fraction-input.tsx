import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "../lib/utils";
import {
    fractionToTrimmedPercentString,
    parseFraction,
    percentToFractionOver,
    type Fraction,
} from "../lib/fraction";

type FractionInputMode = "fraction" | "percent";

interface FractionInputProps {
    "value": Fraction | null;
    "onChange": (value: Fraction | null) => void;
    /** Hint for the numerator; the denominator's hint is `defaultDenominator`. */
    "placeholder"?: string;
    "disabled"?: boolean;
    "aria-invalid"?: boolean;
    "className"?: string;
    /**
     * The house's common denominator, taken from the units that already
     * exist. It fills the denominator's placeholder, stands in for an empty
     * denominator on commit, and is what a typed percent is snapped to.
     *
     * Leave it out wherever the share is not a share of the house — an
     * owner's share of a single unit, a voting threshold — and the
     * denominator becomes required with no placeholder.
     */
    "defaultDenominator"?: number;
}

const sameFraction = (a: Fraction | null, b: Fraction | null): boolean =>
    a === b || (!!a && !!b && a.num === b.num && a.den === b.den);

/**
 * The one way to type a share anywhere in the app: a numerator and a
 * denominator either side of a slash, or the same value as a percent, chosen
 * with the pill on the trailing edge.
 *
 * Commits on blur or Enter rather than on every keystroke, so a half-typed
 * "3200" is never emitted as 3200/1 to a live sum. Text that cannot be read
 * as a share stays visible and is flagged via `aria-invalid`; the value
 * emitted for it is `null`.
 *
 * Percent behaves differently depending on how you got there, deliberately.
 * Switching modes is lossless — a value that arrived as 107/1250 is still
 * 107/1250 when you switch to percent and back, because the fraction the
 * percent text was derived from is remembered and re-emitted untouched.
 * Only a percent you actually type is converted, and then
 * `defaultDenominator` decides whether it is snapped to the house's
 * denominator or kept as the exact reduced fraction.
 */
export function FractionInput({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    defaultDenominator,
    "aria-invalid": ariaInvalid,
}: FractionInputProps) {
    const { t, i18n } = useTranslation();
    // The shared package carries no resource bundle of its own; the app
    // supplies the `common` namespace at runtime, so the key cannot be
    // checked against a typed bundle here (form.tsx casts the same way).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (key: string) => t(key as any) as string;

    const toPercentText = React.useCallback(
        (f: Fraction) => {
            const text = fractionToTrimmedPercentString(f, 2);
            return i18n.language === "cs" ? text.replace(".", ",") : text;
        },
        [i18n.language],
    );

    const [mode, setMode] = React.useState<FractionInputMode>("fraction");
    const [numText, setNumText] = React.useState(
        value ? String(value.num) : "",
    );
    const [denText, setDenText] = React.useState(
        value ? String(value.den) : "",
    );
    const [percentText, setPercentText] = React.useState(
        value ? toPercentText(value) : "",
    );
    const [invalid, setInvalid] = React.useState(false);

    // The value this input last emitted. When the parent echoes it back the
    // user's own text (an empty denominator standing in for the house's,
    // maybe something invalid) must survive; only a genuinely external change
    // (preset chip, form reset) replaces it.
    const lastEmitted = React.useRef<Fraction | null | undefined>(undefined);
    // The fraction `percentText` was derived from, so an untouched percent
    // commits as the value it came from rather than as a re-rounded one.
    const percentSource = React.useRef<Fraction | null>(value);

    const numRef = React.useRef<HTMLInputElement>(null);
    const denRef = React.useRef<HTMLInputElement>(null);
    const percentRef = React.useRef<HTMLInputElement>(null);
    // Set when the user switches modes, so focus follows into the field that
    // replaced the one they were in.
    const focusAfterSwitch = React.useRef(false);

    React.useEffect(() => {
        if (
            lastEmitted.current !== undefined &&
            sameFraction(lastEmitted.current, value)
        ) {
            return;
        }
        lastEmitted.current = undefined;
        setNumText(value ? String(value.num) : "");
        setDenText(value ? String(value.den) : "");
        setPercentText(value ? toPercentText(value) : "");
        percentSource.current = value;
        setInvalid(false);
    }, [value, toPercentText]);

    React.useEffect(() => {
        if (!focusAfterSwitch.current) return;
        focusAfterSwitch.current = false;
        const next = mode === "fraction" ? numRef.current : percentRef.current;
        next?.focus();
        next?.select();
    }, [mode]);

    const emit = (next: Fraction | null) => {
        lastEmitted.current = next;
        onChange(next);
    };

    /**
     * The percent text read as a fraction.
     *
     * A percent nobody has typed into still stands for the exact fraction it
     * was rendered from, so looking at a value as a percent and leaving
     * cannot silently re-round it. The first keystroke cuts that link and the
     * text alone counts from then on — otherwise the same visible "33.33"
     * would mean 1/3 or 3333/10000 depending on history the user cannot see.
     */
    const percentAsFraction = (): Fraction | null => {
        if (percentSource.current) return percentSource.current;
        const text = percentText.trim();
        if (text === "") return null;
        return percentToFractionOver(text, defaultDenominator);
    };

    /** The two fields read as a fraction, an empty denominator standing in. */
    const fieldsAsFraction = (): Fraction | null => {
        const num = numText.trim();
        const den =
            denText.trim() ||
            (defaultDenominator !== undefined
                ? String(defaultDenominator)
                : "");
        if (num === "" || den === "") return null;
        return parseFraction(`${num}/${den}`);
    };

    const commit = () => {
        if (mode === "percent") {
            const text = percentText.trim();
            if (text === "") {
                setInvalid(false);
                emit(null);
                return;
            }
            const parsed = percentAsFraction();
            setInvalid(parsed === null);
            emit(parsed);
            return;
        }
        if (numText.trim() === "" && denText.trim() === "") {
            setInvalid(false);
            emit(null);
            return;
        }
        const parsed = fieldsAsFraction();
        setInvalid(parsed === null);
        emit(parsed);
    };

    /**
     * Commits only when focus leaves the field as a whole. Moving from the
     * numerator to the denominator, or reaching for the mode pill, is the
     * middle of typing one value — committing there would emit a half-written
     * share and flag the field invalid while the user is still filling it in.
     */
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        commit();
    };

    const switchTo = (next: FractionInputMode) => {
        if (next === mode) return;
        if (next === "percent") {
            const current = fieldsAsFraction();
            setPercentText(current ? toPercentText(current) : "");
            percentSource.current = current;
        } else {
            const current = percentAsFraction();
            setNumText(current ? String(current.num) : "");
            setDenText(current ? String(current.den) : "");
        }
        setInvalid(false);
        focusAfterSwitch.current = true;
        setMode(next);
    };

    const fieldInvalid = ariaInvalid || invalid;
    const innerInput = cn(
        "min-w-0 flex-1 bg-transparent font-mono text-sm font-normal tabular-nums",
        "placeholder:text-faint placeholder:font-normal",
        "outline-none disabled:cursor-not-allowed",
    );
    const segment = (active: boolean) =>
        cn(
            "h-6 cursor-pointer rounded-sm px-1.5 font-mono text-2xs font-bold transition-colors",
            active
                ? "bg-card text-primary-hover shadow-sm"
                : "text-primary hover:text-primary-pressed",
            "disabled:cursor-not-allowed",
        );

    return (
        <div
            className={cn(
                // A share is a couple of short numbers and a pill, so the
                // field has a natural size. Stretching it across a dialog
                // would only open a gap between the numbers and the pill;
                // `className` can still widen it where that is wanted.
                "border-input bg-card ring-offset-background flex h-10 w-full min-w-[192px] items-center gap-1 rounded-[9px] border px-3 transition-colors",
                "focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none",
                fieldInvalid &&
                    "border-destructive focus-within:ring-destructive",
                disabled && "opacity-50",
                className,
            )}
            onBlur={handleBlur}
        >
            {mode === "fraction" ? (
                <>
                    <input
                        ref={numRef}
                        value={numText}
                        disabled={disabled}
                        placeholder={placeholder}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={label("common:fractionInput.numerator")}
                        aria-invalid={fieldInvalid || undefined}
                        className={cn(innerInput, "text-right")}
                        onChange={(e) => {
                            setNumText(e.target.value);
                            setInvalid(false);
                        }}
                        onKeyDown={(e) => {
                            // "/" is how anyone writing a share moves on to
                            // the denominator, so honour it as a jump rather
                            // than letting it land in the numerator.
                            if (e.key === "/") {
                                e.preventDefault();
                                denRef.current?.focus();
                                denRef.current?.select();
                                return;
                            }
                            if (e.key === "Enter") commit();
                        }}
                    />
                    {/* Same family and size as the numbers, so the glyphs sit
                        on a shared baseline rather than each being centred in
                        its own differently-sized line box. */}
                    <span
                        aria-hidden
                        className="text-faint shrink-0 font-mono text-sm"
                    >
                        /
                    </span>
                    <input
                        ref={denRef}
                        value={denText}
                        disabled={disabled}
                        placeholder={
                            defaultDenominator !== undefined
                                ? String(defaultDenominator)
                                : undefined
                        }
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={label("common:fractionInput.denominator")}
                        aria-invalid={fieldInvalid || undefined}
                        className={cn(innerInput, "text-left")}
                        onChange={(e) => {
                            setDenText(e.target.value);
                            setInvalid(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                        }}
                    />
                </>
            ) : (
                <>
                    <input
                        ref={percentRef}
                        value={percentText}
                        disabled={disabled}
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={label("common:fractionInput.percent")}
                        aria-invalid={fieldInvalid || undefined}
                        className={cn(innerInput, "text-right")}
                        onChange={(e) => {
                            setPercentText(e.target.value);
                            percentSource.current = null;
                            setInvalid(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                        }}
                    />
                    <span
                        aria-hidden
                        className="text-faint shrink-0 text-sm font-medium"
                    >
                        %
                    </span>
                </>
            )}
            <div className="bg-primary-tint-border ml-auto flex shrink-0 items-center gap-px rounded-md p-0.5">
                <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={mode === "fraction"}
                    className={segment(mode === "fraction")}
                    onClick={() => switchTo("fraction")}
                >
                    a/b
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={mode === "percent"}
                    className={segment(mode === "percent")}
                    onClick={() => switchTo("percent")}
                >
                    %
                </button>
            </div>
        </div>
    );
}
