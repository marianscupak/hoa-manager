import { ActivityTimelineItem } from "./activity-timeline-item";

export interface ActivityTimelineEntry {
    id: string;
    occurredAt: string;
    eventType: string;
    message: string;
    navigateTo?: string | null;
    details?: Record<string, unknown>;
}

interface ActivityTimelineProps {
    entries: ActivityTimelineEntry[];
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
    return (
        <ol className="relative">
            {entries.map((entry, i) => (
                <ActivityTimelineItem
                    key={entry.id}
                    entry={entry}
                    isLast={i === entries.length - 1}
                />
            ))}
        </ol>
    );
}
