import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { ErrorState, PageLoading } from "@hoa-mngr/ui";

import { PublishedStage } from "@/features/voting/components/assembly-record/published-stage";
import { buildPublishChecks } from "@/features/voting/components/assembly-record/publish-checklist";
import { RecordHeader } from "@/features/voting/components/assembly-record/record-header";
import { ReviewStage } from "@/features/voting/components/assembly-record/review-stage";
import { useAssemblyRecord } from "@/features/voting/hooks/use-assembly-record";

/**
 * The last two stages of the assembly flow: check the record, then publish it.
 *
 * Which one shows is read off the vote's own status rather than kept in local
 * state, so a refresh after publishing lands on the published screen instead
 * of offering a publish button that would only fail.
 */
export function AssemblyRecordReviewPage() {
    const { id = "" } = useParams();
    const { t } = useTranslation(["voting"]);

    const {
        record,
        isLoading,
        isError,
        refetch,
        answer,
        publish,
        isSaving,
        isPublishing,
    } = useAssemblyRecord(id);

    const [confirmed, setConfirmed] = useState(false);

    if (isLoading) return <PageLoading />;
    if (isError || !record) {
        return <ErrorState message={t("voting:assemblyRecord.loadError")} />;
    }

    const published = record.status !== "DRAFT";

    // Present units the board has not finished. Captured before the loop runs,
    // so the refetches it triggers cannot move the goalposts mid-iteration.
    const missing = record.units.filter(
        (unit) =>
            unit.attendance === "PRESENT" &&
            unit.answers.length < record.questions.length,
    );

    // The shortcut is offered only when it can complete: every resolution
    // needs an abstain option to record, and the ballot command needs a voter
    // on the attendance row. Half-applying it and leaving the rest amber would
    // be worse than sending the board to the roster.
    const canRecordAllAbstain =
        missing.length > 0 &&
        record.questions.length > 0 &&
        record.questions.every((question) =>
            question.options.some((option) => option.optionKey === "ABSTAIN"),
        ) &&
        missing.every((unit) => unit.voterOwnerId || unit.voterNote);

    const recordAllAbstain = async () => {
        for (const unit of missing) {
            // A ballot is replaced whole, so answers already entered for this
            // unit travel with the abstentions.
            const answers = record.questions.map((question) => {
                const existing = unit.answers.find(
                    (a) => a.questionId === question.questionId,
                );
                if (existing) return existing;
                const abstain = question.options.find(
                    (o) => o.optionKey === "ABSTAIN",
                );
                return {
                    questionId: question.questionId,
                    optionId: abstain?.optionId ?? "",
                };
            });
            try {
                await answer(unit.unitId, answers);
            } catch {
                // Surfaced as a toast by the hook; stop rather than pile up
                // failures for every remaining unit.
                return;
            }
        }
    };

    const onPublish = async () => {
        try {
            await publish();
            await refetch();
        } catch {
            // The hook toasts the reason; the board stays on the review screen
            // with everything it entered intact.
        }
    };

    return (
        <div className="bg-background min-h-screen">
            <RecordHeader
                voteId={id}
                title={record.voteTitle}
                meetingDate={record.meetingDate}
                published={published}
            />

            {published ? (
                <PublishedStage voteId={id} record={record} />
            ) : (
                <ReviewStage
                    voteId={id}
                    record={record}
                    checks={buildPublishChecks(record)}
                    confirmed={confirmed}
                    onConfirmedChange={setConfirmed}
                    onPublish={onPublish}
                    isPublishing={isPublishing}
                    onRecordAllAbstain={
                        canRecordAllAbstain ? recordAllAbstain : null
                    }
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}
