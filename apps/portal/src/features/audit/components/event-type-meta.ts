import {
    BarChart3,
    Building2,
    CalendarClock,
    CheckSquare,
    Circle,
    FilePlus,
    HelpCircle,
    Home,
    Link2,
    Lock,
    MailPlus,
    MailX,
    PencilLine,
    PlayCircle,
    Repeat,
    Settings,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserCog,
    UserMinus,
    UserPlus,
    Users,
    type LucideIcon,
} from "lucide-react";

interface EventTypeMeta {
    icon: LucideIcon;
    dotColor: string;
}

const META: Record<string, EventTypeMeta> = {
    "VOTING.VOTE_CREATED": { icon: FilePlus, dotColor: "bg-slate-400" },
    "VOTING.VOTE_UPDATED": { icon: PencilLine, dotColor: "bg-slate-400" },
    "VOTING.VOTE_RULESET_SET": { icon: Settings, dotColor: "bg-slate-400" },
    "VOTING.VOTE_SCHEDULED": { icon: CalendarClock, dotColor: "bg-blue-500" },
    "VOTING.VOTE_OPENED": { icon: PlayCircle, dotColor: "bg-green-500" },
    "VOTING.VOTE_ELECTORATE_SNAPSHOTTED": {
        icon: Users,
        dotColor: "bg-slate-400",
    },
    "VOTING.VOTE_QUESTION_CREATED": {
        icon: HelpCircle,
        dotColor: "bg-slate-400",
    },
    "VOTING.VOTE_QUESTION_UPDATED": {
        icon: PencilLine,
        dotColor: "bg-slate-400",
    },
    "VOTING.VOTE_QUESTION_DELETED": {
        icon: Trash2,
        dotColor: "bg-rose-400",
    },
    "VOTING.VOTE_CONSENT_CREATED": {
        icon: UserPlus,
        dotColor: "bg-blue-500",
    },
    "VOTING.VOTE_CONSENT_REVOKED": {
        icon: UserMinus,
        dotColor: "bg-rose-400",
    },
    "VOTING.BALLOT_CAST_DIRECT": { icon: CheckSquare, dotColor: "bg-blue-500" },
    "VOTING.BALLOT_CAST_PROXY": { icon: UserCheck, dotColor: "bg-blue-500" },
    "VOTING.VOTE_CLOSED": { icon: Lock, dotColor: "bg-amber-500" },
    "VOTING.VOTE_RESULTS_COMPUTED": {
        icon: BarChart3,
        dotColor: "bg-green-500",
    },
    "CORE.TENANT_CREATED": { icon: Building2, dotColor: "bg-green-500" },
    "CORE.MEMBERSHIP_CREATED": { icon: UserPlus, dotColor: "bg-blue-500" },
    "CORE.MEMBERSHIP_ROLE_UPDATED": {
        icon: ShieldCheck,
        dotColor: "bg-slate-400",
    },
    "CORE.MEMBERSHIP_STATUS_UPDATED": {
        icon: UserCog,
        dotColor: "bg-amber-500",
    },
    "CORE.UNIT_CREATED": { icon: Home, dotColor: "bg-blue-500" },
    "CORE.UNIT_UPDATED": { icon: PencilLine, dotColor: "bg-slate-400" },
    "CORE.UNIT_DELETED": { icon: Trash2, dotColor: "bg-rose-400" },
    "CORE.OWNER_CREATED": { icon: UserPlus, dotColor: "bg-blue-500" },
    "CORE.OWNER_DELETED": { icon: UserMinus, dotColor: "bg-rose-400" },
    "CORE.UNIT_OWNERSHIP_REPLACED": {
        icon: Repeat,
        dotColor: "bg-slate-400",
    },
    "CORE.OWNER_USER_LINKED": { icon: Link2, dotColor: "bg-slate-400" },
    "CORE.OWNER_INVITE_SENT": { icon: MailPlus, dotColor: "bg-blue-500" },
    "CORE.OWNER_INVITE_REVOKED": { icon: MailX, dotColor: "bg-rose-400" },
    "CORE.OWNER_INVITE_ACCEPTED": {
        icon: UserCheck,
        dotColor: "bg-green-500",
    },
};

const FALLBACK: EventTypeMeta = { icon: Circle, dotColor: "bg-slate-300" };

export function getEventTypeMeta(eventType: string): EventTypeMeta {
    return META[eventType] ?? FALLBACK;
}
