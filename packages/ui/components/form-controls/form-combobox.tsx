import { Check, ChevronDown, Plus } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form";
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cn } from "../../lib/utils";

export interface FormComboboxOption {
    label: string;
    value: string;
}

export interface FormComboboxProps {
    name: string;
    label?: string;
    description?: string;
    /** Shown on the trigger while nothing is selected. */
    placeholder?: string;
    searchPlaceholder?: string;
    /** Shown when the query matches no option and nothing can be created. */
    emptyMessage?: string;
    options: FormComboboxOption[];
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    /**
     * Label for an action at the foot of the list that creates what is being
     * searched for, e.g. ``(q) => `Create "${q}"` ``. Supply it together with
     * `onCreate`; omit both for a plain searchable select.
     */
    createLabel?: (query: string) => string;
    onCreate?: (query: string) => void;
}

/** Case- and diacritics-insensitive, so "scupak" finds "Ščupák". */
function fold(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

/**
 * A select you can type in, and — when `onCreate` is given — add to without
 * leaving the form.
 *
 * Takes the same props as `FormSelect` plus the search and create bits, so a
 * list that has outgrown a plain dropdown can be swapped over in place.
 *
 * The create action only reports the typed text; opening whatever collects the
 * rest is the host's job. That keeps the dialog it needs a sibling of this
 * field rather than a child of the popup, which is closed by then.
 */
export const FormCombobox = ({
    name,
    label,
    description,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    options,
    disabled,
    onValueChange,
    createLabel,
    onCreate,
}: FormComboboxProps) => {
    const { control } = useFormContext();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(0);
    const listId = React.useId();
    // Set when the create action closes the popup, so focus is left free for
    // the dialog the host is about to open instead of snapping to the trigger.
    const releaseFocusOnClose = React.useRef(false);

    const filtered = React.useMemo(() => {
        const needle = fold(query.trim());
        if (!needle) return options;
        return options.filter((o) => fold(o.label).includes(needle));
    }, [options, query]);

    // The create action is the last row, so the arrow keys reach it like any
    // other. Offered whenever something is typed, not only when nothing
    // matches — a new owner may well share a prefix with an existing one.
    const canCreate = !!onCreate && !!createLabel && query.trim().length > 0;
    const createIndex = canCreate ? filtered.length : -1;
    const rowCount = filtered.length + (canCreate ? 1 : 0);

    React.useEffect(() => {
        setActiveIndex(0);
    }, [query, open]);

    React.useEffect(() => {
        if (!open) return;
        document
            .getElementById(`${listId}-row-${activeIndex}`)
            // Optional call: jsdom has no `scrollIntoView`, so tests that
            // drive the list with the arrow keys would throw here.
            ?.scrollIntoView?.({ block: "nearest" });
    }, [activeIndex, open, listId]);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const selected = options.find((o) => o.value === field.value);

                const close = () => {
                    setOpen(false);
                    setQuery("");
                };

                const choose = (value: string) => {
                    field.onChange(value);
                    onValueChange?.(value);
                    close();
                };

                const create = () => {
                    const typed = query.trim();
                    releaseFocusOnClose.current = true;
                    close();
                    onCreate?.(typed);
                };

                const commitRow = (index: number) => {
                    if (index === createIndex) return create();
                    const option = filtered[index];
                    if (option) choose(option.value);
                };

                const moveActive = (delta: number) => {
                    if (rowCount === 0) return;
                    setActiveIndex((i) => (i + delta + rowCount) % rowCount);
                };

                return (
                    <FormItem>
                        {label && <FormLabel>{label}</FormLabel>}
                        <Popover
                            open={open}
                            onOpenChange={(next) => {
                                setOpen(next);
                                if (!next) setQuery("");
                            }}
                        >
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <button
                                        type="button"
                                        aria-haspopup="listbox"
                                        aria-expanded={open}
                                        disabled={disabled}
                                        className={cn(
                                            "border-input bg-card ring-offset-background focus-visible:ring-ring flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[9px] border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                                            !selected &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        <span className="line-clamp-1 text-left">
                                            {selected?.label ?? placeholder}
                                        </span>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                </FormControl>
                            </PopoverTrigger>

                            <PopoverContent
                                align="start"
                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                onCloseAutoFocus={(event) => {
                                    if (!releaseFocusOnClose.current) return;
                                    releaseFocusOnClose.current = false;
                                    event.preventDefault();
                                }}
                            >
                                <div className="border-border border-b p-2">
                                    <Input
                                        role="combobox"
                                        aria-expanded
                                        aria-controls={listId}
                                        aria-activedescendant={
                                            rowCount > 0
                                                ? `${listId}-row-${activeIndex}`
                                                : undefined
                                        }
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        placeholder={searchPlaceholder}
                                        className="h-9 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        onKeyDown={(event) => {
                                            if (event.key === "ArrowDown") {
                                                event.preventDefault();
                                                moveActive(1);
                                            } else if (
                                                event.key === "ArrowUp"
                                            ) {
                                                event.preventDefault();
                                                moveActive(-1);
                                            } else if (event.key === "Enter") {
                                                event.preventDefault();
                                                commitRow(activeIndex);
                                            }
                                        }}
                                    />
                                </div>

                                <ul
                                    id={listId}
                                    role="listbox"
                                    className="max-h-60 overflow-y-auto p-1"
                                >
                                    {filtered.map((option, index) => (
                                        <li
                                            key={option.value}
                                            id={`${listId}-row-${index}`}
                                            role="option"
                                            aria-selected={
                                                option.value === field.value
                                            }
                                            onClick={() => choose(option.value)}
                                            onMouseEnter={() =>
                                                setActiveIndex(index)
                                            }
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                                                index === activeIndex &&
                                                    "bg-accent text-accent-foreground",
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    option.value === field.value
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                        </li>
                                    ))}

                                    {rowCount === 0 && (
                                        <li className="text-muted-foreground px-2 py-3 text-center text-sm">
                                            {emptyMessage}
                                        </li>
                                    )}

                                    {canCreate && (
                                        <li
                                            id={`${listId}-row-${createIndex}`}
                                            role="option"
                                            aria-selected={false}
                                            onClick={create}
                                            onMouseEnter={() =>
                                                setActiveIndex(createIndex)
                                            }
                                            className={cn(
                                                "text-primary border-border mt-1 flex cursor-pointer items-center gap-2 rounded-sm border-t px-2 py-2 text-sm font-medium",
                                                activeIndex === createIndex &&
                                                    "bg-accent",
                                            )}
                                        >
                                            <Plus className="h-4 w-4 shrink-0" />
                                            <span className="truncate">
                                                {createLabel(query.trim())}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </PopoverContent>
                        </Popover>
                        {description && (
                            <p className="text-muted-foreground text-detail">
                                {description}
                            </p>
                        )}
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
};

FormCombobox.displayName = "FormCombobox";
