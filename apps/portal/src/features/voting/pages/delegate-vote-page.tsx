import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoterStatus,
    useVotesControllerGetDelegationCandidates,
    useVotesControllerPreviewConsentOutcome,
    useVotesControllerCreateVoteConsent,
    getVotesControllerGetVoterStatusQueryKey,
    getVotesControllerGetVotesQueryKey,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";

import { ConfirmDelegationModal } from "../components/confirm-delegation-modal";
import { DelegateSelection } from "../components/delegation/delegate-selection";
import { DelegationHeader } from "../components/delegation/delegation-header";
import { DelegationNotice } from "../components/delegation/delegation-notice";
import { DelegationSummary } from "../components/delegation/delegation-summary";
import { UnitSelection } from "../components/delegation/unit-selection";
import { candidateKey, consentTargetFromKey } from "../utils/candidate-key";
import { consentRisk, isDelegableUnit } from "../utils/delegation-eligibility";

export const DelegateVotePage = () => {
    const { id = "" } = useParams();
    const { t } = useTranslation("voting");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(
        null,
    );
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const tenantCtx = useAtomValue(tenantContextAtom);
    const { data: vote } = useVotesControllerGetVoteDetail(id);
    const { data: voterStatus } = useVotesControllerGetVoterStatus(id);
    const { data: candidates } = useVotesControllerGetDelegationCandidates(
        id,
        {
            unitId: selectedUnitId || "",
            forMembershipId: tenantCtx?.membershipId,
        },
        {
            query: {
                enabled: !!selectedUnitId,
            },
        },
    );

    // What this consent would do to the unit, asked of the server because the
    // answer depends on the other owners' shares and consents, which the
    // portal never sees.
    const { data: preview, isPending: isPreviewPending } =
        useVotesControllerPreviewConsentOutcome(
            id,
            {
                unitId: selectedUnitId || "",
                ...(selectedDelegateId
                    ? consentTargetFromKey(selectedDelegateId)
                    : {}),
            },
            {
                query: { enabled: !!selectedUnitId && !!selectedDelegateId },
            },
        );

    const createConsent = useVotesControllerCreateVoteConsent();

    const selectedUnit = voterStatus?.owningUnits.find(
        (u) => u.id === selectedUnitId,
    );
    const selectedDelegate = candidates?.find(
        (c) => candidateKey(c) === selectedDelegateId,
    );

    const handleConfirm = () => {
        if (!selectedUnitId || !selectedDelegateId) return;

        createConsent.mutate(
            {
                id,
                data: {
                    unitId: selectedUnitId,
                    ...consentTargetFromKey(selectedDelegateId),
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("delegate.modal.toast.success"));
                    queryClient.invalidateQueries({
                        queryKey: getVotesControllerGetVoterStatusQueryKey(id),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getVotesControllerGetVotesQueryKey(),
                    });
                    queryClient.invalidateQueries({
                        queryKey: ["/api/votes/consents"],
                    });

                    setIsConfirmModalOpen(false);
                    navigate(`/voting/${id}`);
                },
                onError: showApiError,
            },
        );
    };

    const filteredCandidates = candidates?.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectableUnits =
        voterStatus?.owningUnits.filter(isDelegableUnit) || [];

    const risk = consentRisk(preview, isPreviewPending);

    if (!vote || !voterStatus) return null;

    return (
        <div className="container max-w-5xl py-4">
            <DelegationHeader
                voteTitle={vote.title}
                scheduledFrom={vote.scheduledFrom}
                onBack={() => navigate(`/voting/${id}`)}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <UnitSelection
                        units={selectableUnits}
                        selectedUnitId={selectedUnitId}
                        onSelect={(id) => {
                            setSelectedUnitId(id);
                            setSelectedDelegateId(null);
                        }}
                    />

                    <DelegateSelection
                        candidates={filteredCandidates || []}
                        selectedDelegateId={selectedDelegateId}
                        onSelect={setSelectedDelegateId}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        isEnabled={!!selectedUnitId}
                    />
                </div>

                <div className="space-y-6">
                    <DelegationNotice />

                    <DelegationSummary
                        selectedUnit={selectedUnit}
                        selectedDelegate={selectedDelegate}
                        risk={risk}
                        isPending={createConsent.isPending}
                        onConfirm={() => setIsConfirmModalOpen(true)}
                        isValid={!!selectedUnitId && !!selectedDelegateId}
                    />
                </div>
            </div>

            <ConfirmDelegationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirm}
                unitName={selectedUnit?.name || ""}
                delegateName={selectedDelegate?.name || ""}
                delegateHasAccount={selectedDelegate?.hasAccount ?? true}
                risk={risk}
                voteTitle={vote.title}
                scheduledFrom={vote.scheduledFrom}
                isPending={createConsent.isPending}
            />
        </div>
    );
};
