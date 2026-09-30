import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useAtomValue } from "jotai";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button, ErrorState, formatPercent, PageLoading } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";
import {
    getPeopleControllerGetPeopleQueryKey,
    usePeopleControllerGetPeople,
} from "@/api/generated/people/people";
import {
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerGetUnits,
} from "@/api/generated/property-units/property-units";
import { tenantContextAtom } from "@/auth/atoms";
import { Role } from "@/auth/roles";
import { AddOwnerEmailDialog } from "@/features/admin/components/add-owner-email-dialog";

import { AccountBlock } from "../components/account-block";
import { OwnerBlock } from "../components/owner-block";
import { toOwnerRef, type PersonRow } from "../utils/people-filter";
import { personPageState } from "../utils/person-page";
import { isLastActiveAdmin } from "../utils/person-status";

function BackLink() {
    const { t } = useTranslation(["admin"]);
    return (
        <Link
            to="/people"
            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
        >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {t("people.detail.back")}
        </Link>
    );
}

function subtitle(t: TFunction<["admin", "common"]>, person: PersonRow) {
    if (!person.ownerId) return t("admin:people.detail.subtitle.accountOnly");
    const account = person.membershipId
        ? t("admin:people.detail.subtitle.hasAccount")
        : t("admin:people.detail.subtitle.noAccount");
    return person.unitCount > 0
        ? t("admin:people.detail.subtitle.ownerWithUnits", {
              count: person.unitCount,
              share: formatPercent(Number(person.sharePercent), 1),
              account,
          })
        : t("admin:people.detail.subtitle.owner", { account });
}

/**
 * One person, with everything that can be done about them.
 *
 * Read out of the same list the People table shows rather than a by-key
 * endpoint: the list is already cached when you arrive from the table, and
 * the last-admin guard and the accounts to link need the whole list anyway.
 */
export function PersonDetailPage() {
    const { key } = useParams();
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();
    const tenantCtx = useAtomValue(tenantContextAtom);
    const isAdmin = !!tenantCtx?.roles.includes(Role.ADMIN);
    const [addingEmail, setAddingEmail] = useState(false);

    const peopleQuery = usePeopleControllerGetPeople();
    const state = personPageState(peopleQuery, key);
    const person = state.kind === "found" ? state.person : undefined;
    // Stable, like the owner block's: the dialog must not see a new owner on
    // every render.
    const emailOwnerId = person?.ownerId ?? null;
    const emailOwnerName = person?.displayName ?? "";
    const emailOwner = useMemo(
        () =>
            toOwnerRef({
                ownerId: emailOwnerId,
                displayName: emailOwnerName,
            }) as OwnerResponseDto | null,
        [emailOwnerId, emailOwnerName],
    );

    const unitsQuery = useUnitControllerGetUnits({
        query: { enabled: !!person?.ownerId },
    });

    const refresh = () => {
        void queryClient.invalidateQueries({
            queryKey: getPeopleControllerGetPeopleQueryKey(),
        });
        void queryClient.invalidateQueries({
            queryKey: getUnitControllerGetUnitsQueryKey(),
        });
    };

    if (state.kind === "loading") {
        return <PageLoading label={t("common:loading")} />;
    }

    if (state.kind !== "found" || !person) {
        return (
            <div className="space-y-6">
                <BackLink />
                <ErrorState
                    message={
                        state.kind === "error"
                            ? t("people.detail.loadError")
                            : t("people.detail.notFound")
                    }
                    action={
                        state.kind === "error" ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => peopleQuery.refetch()}
                            >
                                {t("common:retry")}
                            </Button>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <BackLink />

            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {person.displayName}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {subtitle(t, person)}
                </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-6">
                <OwnerBlock
                    person={person}
                    units={unitsQuery.data}
                    unitsStatus={unitsQuery}
                    isAdmin={isAdmin}
                    onAddEmail={() => setAddingEmail(true)}
                    onChanged={refresh}
                />
                <AccountBlock
                    person={person}
                    people={state.people}
                    isAdmin={isAdmin}
                    isLastAdmin={isLastActiveAdmin(state.people)}
                    currentMembershipId={tenantCtx?.membershipId}
                    onAddEmail={() => setAddingEmail(true)}
                    onChanged={refresh}
                />
            </div>

            <AddOwnerEmailDialog
                owner={addingEmail ? emailOwner : null}
                open={addingEmail}
                onOpenChange={setAddingEmail}
                onSuccess={refresh}
            />
        </div>
    );
}
