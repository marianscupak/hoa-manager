import type { StatusChipVariant } from "@hoa-mngr/ui";

import type { PersonResponseDto } from "@/api/generated/model";

export type PersonStatus =
    | "active"
    | "invited"
    | "suspended"
    | "invitationSent"
    | "noAccount";

/**
 * The one word the People table and the person's Account block both show.
 *
 * A membership, when there is one, is the fact; an owner's invitation is
 * only a pending offer of one. An expired invitation offers nothing, so it
 * reads as no account — and the page offers sending a fresh one.
 */
export function personStatus(
    person: Pick<PersonResponseDto, "membershipId" | "status" | "inviteStatus">,
): PersonStatus {
    if (person.membershipId) {
        if (person.status === "SUSPENDED") return "suspended";
        if (person.status === "INVITED") return "invited";
        return "active";
    }
    return person.inviteStatus === "pending" ? "invitationSent" : "noAccount";
}

export const PERSON_STATUS_CHIP: Record<
    Exclude<PersonStatus, "noAccount">,
    { variant: StatusChipVariant; labelKey: string }
> = {
    active: { variant: "success", labelKey: "users.table.status.ACTIVE" },
    invited: { variant: "warning", labelKey: "users.table.status.INVITED" },
    suspended: {
        variant: "destructive",
        labelKey: "users.table.status.SUSPENDED",
    },
    invitationSent: { variant: "warning", labelKey: "people.access.invited" },
};

/**
 * With one active ADMIN left, that role cannot be given away or suspended,
 * or there would be nobody to administer the association. A suspended admin
 * administers nothing, so they do not count.
 */
export function isLastActiveAdmin(
    people: Pick<PersonResponseDto, "role" | "status">[],
): boolean {
    return (
        people.filter((p) => p.role === "ADMIN" && p.status === "ACTIVE")
            .length === 1
    );
}

/**
 * What the Account block may offer. The server refuses all of these too;
 * hiding them only saves the round trip and the error toast.
 */
export function accountGuards(
    person: Pick<PersonResponseDto, "membershipId" | "role" | "status">,
    ctx: {
        isAdmin: boolean;
        isLastAdmin: boolean;
        currentMembershipId?: string;
    },
) {
    const lastAdminGuard =
        ctx.isLastAdmin &&
        person.role === "ADMIN" &&
        person.status === "ACTIVE";
    const isSelf =
        !!person.membershipId &&
        person.membershipId === ctx.currentMembershipId;
    return {
        lastAdminGuard,
        isSelf,
        canSuspend:
            ctx.isAdmin &&
            person.status === "ACTIVE" &&
            !isSelf &&
            !lastAdminGuard,
        canRestore: ctx.isAdmin && person.status === "SUSPENDED",
    };
}

/**
 * How the explainers refer to an owner: a person by their first name, a
 * company or an association by its whole name — "Invite B to the portal"
 * is what the first word of "B 2000 REAL a.s." would give.
 */
export function addressName(
    person: Pick<PersonResponseDto, "displayName" | "kind">,
): string {
    return person.kind === "PERSON"
        ? person.displayName.split(" ")[0]
        : person.displayName;
}
