import { useTranslation } from "react-i18next";

import { StatusChip, type StatusChipVariant } from "@hoa-mngr/ui";

const VOTE_STATUS_VARIANT: Record<string, StatusChipVariant> = {
    OPEN: "success",
    SCHEDULED: "primary",
    CLOSED: "neutral",
    DRAFT: "draft",
};

const VOTE_STATUS_LABEL_KEY: Record<
    string,
    | "list.status.OPEN"
    | "list.status.SCHEDULED"
    | "list.status.CLOSED"
    | "list.status.DRAFT"
> = {
    OPEN: "list.status.OPEN",
    SCHEDULED: "list.status.SCHEDULED",
    CLOSED: "list.status.CLOSED",
    DRAFT: "list.status.DRAFT",
};

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const { t } = useTranslation(["voting"]);
    const labelKey = VOTE_STATUS_LABEL_KEY[status];

    return (
        <StatusChip variant={VOTE_STATUS_VARIANT[status] ?? "neutral"}>
            {labelKey ? t(labelKey) : status}
        </StatusChip>
    );
}
