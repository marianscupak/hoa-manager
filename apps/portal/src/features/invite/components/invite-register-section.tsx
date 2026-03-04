import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button, Form, FormInput } from "@hoa-mngr/ui";

const registerSchema = z.object({
    password: z.string().min(8, "invite:register.passwordPlaceholder"),
});

type RegisterValues = z.infer<typeof registerSchema>;

interface InviteRegisterSectionProps {
    onRegister: (password: string) => void;
    onCancel: () => void;
    isPending: boolean;
}

export function InviteRegisterSection({
    onRegister,
    onCancel,
    isPending,
}: InviteRegisterSectionProps) {
    const { t } = useTranslation(["invite"]);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { password: "" },
    });

    const handleSubmit = (values: RegisterValues) => {
        onRegister(values.password);
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-900">
                    {t("register.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {t("register.description")}
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                >
                    <FormInput
                        name="password"
                        label={t("register.passwordLabel")}
                        type="password"
                        placeholder={t("register.passwordPlaceholder")}
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending
                            ? t("register.submitting")
                            : t("register.submit")}
                    </Button>
                </form>
            </Form>

            <div className="text-center">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-slate-500 underline"
                >
                    {t("actions.signInDescription")}
                </button>
            </div>
        </div>
    );
}
