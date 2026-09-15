import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { showApiError } from "@/api/error-utils";
import { useAuthControllerLogin } from "@/api/generated/auth/auth";
import { useSessionManager } from "@/auth/use-session-manager";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

const formSchema = z.object({
    email: z.string().email("auth:login.invalidEmail"),
    password: z.string().min(1, "auth:login.invalidPassword"),
});

export type LoginFormValues = z.infer<typeof formSchema>;

export function useLogin() {
    const navigate = useNavigate();

    const { setSession } = useSessionManager();

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

                    const storedRedirect = StorageService.getString(
                        STORAGE_KEYS.POST_LOGIN_REDIRECT,
                    );
                    StorageService.remove(STORAGE_KEYS.POST_LOGIN_REDIRECT);

                    if (storedRedirect) {
                        navigate(storedRedirect, { replace: true });
                    } else if (hasTenant) {
                        navigate("/", { replace: true });
                    } else {
                        navigate("/tenant", { replace: true });
                    }
                },
                onError: showApiError,
            },
        );
    };

    return {
        form,
        handleLogin,
        isPending: loginMutation.isPending,
    };
}
