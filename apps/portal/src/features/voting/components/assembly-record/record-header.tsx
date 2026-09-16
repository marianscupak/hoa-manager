import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, StatusChip } from "@hoa-mngr/ui";

interface RecordHeaderProps {
    voteId: string;
    title: string;
    meetingDate: string | null;
    published: boolean;
}

/**
 * The focus-mode bar both assembly screens sit under.
 *
 * Its whole job is to keep the two facts the board needs in view: which
 * meeting is being written up, and that owners cannot see any of it yet. Once
 * the record is published that second fact reverses, which is the one thing
 * worth saying loudly on the way out.
 */
export function RecordHeader({
    voteId,
    title,
    meetingDate,
    published,
}: RecordHeaderProps) {
    const { t } = useTranslation(["voting"]);

    const subtitle = meetingDate
        ? t(
              published
                  ? "voting:assemblyRecord.header.heldOnPublished"
                  : "voting:assemblyRecord.header.heldOn",
              { date: new Date(meetingDate).toLocaleString() },
          )
        : t("voting:assemblyRecord.header.noDate");

    return (
        <header className="bg-card sticky top-0 z-10 border-b">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3">
                <Button variant="outline" size="sm" asChild>
                    <Link to={published ? "/voting" : `/voting/${voteId}`}>
                        {t(
                            published
                                ? "voting:assemblyRecord.header.exitPublished"
                                : "voting:assemblyRecord.header.exit",
                        )}
                    </Link>
                </Button>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {t("voting:assemblyRecord.header.title", { title })}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        {subtitle}
                    </p>
                </div>
                <StatusChip variant={published ? "neutral" : "primary"}>
                    {t(
                        published
                            ? "voting:assemblyRecord.header.closed"
                            : "voting:assemblyRecord.header.recording",
                    )}
                </StatusChip>
                <StatusChip variant={published ? "success" : "neutral"}>
                    {published ? (
                        <Eye className="mr-1 h-3 w-3" />
                    ) : (
                        <EyeOff className="mr-1 h-3 w-3" />
                    )}
                    {t(
                        published
                            ? "voting:assemblyRecord.header.visible"
                            : "voting:assemblyRecord.header.hidden",
                    )}
                </StatusChip>
            </div>
        </header>
    );
}
