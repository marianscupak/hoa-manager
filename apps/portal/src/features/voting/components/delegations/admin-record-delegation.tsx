import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, UserPlus, Vote as VoteIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";
import {
    useVotesControllerCreateVoteConsent,
    useVotesControllerGetDelegationCandidates,
    useVotesControllerGetVotes,
    getVotesControllerGetVoterStatusQueryKey,
} from "@/api/generated/votes/votes";

const adminRecordDelegationSchema = z.object({
    voteId: z.string().min(1, "Vyberte hlasování"),
    unitId: z.string().min(1, "Vyberte jednotku"),
    ownerMembershipId: z.string().min(1, "Vyberte vlastníka"),
    delegateMembershipId: z.string().min(1, "Vyberte zmocněnce"),
});

type AdminRecordDelegationFormValues = z.infer<
    typeof adminRecordDelegationSchema
>;

export function AdminRecordDelegation() {
    const { t } = useTranslation(["voting", "common"]);
    const queryClient = useQueryClient();

    const form = useForm<AdminRecordDelegationFormValues>({
        resolver: zodResolver(adminRecordDelegationSchema),
        defaultValues: {
            voteId: "",
            unitId: "",
            ownerMembershipId: "",
            delegateMembershipId: "",
        },
    });

    const selectedVoteId = form.watch("voteId");
    const selectedUnitId = form.watch("unitId");
    const selectedOwnerMembershipId = form.watch("ownerMembershipId");

    const { data: votes } = useVotesControllerGetVotes();
    const { data: units } = useUnitControllerGetUnits();

    const filteredVotes =
        votes?.filter((v) => !v.allowCoOwnerIndividualVote) || [];

    const { data: candidates } = useVotesControllerGetDelegationCandidates(
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
                    ownerMembershipId: data.ownerMembershipId,
                    delegateMembershipId: data.delegateMembershipId,
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("voting:delegations.admin.success"));
                    form.reset({
                        voteId: data.voteId, // Keep vote to add multiple
                        unitId: "",
                        ownerMembershipId: "",
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

    const ownerCandidates = candidates || [];
    const delegateCandidates =
        ownerCandidates.filter(
            (c) => c.membershipId !== selectedOwnerMembershipId,
        ) || [];

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
                                                    "ownerMembershipId",
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
                                                    "ownerMembershipId",
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
                                name="ownerMembershipId"
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
                                                {ownerCandidates.map((c) => (
                                                    <SelectItem
                                                        key={c.membershipId}
                                                        value={c.membershipId}
                                                    >
                                                        {c.name}
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
                                            disabled={
                                                !selectedOwnerMembershipId
                                            }
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
                                                {delegateCandidates.map((c) => (
                                                    <SelectItem
                                                        key={c.membershipId}
                                                        value={c.membershipId}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
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
