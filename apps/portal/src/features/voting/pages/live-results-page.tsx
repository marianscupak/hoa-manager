import { format } from "date-fns";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router";

import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoteParticipation,
    useVotesControllerGetVoteTally,
    useVotesControllerGetVoteTurnout,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminView } from "@/auth/role-checks";
import { Button, DataTable, ErrorState, PageLoading } from "@hoa-mngr/ui";

import { getLiveResultsColumns } from "../components/live-results/live-results-columns";
import { LiveResultsHeader } from "../components/live-results/live-results-header";
import {
    FILTERS,
    LiveResultsToolbar,
} from "../components/live-results/live-results-toolbar";
import { RunningTallyCard } from "../components/live-results/running-tally-card";
import { TurnoutCard } from "../components/live-results/turnout-card";
import { UnitAnswersPanel } from "../components/live-results/unit-answers-panel";
import {
    filterUnits,
    type LiveResultsFilter,
    type LiveResultsRow,
} from "../utils/live-results-filter";

/** An open vote's standings move while people read them, so the four live
 *  resources poll rather than waiting for a navigation. */
const LIVE_QUERY_OPTIONS = {
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
} as const;

export function LiveResultsPage() {
    const { t } = useTranslation("voting");
    const { t: tCommon } = useTranslation("common");
    const { id } = useParams<{ id: string }>();
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isBoardView = isAdminView(tenantCtx?.roles);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<LiveResultsFilter>("all");

    const detailQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: { enabled: !!id, ...LIVE_QUERY_OPTIONS },
    });
    const vote = detailQuery.data;

    const turnoutQuery = useVotesControllerGetVoteTurnout(id ?? "", {
        query: { enabled: !!id, ...LIVE_QUERY_OPTIONS },
    });
    const participationQuery = useVotesControllerGetVoteParticipation(
        id ?? "",
        { query: { enabled: !!id, ...LIVE_QUERY_OPTIONS } },
    );
    const tallyQuery = useVotesControllerGetVoteTally(id ?? "", {
        query: {
            // Owners are refused this resource, so it is never requested for
            // them — the page must not depend on a 403 to stay quiet.
            enabled: !!id && isBoardView && vote?.status === "OPEN",
            ...LIVE_QUERY_OPTIONS,
        },
    });

    // Day granularity, matching how the paper-ballot unit list renders this
    // same castAt field — one field should not read two ways across the two
    // surfaces that show it.
    const formatDate = useCallback(
        (iso: string) => format(new Date(iso), "d. M. yyyy"),
        [],
    );

    const allRows = useMemo<LiveResultsRow[]>(
        () =>
            (participationQuery.data?.units ?? []).map((unit) => ({
                ...unit,
                id: unit.unitId,
            })),
        [participationQuery.data],
    );

    const rows = useMemo(
        () => filterUnits(allRows, { search, filter }),
        [allRows, search, filter],
    );

    // Counts come from the unfiltered rows through the same predicate the
    // pills apply, so a count can never disagree with what its pill selects.
    const pillCounts = useMemo(
        () =>
            Object.fromEntries(
                FILTERS.map((key) => [
                    key,
                    filterUnits(allRows, { search: "", filter: key }).length,
                ]),
            ) as Record<LiveResultsFilter, number>,
        [allRows],
    );

    const columns = useMemo(
        () =>
            getLiveResultsColumns({
                t,
                formatDate,
                isBoardView,
            }),
        [t, formatDate, isBoardView],
    );

    // The tally is board-only and turnout is its own card, so neither may
    // block or blank the page — each is gated on its own data instead.
    if (detailQuery.isLoading) {
        return <PageLoading />;
    }

    if (detailQuery.isError || !vote) {
        return (
            <ErrorState
                message={t("list.error")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void detailQuery.refetch()}
                    >
                        {tCommon("retry")}
                    </Button>
                }
            />
        );
    }

    // Status is settled before participation is consulted: a vote that has not
    // opened has no participation snapshot, so that query 404s, and gating on
    // it first would strand a DRAFT or SCHEDULED vote on an error page instead
    // of sending it back to its detail view. Inverted rather than enumerated,
    // so a status nobody has thought of yet redirects instead of rendering a
    // live page for a vote that is not live.
    if (vote.status === "CLOSED") {
        return <Navigate to={`/voting/${id}/results`} replace />;
    }
    if (vote.status !== "OPEN") {
        return <Navigate to={`/voting/${id}`} replace />;
    }

    if (participationQuery.isLoading) {
        return <PageLoading />;
    }

    if (participationQuery.isError || !participationQuery.data) {
        return (
            <ErrorState
                message={t("list.error")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void participationQuery.refetch()}
                    >
                        {tCommon("retry")}
                    </Button>
                }
            />
        );
    }

    const closesLabel = vote.scheduledTo
        ? format(new Date(vote.scheduledTo), "d. M. yyyy HH:mm")
        : null;

    // The owner note exists to explain the sealed ballots, and it says so by
    // naming the date they open; without one there is nothing to promise.
    const roleNote = isBoardView
        ? t("liveResults.note.board")
        : closesLabel
          ? t("liveResults.note.owner", { date: closesLabel })
          : null;

    const searchPlaceholder = t(
        isBoardView
            ? "liveResults.searchPlaceholder.board"
            : "liveResults.searchPlaceholder.owner",
    );

    // Expansion is all-or-nothing: the sub row needs the expander's two
    // labels to have an accessible name, and the grid needs its trailing
    // track. The owner variant opts out of the whole set.
    const expansionProps = isBoardView
        ? {
              getRowCanExpand: (row: LiveResultsRow) => row.status === "VOTED",
              renderSubRow: (row: LiveResultsRow) => (
                  <UnitAnswersPanel unit={row} questions={vote.questions} />
              ),
              expandRowLabel: (row: LiveResultsRow) =>
                  t("liveResults.answers.expand", { unitNo: row.unitNo }),
              collapseRowLabel: (row: LiveResultsRow) =>
                  t("liveResults.answers.collapse", { unitNo: row.unitNo }),
          }
        : {};

    return (
        <div className="flex flex-col gap-6">
            <LiveResultsHeader
                voteId={id ?? ""}
                title={vote.title}
                closesAt={vote.scheduledTo ?? null}
                isBoardView={isBoardView}
            />

            {turnoutQuery.data && (
                <TurnoutCard
                    turnout={turnoutQuery.data}
                    ruleset={vote.ruleset}
                    snapshotUnitCount={allRows.length}
                />
            )}

            {isBoardView && tallyQuery.data && (
                <RunningTallyCard
                    tally={tallyQuery.data}
                    questions={vote.questions}
                    weightBasis={vote.ruleset?.weightBasis ?? "UNIT_SHARE"}
                />
            )}

            {roleNote && (
                <div className="rounded-panel border-hairline bg-muted/40 text-secondary-foreground flex items-start gap-2.5 border p-3 text-sm">
                    <Info className="text-faint mt-0.5 h-4 w-4 shrink-0" />
                    <p>{roleNote}</p>
                </div>
            )}

            <LiveResultsToolbar
                search={search}
                onSearchChange={setSearch}
                filter={filter}
                onFilterChange={setFilter}
                counts={pillCounts}
                searchPlaceholder={searchPlaceholder}
            />

            <DataTable
                columns={columns}
                data={rows}
                gridTemplate={
                    isBoardView
                        ? "minmax(0,1.5fr) 0.55fr minmax(0,1.45fr) 44px"
                        : "minmax(0,1.6fr) 0.6fr 1fr"
                }
                // The table's own search is hidden, so its "no match" branch
                // never fires — the page has to name the empty state itself.
                emptyMessage={
                    search.trim() || filter !== "all"
                        ? t("liveResults.noMatch")
                        : t("liveResults.empty")
                }
                pageSize={10}
                initialSorting={[{ id: "unitNo", desc: false }]}
                countLabel={(info) =>
                    t("liveResults.showing", {
                        shown: info.total,
                        total: allRows.length,
                    })
                }
                paginationLabels={{
                    previous: tCommon("pagination.previous"),
                    next: tCommon("pagination.next"),
                }}
                {...expansionProps}
            />
        </div>
    );
}
