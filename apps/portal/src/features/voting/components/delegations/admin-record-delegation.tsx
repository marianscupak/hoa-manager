import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, UserPlus, Vote as VoteIcon } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { UnitOwnershipMemberResponseDtoKind } from "@/api/generated/model/unitOwnershipMemberResponseDtoKind";
import {
    useUnitControllerGetUnitDetail,
    useUnitControllerGetUnits,
} from "@/api/generated/property-units/property-units";
import {
    useVotesControllerCreateVoteConsent,
    useVotesControllerGetDelegationCandidates,
    useVotesControllerGetVotes,
    getVotesControllerGetVoterStatusQueryKey,
} from "@/api/generated/votes/votes";

import { votesOpenForDelegation } from "@/features/voting/utils/delegation-eligibility";

import {
    adminRecordDelegationSchema,
    AdminRecordDelegationFormValues,
} from "./schema";

export function AdminRecordDelegation() {
    const { t } = useTranslation(["voting", "common"]);
    const queryClient = useQueryClient();
    const schema = useMemo(() => adminRecordDelegationSchema(t), [t]);

    const form = useForm<AdminRecordDelegationFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            voteId: "",
            unitId: "",
            fromOwnerId: "",
            delegateMembershipId: "",
        },
    });

    const selectedVoteId = form.watch("voteId");
    const selectedUnitId = form.watch("unitId");
    const selectedFromOwnerId = form.watch("fromOwnerId");

    const { data: votes } = useVotesControllerGetVotes();
    const { data: units } = useUnitControllerGetUnits();

    const filteredVotes = votesOpenForDelegation(votes);

    // The represented-owner list comes from the selected unit's actual
    // owners — including owners without a user account (e.g. an SJM spouse)
    // — not from tenant memberships, since anyone who owns the unit may
    // name a representative (requires majority-of-shares consent).
    const { data: unitDetail } = useUnitControllerGetUnitDetail(
        selectedUnitId,
        {
            query: { enabled: !!selectedUnitId },
        },
    );

    const grantorOptions = useMemo(() => {
        const members = (unitDetail?.ownerships ?? []).flatMap(
            (ownership) => ownership.members,
        );
        const byOwnerId = new Map<string, (typeof members)[number]>();
        for (const member of members) {
            if (
                member.kind === UnitOwnershipMemberResponseDtoKind.ASSOCIATION
            ) {
                continue;
            }
            byOwnerId.set(member.ownerId, member);
        }
        return [...byOwnerId.values()];
    }, [unitDetail]);

    // The representative may be any active member of the association —
    // who represents the unit is not itself a co-ownership matter — so it
    // keeps using every tenant membership.
    const { data: delegateCandidates } =
        useVotesControllerGetDelegationCandidates(
            selectedVoteId,
            {
                unitId: selectedUnitId,
            },
            {
                query: { enabled: !!selectedVoteId && !!selectedUnitId },
            },
        );

    const { mutate: createProxy, isPending } =
        useVotesControllerCreateVoteConsent();

    function onSubmit(data: AdminRecordDelegationFormValues) {
        createProxy(
            {
                id: data.voteId,
                data: {
                    unitId: data.unitId,
                    fromOwnerId: data.fromOwnerId,
                    delegateMembershipId: data.delegateMembershipId,
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("voting:delegations.admin.success"));
                    form.reset({
                        voteId: data.voteId, // Keep vote to add multiple
                        unitId: "",
                        fromOwnerId: "",
                        delegateMembershipId: "",
                    });
                    queryClient.invalidateQueries({
                        queryKey: getVotesControllerGetVoterStatusQueryKey(
                            data.voteId,
                        ),
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
                    queryClient.invalidateQueries({
                        queryKey: ["/api/votes/consents"],
                    });
                },
                onError: (error) => {
                    showApiError(error);
                },
            },
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">
                    {t("voting:delegations.admin.title")}
                </CardTitle>
                <CardDescription>
                    {t("voting:delegations.admin.description")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="voteId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <VoteIcon className="h-4 w-4" />
                                            {t(
                                                "voting:delegations.admin.selectVote",
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                form.setValue("unitId", "");
                                                form.setValue(
                                                    "fromOwnerId",
                                                    "",
                                                );
                                                form.setValue(
                                                    "delegateMembershipId",
                                                    "",
                                                );
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            "voting:delegations.admin.selectVote",
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredVotes.map((v) => (
                                                    <SelectItem
                                                        key={v.id}
                                                        value={v.id}
                                                    >
                                                        {v.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Building2 className="h-4 w-4" />
                                            {t(
                                                "voting:delegations.admin.selectUnit",
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                form.setValue(
                                                    "fromOwnerId",
                                                    "",
                                                );
                                                form.setValue(
                                                    "delegateMembershipId",
                                                    "",
                                                );
                                            }}
                                            value={field.value}
                                            disabled={!selectedVoteId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            "voting:delegations.admin.selectUnit",
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {units?.map((u) => (
                                                    <SelectItem
                                                        key={u.id}
                                                        value={u.id}
                                                    >
                                                        {u.unitNo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="fromOwnerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <UserPlus className="h-4 w-4" />
                                            {t(
                                                "voting:delegations.admin.selectOwner",
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                form.setValue(
                                                    "delegateMembershipId",
                                                    "",
                                                );
                                            }}
                                            value={field.value}
                                            disabled={!selectedUnitId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            "voting:delegations.admin.selectOwner",
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {grantorOptions.map((m) => (
                                                    <SelectItem
                                                        key={m.ownerId}
                                                        value={m.ownerId}
                                                    >
                                                        {m.displayName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="delegateMembershipId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <UserPlus className="h-4 w-4" />
                                            {t(
                                                "voting:delegations.admin.selectDelegate",
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!selectedFromOwnerId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            "voting:delegations.admin.selectDelegate",
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(delegateCandidates ?? []).map(
                                                    (c) => (
                                                        <SelectItem
                                                            key={c.membershipId}
                                                            value={
                                                                c.membershipId
                                                            }
                                                        >
                                                            {c.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={isPending || !form.formState.isValid}
                                className="min-w-[150px]"
                            >
                                {isPending ? (
                                    t("common:loading")
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        <span>
                                            {t("voting:delegate.confirmButton")}
                                        </span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
