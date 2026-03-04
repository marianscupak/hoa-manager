import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { toast } from "@hoa-mngr/ui";

import { useAuthControllerLogin } from "@/api/generated/auth/auth";
import { useSessionManager } from "@/auth/use-session-manager";

const formSchema = z.object({
    email: z.email("auth:login.invalidEmail"),
    password: z.string().min(1, "auth:login.invalidPassword"),
});

export type LoginFormValues = z.infer<typeof formSchema>;

export function useLogin() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const location = useLocation();

    const { setSession } = useSessionManager();

    const from = location.state?.from?.pathname || "/";

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const loginMutation = useAuthControllerLogin();

    const handleLogin = (values: LoginFormValues) => {
        loginMutation.mutate(
            { data: { email: values.email, password: values.password } },
            {
                onSuccess: (data) => {
                    const { success, hasTenant } = setSession(data.accessToken);
                    if (!success) return;

                    if (from.startsWith("/invites") || hasTenant) {
                        navigate(from, { replace: true });
                    } else {
                        navigate("/tenant", { replace: true });
                    }
                },
                onError: () => {
                    toast.error(t("login.error"));
                },
            },
        );
    };

    return {
        form,
        handleLogin,
        isPending: loginMutation.isPending,
        isError: loginMutation.isError,
    };
}
