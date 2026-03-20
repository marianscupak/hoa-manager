import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoterStatus,
    useVotesControllerGetDelegationCandidates,
    useVotesControllerCreateVoteConsent,
    getVotesControllerGetVoterStatusQueryKey,
    getVotesControllerGetVotesQueryKey,
} from "@/api/generated/votes/votes";

import { ConfirmDelegationModal } from "../components/confirm-delegation-modal";
import { DelegateSelection } from "../components/delegation/delegate-selection";
import { DelegationHeader } from "../components/delegation/delegation-header";
import { DelegationNotice } from "../components/delegation/delegation-notice";
import { DelegationSummary } from "../components/delegation/delegation-summary";
import { UnitSelection } from "../components/delegation/unit-selection";

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

    const { data: vote } = useVotesControllerGetVoteDetail(id);
    const { data: voterStatus } = useVotesControllerGetVoterStatus(id);
    const { data: candidates } = useVotesControllerGetDelegationCandidates(
        id,
        {
            unitId: selectedUnitId || "",
        },
        {
            query: {
                enabled: !!selectedUnitId,
            },
        },
    );

    const createConsent = useVotesControllerCreateVoteConsent();

    const selectedUnit = voterStatus?.owningUnits.find(
        (u) => u.id === selectedUnitId,
    );
    const selectedDelegate = candidates?.find(
        (c) => c.membershipId === selectedDelegateId,
    );

    const handleConfirm = async () => {
        if (!selectedUnitId || !selectedDelegateId) return;

        try {
            await createConsent.mutateAsync({
                id,
                data: {
                    unitId: selectedUnitId,
                    delegateMembershipId: selectedDelegateId,
                },
            });

            toast.success(t("delegate.modal.toast.success"));

            // Invalidate relevant queries to ensure UI updates
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoterStatusQueryKey(id),
            });
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVotesQueryKey(),
            });

            setIsConfirmModalOpen(false);
            navigate(`/voting/${id}`);
        } catch (error) {
            showApiError(error);
        }
    };

    const filteredCandidates = candidates?.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Filter units that are not already delegated or voted
    const selectableUnits = voterStatus?.owningUnits.filter(
        (u) => u.status === "REQUIRES_DELEGATION" || u.status === "READY",
    ) || [];

    if (!vote || !voterStatus) return null;

    return (
        <div className="container max-w-5xl py-4">
            <DelegationHeader 
                voteTitle={vote.title}
                scheduledFrom={vote.scheduledFrom}
                onBack={() => navigate(`/voting/${id}`)}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Steps */}
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

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <DelegationNotice />
                    
                    <DelegationSummary 
                        selectedUnit={selectedUnit}
                        selectedDelegate={selectedDelegate}
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
                voteTitle={vote.title}
                scheduledFrom={vote.scheduledFrom}
                isPending={createConsent.isPending}
            />
        </div>
    );
};
