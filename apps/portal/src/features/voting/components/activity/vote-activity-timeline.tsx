import { type TimelineEntryDto } from "@/api/generated/model";

import { VoteActivityTimelineItem } from "./vote-activity-timeline-item";

interface VoteActivityTimelineProps {
    entries: TimelineEntryDto[];
}

export function VoteActivityTimeline({ entries }: VoteActivityTimelineProps) {
    return (
        <ol className="relative">
            {entries.map((entry, i) => (
                <VoteActivityTimelineItem
                    key={entry.id}
                    entry={entry}
                    isLast={i === entries.length - 1}
                />
            ))}
        </ol>
    );
}
