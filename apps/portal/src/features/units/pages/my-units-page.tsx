import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
    Button,
    DataTable,
    EmptyState,
    ErrorState,
    PageHeader,
} from "@hoa-mngr/ui";

import { useUnitControllerGetMyOwnedUnits } from "@/api/generated/property-units/property-units";

import { getMyUnitColumns } from "../components/my-units-table-columns";

/**
 * The units the signed-in member owns. Visible to every member
 * regardless of role: an administrator or board member who also owns a
 * unit has the same need as any other owner.
 */
export function MyUnitsPage() {
    const { t } = useTranslation("common");
    const {
        data: units,
        isLoading,
        isError,
        refetch,
    } = useUnitControllerGetMyOwnedUnits();

    const columns = useMemo(() => getMyUnitColumns(t), [t]);

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader title={t("myUnits.title")} />
                <ErrorState
                    message={t("myUnits.loadError")}
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetch()}
                        >
                            {t("retry")}
                        </Button>
                    }
                />
            </div>
        );
    }

    // A member with no units is an ordinary case, not an edge one — a
    // property manager or a board member may own nothing in the
    // building. A calm card explains it better than a table of empty
    // columns.
    const isEmpty = !isLoading && (units?.length ?? 0) === 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("myUnits.title")}
                description={t("myUnits.description")}
            />

            {isEmpty ? (
                <EmptyState message={t("myUnits.empty")} />
            ) : (
                <DataTable
                    columns={columns}
                    data={units ?? []}
                    gridTemplate="1.2fr 1.3fr 1.7fr 60px"
                    isLoading={isLoading}
                    loadingMessage={t("loading")}
                    emptyMessage={t("myUnits.empty")}
                    initialSorting={[{ id: "unitNo", desc: false }]}
                    countLabel={(info) =>
                        t("myUnits.table.count", { count: info.total })
                    }
                />
            )}
        </div>
    );
}
