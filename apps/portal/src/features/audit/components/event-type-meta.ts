import {
    BarChart3,
    Building2,
    CalendarClock,
    CheckSquare,
    Circle,
    FilePlus,
    HelpCircle,
    Home,
    Import,
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
    Undo2,
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
    "VOTING.VOTE_CREATED": { icon: FilePlus, dotColor: "bg-primary" },
    "VOTING.VOTE_UPDATED": { icon: PencilLine, dotColor: "bg-primary" },
    "VOTING.VOTE_DELETED": { icon: Trash2, dotColor: "bg-destructive-bar" },
    "VOTING.VOTE_RULESET_SET": { icon: Settings, dotColor: "bg-primary" },
    "VOTING.VOTE_RULESET_NON_STATUTORY_ACKNOWLEDGED": {
        icon: ShieldCheck,
        dotColor: "bg-warning",
    },
    "VOTING.VOTE_SCHEDULED": { icon: CalendarClock, dotColor: "bg-primary" },
    "VOTING.VOTE_OPENED": { icon: PlayCircle, dotColor: "bg-success" },
    "VOTING.VOTE_ELECTORATE_SNAPSHOTTED": {
        icon: Users,
        dotColor: "bg-primary",
    },
    "VOTING.VOTE_QUESTION_CREATED": {
        icon: HelpCircle,
        dotColor: "bg-primary",
    },
    "VOTING.VOTE_QUESTION_UPDATED": {
        icon: PencilLine,
        dotColor: "bg-primary",
    },
    "VOTING.VOTE_QUESTION_DELETED": {
        icon: Trash2,
        dotColor: "bg-destructive-bar",
    },
    "VOTING.VOTE_CONSENT_CREATED": {
        icon: UserPlus,
        dotColor: "bg-primary",
    },
    "VOTING.VOTE_CONSENT_REVOKED": {
        icon: UserMinus,
        dotColor: "bg-destructive-bar",
    },
    "VOTING.BALLOT_CAST_DIRECT": { icon: CheckSquare, dotColor: "bg-primary" },
    "VOTING.BALLOT_CAST_PROXY": { icon: UserCheck, dotColor: "bg-primary" },
    "VOTING.VOTE_CLOSED": { icon: Lock, dotColor: "bg-warning" },
    "VOTING.VOTE_RESULTS_COMPUTED": {
        icon: BarChart3,
        dotColor: "bg-success",
    },
    "VOTING.VOTE_DOCUMENT_ADDED": { icon: FilePlus, dotColor: "bg-primary" },
    "VOTING.VOTE_DOCUMENT_REMOVED": {
        icon: Trash2,
        dotColor: "bg-destructive-bar",
    },
    "CORE.TENANT_CREATED": { icon: Building2, dotColor: "bg-success" },
    "CORE.MEMBERSHIP_CREATED": { icon: UserPlus, dotColor: "bg-faint" },
    "CORE.MEMBERSHIP_ROLE_UPDATED": {
        icon: ShieldCheck,
        dotColor: "bg-faint",
    },
    "CORE.MEMBERSHIP_STATUS_UPDATED": {
        icon: UserCog,
        dotColor: "bg-warning",
    },
    "CORE.UNIT_CREATED": { icon: Home, dotColor: "bg-faint" },
    "CORE.UNIT_UPDATED": { icon: PencilLine, dotColor: "bg-faint" },
    "CORE.UNIT_DELETED": { icon: Trash2, dotColor: "bg-destructive-bar" },
    "CORE.OWNER_CREATED": { icon: UserPlus, dotColor: "bg-faint" },
    "CORE.OWNER_DELETED": { icon: UserMinus, dotColor: "bg-destructive-bar" },
    "CORE.UNIT_OWNERSHIP_REPLACED": {
        icon: Repeat,
        dotColor: "bg-faint",
    },
    "CORE.UNIT_OWNERSHIP_TRANSFER_CANCELLED": {
        icon: Undo2,
        dotColor: "bg-faint",
    },
    "CORE.OWNER_EMAIL_ADDED": { icon: MailPlus, dotColor: "bg-faint" },
    "CORE.OWNER_USER_LINKED": { icon: Link2, dotColor: "bg-faint" },
    "CORE.OWNER_INVITE_SENT": { icon: MailPlus, dotColor: "bg-faint" },
    "CORE.OWNER_INVITE_REVOKED": {
        icon: MailX,
        dotColor: "bg-destructive-bar",
    },
    "CORE.OWNER_INVITE_ACCEPTED": {
        icon: UserCheck,
        dotColor: "bg-success",
    },
    "CORE.KATASTR_DATA_IMPORTED": { icon: Import, dotColor: "bg-faint" },
};

const FALLBACK: EventTypeMeta = { icon: Circle, dotColor: "bg-border" };

export function getEventTypeMeta(eventType: string): EventTypeMeta {
    return META[eventType] ?? FALLBACK;
}
