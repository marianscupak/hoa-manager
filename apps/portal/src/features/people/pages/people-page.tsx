import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, PageHeader } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { usePeopleControllerGetPeople } from "@/api/generated/people/people";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { CreateOwnerDialog } from "@/features/admin/components/create-owner-dialog";

import { getPeopleColumns } from "../components/people-table-columns";
import {
    filterPeople,
    PEOPLE_FILTERS,
    toPersonRows,
    type PeopleFilter,
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

    const [filter, setFilter] = useState<PeopleFilter>("all");
    const [createOpen, setCreateOpen] = useState(false);

    const { data: people, isLoading, refetch } = usePeopleControllerGetPeople();

    const columns = useMemo(
        () =>
            getPeopleColumns(t, {
                canSeeAccounts,
                renderActions: () => null,
            }),
        [t, canSeeAccounts],
    );

    const allRows = useMemo(() => toPersonRows(people ?? []), [people]);
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
                gridTemplate={
                    canSeeAccounts ? "1.6fr 1.5fr 0.9fr 1fr 150px" : "2fr 1fr"
                }
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("people.empty")}
                emptySearchMessage={t("people.table.noMatch")}
                searchPlaceholder={t("people.table.searchPlaceholder")}
                initialSorting={[{ id: "name", desc: false }]}
                countLabel={(info) =>
                    t("people.table.count", { count: info.total })
                }
                toolbarEnd={
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
                }
            />

            {/* Both spouses of an SJM party carry the whole undivided share,
                so the column genuinely does not add up. Saying so is cheaper
                than letting someone reconcile it against the unit list. */}
            <p className="text-faint text-xs">{t("people.table.sharesNote")}</p>

            {canSeeAccounts && (
                <CreateOwnerDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSuccess={refetch}
                />
            )}
        </div>
    );
}
