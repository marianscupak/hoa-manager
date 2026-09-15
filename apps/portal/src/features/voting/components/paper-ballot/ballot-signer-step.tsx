import { Check, FileText, Info, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Card, StatusChip } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { VoteParticipationUnitDto } from "@/api/generated/model";

import { formatFileSize } from "../../utils/format-file-size";
import {
    BALLOT_SCAN_ACCEPT,
    BALLOT_SCAN_MAX_SIZE_BYTES,
    type BallotAttachment,
} from "../../hooks/use-ballot-attachment";

export interface BallotSignerStepProps {
    unit: VoteParticipationUnitDto;
    attachment: BallotAttachment | null;
    isUploading: boolean;
    progress: number;
    onUpload: (file: File) => void;
    onRemove: () => void;
    signerOwnerId: string | null;
    onSignerChange: (ownerId: string) => void;
}

export function BallotSignerStep({
    unit,
    attachment,
    isUploading,
    progress,
    onUpload,
    onRemove,
    signerOwnerId,
    onSignerChange,
}: BallotSignerStepProps) {
    const { t } = useTranslation("voting");
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const accept = (file: File | undefined) => {
        if (!file) return;
        if (!BALLOT_SCAN_ACCEPT.split(",").includes(file.type)) {
            setLocalError(t("paperBallot.ballot.wrongType"));
            return;
        }
        if (file.size > BALLOT_SCAN_MAX_SIZE_BYTES) {
            setLocalError(t("paperBallot.ballot.tooLarge"));
            return;
        }
        setLocalError(null);
        onUpload(file);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
                    {t("paperBallot.ballot.title", { unit: unit.unitNo })}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t("paperBallot.ballot.subtitle", {
                        owners: unit.ownerNames.join(", "),
                        share: unit.share,
                    })}
                </p>
            </div>

            <div>
                <p className="mb-2 text-sm font-semibold">
                    {t("paperBallot.ballot.uploadLabel")}
                </p>

                {attachment ? (
                    <Card className="flex items-center gap-3 p-4">
                        <FileText className="text-destructive h-5 w-5 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {attachment.fileName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {formatFileSize(attachment.sizeBytes)}
                            </p>
                        </div>
                        <StatusChip variant="success">
                            <Check className="mr-1 h-3 w-3" />
                            {t("paperBallot.ballot.attached")}
                        </StatusChip>
                        <Button variant="outline" size="sm" onClick={onRemove}>
                            <X />
                            {t("paperBallot.ballot.remove")}
                        </Button>
                    </Card>
                ) : (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            accept(e.dataTransfer.files[0]);
                        }}
                        className={cn(
                            "rounded-card flex flex-col items-center gap-2 border-2 border-dashed px-5 py-8 text-center transition-colors",
                            isDragging
                                ? "border-primary bg-primary-tint/40"
                                : "border-border bg-card",
                        )}
                    >
                        <div className="bg-primary-tint flex h-10 w-10 items-center justify-center rounded-full">
                            <Upload className="text-primary-tint-foreground h-4 w-4" />
                        </div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isUploading}
                            className="text-primary-tint-foreground cursor-pointer text-sm font-medium hover:underline"
                        >
                            {isUploading
                                ? `${t("paperBallot.ballot.uploading")} ${progress}%`
                                : t("paperBallot.ballot.dropzone")}
                        </button>
                        <p className="text-muted-foreground text-xs">
                            {t("paperBallot.ballot.dropzoneHint")}
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept={BALLOT_SCAN_ACCEPT}
                            className="hidden"
                            onChange={(e) => accept(e.target.files?.[0])}
                        />
                    </div>
                )}

                {localError && (
                    <p className="text-destructive mt-2 text-sm">
                        {localError}
                    </p>
                )}
            </div>

            <div>
                <p className="mb-2 text-sm font-semibold">
                    {t("paperBallot.ballot.signerLabel")}
                </p>
                {unit.owners.length === 0 && (
                    <Card className="bg-muted/50 flex items-start gap-3 p-4">
                        <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-secondary-foreground text-sm">
                            {t("paperBallot.ballot.noOwners")}
                        </p>
                    </Card>
                )}
                <div className="space-y-2">
                    {unit.owners.map((owner) => {
                        const selected = owner.ownerId === signerOwnerId;
                        return (
                            <button
                                key={owner.ownerId}
                                type="button"
                                onClick={() => onSignerChange(owner.ownerId)}
                                aria-pressed={selected}
                                className={cn(
                                    "rounded-panel flex w-full cursor-pointer items-center gap-3 border-2 p-3 text-left transition-colors",
                                    selected
                                        ? "border-primary bg-primary-tint/40"
                                        : "border-border bg-card hover:bg-muted/50",
                                )}
                            >
                                <span className="bg-primary-tint text-primary-tint-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                    {owner.displayName
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">
                                        {owner.displayName}
                                    </span>
                                    <span className="text-muted-foreground block text-xs">
                                        {t("paperBallot.ballot.ownerRole", {
                                            share: owner.share,
                                        })}
                                    </span>
                                </span>
                                {owner.isRepresentative && (
                                    <StatusChip variant="primary" dot={false}>
                                        {t("paperBallot.ballot.representative")}
                                    </StatusChip>
                                )}
                                <span
                                    className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                        selected
                                            ? "border-primary bg-primary"
                                            : "border-border",
                                    )}
                                >
                                    {selected && (
                                        <Check
                                            className="text-primary-foreground h-3 w-3"
                                            strokeWidth={3}
                                        />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {unit.owners.length > 1 && (
                    <p className="text-muted-foreground mt-2 text-xs">
                        {t("paperBallot.ballot.coOwnedHint")}
                    </p>
                )}
            </div>

            <Card className="bg-muted/50 flex items-start gap-3 p-4">
                <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-secondary-foreground text-xs">
                    {t("paperBallot.ballot.auditNote")}
                </p>
            </Card>
        </div>
    );
}
