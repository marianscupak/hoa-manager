import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, PageHeader } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { OwnerResponseDto } from "@/api/generated/model";
import { usePeopleControllerGetPeople } from "@/api/generated/people/people";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { AddOwnerEmailDialog } from "@/features/admin/components/add-owner-email-dialog";
import { RenameOwnerDialog } from "@/features/admin/components/rename-owner-dialog";
import { CreateOwnerDialog } from "@/features/admin/components/create-owner-dialog";
import { DeleteOwnerDialog } from "@/features/admin/components/delete-owner-dialog";
import { Role } from "@/auth/roles";

import { LinkAccountDialog } from "../components/link-account-dialog";
import { PersonAccessCell } from "../components/person-access-cell";
import { PersonRowActions } from "../components/person-row-actions";
import { getPeopleColumns } from "../components/people-table-columns";
import {
    filterPeople,
    PEOPLE_FILTERS,
    toOwnerRef,
    toPersonRows,
    type PeopleFilter,
    type PersonRow,
} from "../utils/people-filter";

const FILTER_LABEL: Record<PeopleFilter, string> = {
    all: "people.filters.all",
    owners: "people.filters.owners",
    withAccess: "people.filters.withAccess",
    withoutAccount: "people.filters.withoutAccount",
};

/**
 * Owners and accounts as one list.
 *
 * The same screen for everyone in the association, growing columns and
 * actions with the role: who owns which unit is public, while contact
 * details and account state belong to the people who administer the
 * building. The server is what enforces that — this only decides what to
 * render out of what it was given.
 */
export function PeoplePage() {
    const { t } = useTranslation(["admin"]);
    const { t: tCommon } = useTranslation("common");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const canSeeAccounts = isAdminOrBoard(tenantCtx?.roles);

    const isAdmin = !!tenantCtx?.roles.includes(Role.ADMIN);

    const [filter, setFilter] = useState<PeopleFilter>("all");
    const [createOpen, setCreateOpen] = useState(false);
    const [linking, setLinking] = useState<PersonRow | null>(null);
    const [deleting, setDeleting] = useState<PersonRow | null>(null);
    const [addingEmail, setAddingEmail] = useState<PersonRow | null>(null);
    const [renaming, setRenaming] = useState<PersonRow | null>(null);

    const { data: people, isLoading, refetch } = usePeopleControllerGetPeople();

    const allRows = useMemo(() => toPersonRows(people ?? []), [people]);

    // The guard the role control needs: with one ADMIN left, that role cannot
    // be given away or there would be nobody to administer the association.
    const isLastAdmin = allRows.filter((p) => p.role === "ADMIN").length === 1;

    const columns = useMemo(
        () =>
            getPeopleColumns(t, {
                canSeeAccounts,
                renderAccess: (person) => (
                    <PersonAccessCell
                        person={person}
                        isAdmin={isAdmin}
                        isLastAdmin={isLastAdmin}
                    />
                ),
                renderActions: (person) => (
                    <PersonRowActions
                        person={person}
                        isAdmin={isAdmin}
                        onDelete={setDeleting}
                        onAddEmail={setAddingEmail}
                        onRename={setRenaming}
                        onLink={setLinking}
                    />
                ),
            }),
        [t, canSeeAccounts, isAdmin, isLastAdmin],
    );
    const rows = filterPeople(allRows, filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <PageHeader
                    title={t("people.title")}
                    description={t("people.description")}
                />
                {canSeeAccounts && (
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus /> {t("people.addOwner")}
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={rows}
                // E-mail is the longest text on the row, so it takes the
                // largest share; a name wraps where it has to, and the unit
                // count never needs more than ~80px. Access is fixed at the
                // width of its widest control, the role select.
                gridTemplate={
                    canSeeAccounts ? "1.3fr 1.9fr 0.8fr 170px 400px" : "2fr 1fr"
                }
                // The admin view carries five columns, two of which hold
                // controls rather than text; below this they stop fitting and
                // scrolling beats squeezing. The owner's two columns always
                // fit, so they get no floor.
                //
                // A row can offer four actions at once (rename, add e-mail,
                // link an account, delete), which in Czech runs to ~390px —
                // the old 230px track let those buttons spill left over the
                // access column, and the old 980px floor was below the point
                // where the text columns start colliding. Both are sized to
                // the widest real row now, so the table scrolls rather than
                // overlapping itself.
                minWidth={canSeeAccounts ? "1220px" : undefined}
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("people.empty")}
                emptySearchMessage={t("people.table.noMatch")}
                searchPlaceholder={t("people.table.searchPlaceholder")}
                initialSorting={[{ id: "name", desc: false }]}
                countLabel={(info) =>
                    t("people.table.count", { count: info.total })
                }
                // Only for callers who see the account side. Every pill but
                // "Vše" is defined on data a unit owner is not given, so for
                // them "S přístupem" would read 0 and "Bez účtu" would read
                // everyone — two statements about their neighbours that are
                // false.
                toolbarEnd={
                    canSeeAccounts ? (
                        <div className="flex flex-wrap gap-1.5">
                            {PEOPLE_FILTERS.map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "h-7 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors",
                                        f === filter
                                            ? "bg-primary text-primary-foreground shadow-clay-btn-sm"
                                            : "bg-accent text-secondary-foreground hover:bg-border",
                                    )}
                                >
                                    {t(FILTER_LABEL[f] as "people.filters.all")}{" "}
                                    <span className="font-medium opacity-70">
                                        {filterPeople(allRows, f).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : undefined
                }
            />

            {/* Both spouses of an SJM party carry the whole undivided share,
                so the column genuinely does not add up. Saying so is cheaper
                than letting someone reconcile it against the unit list. */}
            <p className="text-faint text-xs">{t("people.table.sharesNote")}</p>

            {canSeeAccounts && (
                <>
                    <CreateOwnerDialog
                        open={createOpen}
                        onOpenChange={setCreateOpen}
                        onSuccess={refetch}
                    />
                    <LinkAccountDialog
                        owner={linking}
                        people={allRows}
                        onOpenChange={(open) => !open && setLinking(null)}
                    />
                    <AddOwnerEmailDialog
                        owner={
                            toOwnerRef(addingEmail) as OwnerResponseDto | null
                        }
                        open={addingEmail !== null}
                        onOpenChange={(open) => !open && setAddingEmail(null)}
                        onSuccess={refetch}
                    />
                    <RenameOwnerDialog
                        owner={toOwnerRef(renaming) as OwnerResponseDto | null}
                        open={renaming !== null}
                        onOpenChange={(open) => !open && setRenaming(null)}
                        onSuccess={refetch}
                    />
                    <DeleteOwnerDialog
                        owner={toOwnerRef(deleting) as OwnerResponseDto | null}
                        open={deleting !== null}
                        onOpenChange={(open) => !open && setDeleting(null)}
                        onSuccess={refetch}
                    />
                </>
            )}
        </div>
    );
}
