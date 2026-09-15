import { Upload } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

export interface FileRejection {
    file: File;
    reason: "type" | "size";
}

export interface FileDropzoneProps {
    /** Allowed content types, e.g. `["application/pdf", "image/png"]`. */
    accept: readonly string[];
    maxSizeBytes: number;
    /** Default false — only the first file of a selection is taken. */
    multiple?: boolean;
    disabled?: boolean;
    /** Files that passed both checks. Not called when none survive. */
    onFiles: (files: File[]) => void;
    /** Once per rejected file, so the caller chooses inline text or a toast. */
    onReject: (rejection: FileRejection) => void;
    /** Main line — the whole line acts as the browse trigger. */
    label: React.ReactNode;
    /** Second line, e.g. "PDF, JPG or PNG · max 20 MB". */
    hint: string;
}

/**
 * Drop target plus browse trigger, with per-file type and size validation.
 * It owns no upload state: callers keep their own queue and error surface.
 */
export function FileDropzone({
    accept,
    maxSizeBytes,
    multiple = false,
    disabled = false,
    onFiles,
    onReject,
    label,
    hint,
}: FileDropzoneProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFiles = (list: FileList | File[] | null) => {
        if (disabled || !list) return;
        // Narrow before validating, so a single-file dropzone never reports a
        // rejection for a file it was never going to take.
        const candidates = Array.from(list).slice(0, multiple ? undefined : 1);

        const accepted: File[] = [];
        for (const file of candidates) {
            if (!accept.includes(file.type)) {
                onReject({ file, reason: "type" });
            } else if (file.size > maxSizeBytes) {
                onReject({ file, reason: "size" });
            } else {
                accepted.push(file);
            }
        }
        if (accepted.length > 0) onFiles(accepted);
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer?.files ?? null);
            }}
            className={cn(
                "rounded-card flex flex-col items-center gap-2 border-2 border-dashed px-5 py-8 text-center transition-colors",
                isDragging
                    ? "border-primary bg-primary-tint/40"
                    : "border-border bg-card",
                disabled && "opacity-60",
            )}
        >
            <div className="bg-primary-tint flex h-10 w-10 items-center justify-center rounded-full">
                <Upload className="text-primary-tint-foreground h-4 w-4" />
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "text-primary-tint-foreground text-sm font-medium",
                    disabled
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:underline",
                )}
            >
                {label}
            </button>
            <p className="text-muted-foreground text-xs">{hint}</p>
            <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept.join(",")}
                className="hidden"
                onChange={(e) => {
                    handleFiles(e.target.files);
                    // Let the same file be picked again after a removal.
                    e.target.value = "";
                }}
            />
        </div>
    );
}
