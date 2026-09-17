import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { showApiError } from "@/api/error-utils";
import { useAuthControllerRegister } from "@/api/generated/auth/auth";

const formSchema = z.object({
    fullName: z.string().min(1, "auth:register.invalidName"),
    email: z.string().email("auth:login.invalidEmail"),
    password: z.string().min(8, "auth:register.invalidPassword"),
});

export type RegisterFormValues = z.infer<typeof formSchema>;

export function useRegister() {
    const navigate = useNavigate();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: "", email: "", password: "" },
    });

    const registerMutation = useAuthControllerRegister();

    const handleRegister = (values: RegisterFormValues) => {
        registerMutation.mutate(
            { data: values },
            {
                // The answer is deliberately the same whether or not the
                // address is taken, so the next screen is too.
                onSuccess: () =>
                    navigate("/register/verify", {
                        state: { email: values.email },
                    }),
                onError: showApiError,
            },
        );
    };

    return { form, handleRegister, isPending: registerMutation.isPending };
}
