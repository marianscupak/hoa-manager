import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { votesControllerGetAuditExport } from "@/api/generated/votes/votes";
import { Button } from "@hoa-mngr/ui";

interface AuditExportButtonProps {
    voteId: string;
}

function formatTimestamp(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function AuditExportButton({ voteId }: AuditExportButtonProps) {
    const { t } = useTranslation(["voting"]);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const report = await votesControllerGetAuditExport(voteId);
            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const filename = `vote-${voteId}-audit-${formatTimestamp(new Date())}.json`;

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            toast.error(t("voting:results.downloadAuditReportError"));
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
        >
            {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            {t("voting:results.downloadAuditReport")}
        </Button>
    );
}
