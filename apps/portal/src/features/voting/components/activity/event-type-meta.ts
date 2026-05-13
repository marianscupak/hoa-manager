import {
    BarChart3,
    CalendarClock,
    CheckSquare,
    Circle,
    FilePlus,
    Lock,
    PlayCircle,
    Settings,
    UserCheck,
    Users,
    type LucideIcon,
} from "lucide-react";

interface EventTypeMeta {
    icon: LucideIcon;
    dotColor: string;
}

const META: Record<string, EventTypeMeta> = {
    "VOTING.VOTE_CREATED": { icon: FilePlus, dotColor: "bg-slate-400" },
    "VOTING.VOTE_RULESET_SET": { icon: Settings, dotColor: "bg-slate-400" },
    "VOTING.VOTE_SCHEDULED": { icon: CalendarClock, dotColor: "bg-blue-500" },
    "VOTING.VOTE_OPENED": { icon: PlayCircle, dotColor: "bg-green-500" },
    "VOTING.VOTE_ELECTORATE_SNAPSHOTTED": {
        icon: Users,
        dotColor: "bg-slate-400",
    },
    "VOTING.BALLOT_CAST_DIRECT": { icon: CheckSquare, dotColor: "bg-blue-500" },
    "VOTING.BALLOT_CAST_PROXY": { icon: UserCheck, dotColor: "bg-blue-500" },
    "VOTING.VOTE_CLOSED": { icon: Lock, dotColor: "bg-amber-500" },
    "VOTING.VOTE_RESULTS_COMPUTED": {
        icon: BarChart3,
        dotColor: "bg-green-500",
    },
};

const FALLBACK: EventTypeMeta = { icon: Circle, dotColor: "bg-slate-300" };

export function getEventTypeMeta(eventType: string): EventTypeMeta {
    return META[eventType] ?? FALLBACK;
}
