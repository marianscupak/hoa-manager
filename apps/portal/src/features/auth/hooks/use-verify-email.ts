import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import { toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    useAuthControllerResendVerification,
    useAuthControllerVerifyEmail,
} from "@/api/generated/auth/auth";
import { useSessionManager } from "@/auth/use-session-manager";

import { remainingCooldownSeconds } from "../resend-cooldown";

const formSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "auth:verifyEmail.invalidCode"),
});

export type VerifyEmailFormValues = z.infer<typeof formSchema>;

export function useVerifyEmail(email: string) {
    const navigate = useNavigate();
    const { t } = useTranslation("auth");
    const { setSession } = useSessionManager();

    const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!lastSentAt) return;
        const tick = () =>
            setCooldown(remainingCooldownSeconds(lastSentAt, new Date()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lastSentAt]);

    const form = useForm<VerifyEmailFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { code: "" },
    });

    const verifyMutation = useAuthControllerVerifyEmail();
    const resendMutation = useAuthControllerResendVerification();

    const handleVerify = (values: VerifyEmailFormValues) => {
        verifyMutation.mutate(
            { data: { email, code: values.code } },
            {
                onSuccess: (data) => {
                    const { success, hasTenant } = setSession(data.accessToken);
                    if (!success) return;
                    navigate(hasTenant ? "/" : "/tenant", { replace: true });
                },
                onError: showApiError,
            },
        );
    };

    const resend = () => {
        if (cooldown > 0) return;
        resendMutation.mutate(
            { data: { email } },
            {
                onSuccess: () => {
                    setLastSentAt(new Date());
                    toast.success(t("verifyEmail.resent"));
                },
                onError: showApiError,
            },
        );
    };

    return {
        form,
        handleVerify,
        resend,
        isPending: verifyMutation.isPending,
        isResending: resendMutation.isPending,
        cooldown,
    };
}
